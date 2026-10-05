import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { getCurrentUser, requireAdmin } from "@/server/auth";
import { serializeOrder } from "@/server/serialize";
import { HttpError, handleApiError, ok } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { withLock } from "@/server/lock";
import { resolveCoupon } from "@/server/coupons";
import { sendEmailNotification, buildOrderConfirmationBody } from "@/server/notifications";
import type { OrderLineItem, Order } from "@/shared/types";

export const runtime = "nodejs";

// Shipping rules — backend authority
const FREE_SHIPPING_THRESHOLD = 300;
const BASE_SHIPPING = 29.9;
const MAX_ITEMS_PER_ORDER = 30;
const MAX_QUANTITY_PER_ITEM = 10;

function computeShipping(subtotalAfterDiscount: number): number {
  if (subtotalAfterDiscount <= 0) return 0;
  if (subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD) return 0;
  return BASE_SHIPPING;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const url = new URL(req.url);
    const mine = url.searchParams.get("mine") === "true";

    let orders;
    if (user?.role === "admin" && !mine) {
      orders = await db.order.findMany({ orderBy: { createdAt: "desc" } });
    } else if (user) {
      orders = await db.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
    } else {
      orders = [];
    }
    return ok({ orders: orders.map(serializeOrder) });
  } catch (e) {
    return handleApiError(e);
  }
}

// Serializado: checagem de estoque + baixa + cupom precisam ser atômicos.
export function POST(req: NextRequest) {
  return withLock("checkout", () => createOrder(req));
}

async function createOrder(req: NextRequest) {
  try {
    rateLimit(req, "orders:create", 30, 15 * 60 * 1000);
    const user = await getCurrentUser();
    const body = await req.json().catch(() => ({}));

    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length > MAX_ITEMS_PER_ORDER)
      throw new HttpError("Seu carrinho tem itens demais para um unico pedido.", 400);
    if (rawItems.length === 0)
      throw new HttpError("Seu carrinho está vazio.", 400);

    // Normalize + validate
    const normalized = rawItems.map((it: unknown) => {
      const item = it as Record<string, unknown>;
      return {
        productId: String(item.productId ?? ""),
        size: Number(item.size),
        quantity: Math.floor(Number(item.quantity)),
      };
    });
    if (
      normalized.some(
        (i: { productId: string; size: number; quantity: number }) =>
          !i.productId ||
          !Number.isFinite(i.size) ||
          !Number.isInteger(i.quantity) ||
          i.quantity < 1 ||
          i.quantity > MAX_QUANTITY_PER_ITEM,
      )
    ) {
      throw new HttpError("Itens do pedido inválidos.", 400);
    }

    // Resolve products from DB — backend is the single source of truth for prices
    const ids = Array.from(
      new Set(normalized.map((i: { productId: string }) => i.productId)),
    );
    const products = await db.product.findMany({ where: { id: { in: ids } } });
    const byId = new Map(products.map((p) => [p.id, p]));

    const lineItems: OrderLineItem[] = [];
    const sizeStockUpdates: { productId: string; size: number; qty: number }[] = [];
    for (const item of normalized) {
      const product = byId.get(item.productId);
      if (!product)
        throw new HttpError(`Um dos itens não está mais disponível.`, 400);
      let sizes: number[] = [];
      try {
        sizes = JSON.parse(product.sizes || "[]");
      } catch {
        sizes = [];
      }
      if (!sizes.includes(item.size))
        throw new HttpError(
          `Tamanho ${item.size} indisponível para ${product.name}.`,
          400,
        );

      // Per-size stock check (fallback to global stock if sizeStock absent/empty)
      let sizeStock: Record<string, number> = {};
      try {
        sizeStock = JSON.parse((product.sizeStock as string) || "{}");
      } catch {
        sizeStock = {};
      }
      const perSizeQty = sizeStock[String(item.size)];
      const effectiveStock =
        perSizeQty !== undefined ? perSizeQty : (product.stock as number);
      if (effectiveStock < item.quantity)
        throw new HttpError(
          `Estoque insuficiente para ${product.name} (tamanho ${item.size}).`,
          400,
        );

      const unitPrice = product.price; // backend price, never trust frontend
      const subtotal = Number((unitPrice * item.quantity).toFixed(2));
      lineItems.push({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        quantity: item.quantity,
        size: item.size,
        unitPrice,
        subtotal,
      });
      sizeStockUpdates.push({
        productId: product.id,
        size: item.size,
        qty: item.quantity,
      });
    }

    const subtotal = Number(
      lineItems.reduce((s, i) => s + i.subtotal, 0).toFixed(2),
    );

    // Coupon — backend validates + computes discount
    const couponCode = body.couponCode ? String(body.couponCode) : undefined;
    const { coupon } = await resolveCoupon(couponCode, subtotal);
    const discount = coupon?.discount ?? 0;
    const afterDiscount = Number((subtotal - discount).toFixed(2));

    const shipping = computeShipping(afterDiscount);
    const total = Number((afterDiscount + shipping).toFixed(2));

    // Validate customer / address / payment
    const customer = body.customer as Order["customer"];
    const address = body.address as Order["address"];
    const payment = body.payment as Order["payment"];
    const short = (v: unknown, max = 120) => String(v ?? "").trim().slice(0, max);
    if (customer) {
      customer.name = short(customer.name);
      customer.email = short(customer.email, 160).toLowerCase();
      customer.phone = short(customer.phone, 30);
    }
    if (address) {
      for (const k of ["cep", "street", "number", "complement", "district", "city", "state"] as const)
        address[k] = short(address[k], 120);
    }
    if (!customer?.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email ?? ""))
      throw new HttpError("Dados de contato incompletos.", 400);
    if (
      !address?.cep ||
      !address?.street ||
      !address?.number ||
      !address?.city ||
      !address?.state
    )
      throw new HttpError("Endereço de entrega incompleto.", 400);
    if (!payment?.method || !["pix", "boleto", "card", "credit", "cartao"].includes(String(payment.method)))
      throw new HttpError("Selecione a forma de pagamento.", 400);
    if (payment.cardLast4 !== undefined && !/^\d{4}$/.test(String(payment.cardLast4)))
      payment.cardLast4 = undefined;

    // Código imprevisível (não sequencial) + garantia de unicidade.
    let code = "";
    do {
      code = `AST-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    } while (await db.order.findFirst({ where: { code } }));

    const order = await db.order.create({
      data: {
        code,
        userId: user?.id ?? null,
        status: payment.method === "pix" || payment.method === "boleto" ? "paid" : "created",
        items: JSON.stringify(lineItems),
        subtotal,
        shipping,
        total,
        customer: JSON.stringify({
          name: customer.name,
          email: customer.email,
          phone: customer.phone ?? "",
        }),
        address: JSON.stringify({
          cep: address.cep,
          street: address.street,
          number: address.number,
          complement: address.complement ?? "",
          district: address.district ?? "",
          city: address.city,
          state: address.state,
        }),
        payment: JSON.stringify({
          method: payment.method,
          cardLast4: payment.cardLast4 ?? undefined,
          couponCode: coupon?.code,
          discount,
        }),
      },
    });

    // Decrement stock — both global and per-size
    for (const item of lineItems) {
      await db.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
    for (const upd of sizeStockUpdates) {
      const product = byId.get(upd.productId);
      if (!product) continue;
      let sizeStock: Record<string, number> = {};
      try {
        sizeStock = JSON.parse((product.sizeStock as string) || "{}");
      } catch {
        sizeStock = {};
      }
      const key = String(upd.size);
      if (sizeStock[key] !== undefined) {
        sizeStock[key] = Math.max(0, sizeStock[key] - upd.qty);
        await db.product.update({
          where: { id: upd.productId },
          data: { sizeStock: JSON.stringify(sizeStock) },
        });
      }
    }

    // Queue a confirmation "email" notification (mock).
    try {
      const serializedOrder = serializeOrder(order);
      await sendEmailNotification({
        type: "order_created",
        to: customer.email,
        subject: `Pedido ${order.code} confirmado · Astrofeet`,
        body: buildOrderConfirmationBody({
          code: order.code,
          customer: { name: customer.name },
          items: serializedOrder.items,
          total: serializedOrder.total,
          subtotal: serializedOrder.subtotal,
          shipping: serializedOrder.shipping,
          payment: serializedOrder.payment,
          address: serializedOrder.address,
        }),
        orderId: order.id,
      });
      // If a coupon was used, queue a coupon_applied notification too.
      if (coupon?.code) {
        await sendEmailNotification({
          type: "coupon_applied",
          to: customer.email,
          subject: `Cupom ${coupon.code} aplicado · Pedido ${order.code}`,
          body: [
            `Olá, ${customer.name}!`,
            "",
            `O cupom ${coupon.code} foi aplicado com sucesso ao seu pedido ${order.code}.`,
            "",
            coupon.type === "percent"
              ? `Desconto: ${coupon.value}% off → R$${discount.toFixed(2).replace(".", ",")}`
              : `Desconto: R$${discount.toFixed(2).replace(".", ",")}`,
            "",
            "Obrigado por explorar a galáxia com a Astrofeet! 🚀",
            "— Equipe Astrofeet",
          ].join("\n"),
          orderId: order.id,
        });
      }
    } catch {
      // Non-fatal: notification failure should never block order creation.
    }

    // Loyalty: award points to the user (1 point per R$1 spent)
    if (user) {
      try {
        const pointsEarned = Math.floor(total);
        const u = await db.user.findUnique({ where: { id: user.id } });
        let currentPoints = 0;
        try {
          currentPoints = JSON.parse((u?.loyaltyPoints as string) || "0");
          if (typeof currentPoints !== "number") currentPoints = 0;
        } catch {
          currentPoints = 0;
        }
        const newPoints = currentPoints + pointsEarned;
        await db.user.update({
          where: { id: user.id },
          data: { loyaltyPoints: JSON.stringify(newPoints) },
        });
      } catch {
        // Non-fatal: loyalty failure should never block order creation.
      }
    }

    return ok({ order: serializeOrder(order) }, 201);
  } catch (e) {
    return handleApiError(e);
  }
}

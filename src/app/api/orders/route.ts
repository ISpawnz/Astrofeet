import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { serializeOrder } from "@/lib/serialize";
import { HttpError, handleApiError, ok } from "@/lib/api";
import { sendEmailNotification, buildOrderConfirmationBody } from "@/lib/notifications";
import type { OrderLineItem, Order } from "@/lib/types";

export const runtime = "nodejs";

// Shipping rules — backend authority
const FREE_SHIPPING_THRESHOLD = 300;
const BASE_SHIPPING = 29.9;

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

interface ResolvedCoupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  description: string;
  discount: number;
}

async function resolveCoupon(
  code: string | undefined,
  subtotal: number,
): Promise<ResolvedCoupon | null> {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  if (!upper) return null;
  const coupon = await db.coupon.findFirst({
    where: { code: upper, active: true },
  });
  if (!coupon) throw new HttpError("Cupom inválido ou expirado.", 400);
  if (coupon.expiresAt) {
    const exp = new Date(coupon.expiresAt as string);
    if (exp.getTime() < Date.now())
      throw new HttpError("Este cupom expirou.", 400);
  }
  if (subtotal < (coupon.minSubtotal as number)) {
    throw new HttpError(
      `Cupom válido apenas para pedidos acima de R$${(coupon.minSubtotal as number).toFixed(2).replace(".", ",")}.`,
      400,
    );
  }
  let discount = 0;
  if (coupon.type === "percent") {
    discount = Number(((subtotal * (coupon.value as number)) / 100).toFixed(2));
  } else {
    discount = Number((coupon.value as number).toFixed(2));
  }
  discount = Math.min(discount, subtotal);
  return {
    code: coupon.code as string,
    type: coupon.type as "percent" | "fixed",
    value: coupon.value as number,
    description: coupon.description as string,
    discount,
  };
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json().catch(() => ({}));

    const rawItems = Array.isArray(body.items) ? body.items : [];
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
          i.quantity < 1,
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
    const coupon = await resolveCoupon(couponCode, subtotal);
    const discount = coupon?.discount ?? 0;
    const afterDiscount = Number((subtotal - discount).toFixed(2));

    const shipping = computeShipping(afterDiscount);
    const total = Number((afterDiscount + shipping).toFixed(2));

    // Validate customer / address / payment
    const customer = body.customer as Order["customer"];
    const address = body.address as Order["address"];
    const payment = body.payment as Order["payment"];
    if (!customer?.name || !customer?.email?.includes("@"))
      throw new HttpError("Dados de contato incompletos.", 400);
    if (
      !address?.cep ||
      !address?.street ||
      !address?.number ||
      !address?.city ||
      !address?.state
    )
      throw new HttpError("Endereço de entrega incompleto.", 400);
    if (!payment?.method)
      throw new HttpError("Selecione a forma de pagamento.", 400);

    const code = `AST-${Date.now().toString().slice(-6)}`;

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
    } catch {
      // Non-fatal: notification failure should never block order creation.
    }

    return ok({ order: serializeOrder(order) }, 201);
  } catch (e) {
    return handleApiError(e);
  }
}

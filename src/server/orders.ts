import "server-only";
import crypto from "node:crypto";
import { z } from "zod";
import { db } from "@/server/db";
import { fail, parseJSON, required, str } from "@/server/http";
import { resolveCoupon } from "@/server/coupons";
import { addPoints } from "@/server/loyalty";
import { withLock } from "@/server/lock";
import { serializeOrder } from "@/server/serialize";
import { buildOrderConfirmationBody, notifyOrderStatus, sendEmailNotification } from "@/server/notifications";
import { formatPrice } from "@/shared/format";
import { LOYALTY, round2, shippingFor, ORDER_STATUSES } from "@/shared/rules";
import type { Order, OrderLineItem, PublicUser } from "@/shared/types";

export const OrderInput = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        size: z.coerce.number(),
        quantity: z.coerce.number().int().min(1).max(10),
      }),
      { error: "Itens do pedido inválidos." },
    )
    .min(1, "Seu carrinho está vazio.")
    .max(30, "Seu carrinho tem itens demais para um único pedido."),
  couponCode: str(40).optional(),
  customer: z.object(
    {
      name: required("Dados de contato incompletos.", 120),
      email: z.string().trim().toLowerCase().email("Dados de contato incompletos.").max(160),
      phone: str(30).default(""),
    },
    { error: "Dados de contato incompletos." },
  ),
  address: z.object(
    {
      cep: required("Endereço de entrega incompleto.", 12),
      street: required("Endereço de entrega incompleto.", 120),
      number: required("Endereço de entrega incompleto.", 20),
      complement: str(120).default(""),
      district: str(120).default(""),
      city: required("Endereço de entrega incompleto.", 120),
      state: required("Endereço de entrega incompleto.", 2),
    },
    { error: "Endereço de entrega incompleto." },
  ),
  payment: z.object(
    {
      method: z.enum(["pix", "boleto", "card"], { error: "Selecione a forma de pagamento." }),
      cardLast4: z
        .string()
        .regex(/^\d{4}$/)
        .optional()
        .catch(undefined),
    },
    { error: "Selecione a forma de pagamento." },
  ),
});

const sizeStockOf = (p: Record<string, unknown>) => parseJSON<Record<string, number>>(p.sizeStock, {});

/** Cria o pedido. O servidor é a autoridade: preço, estoque, cupom e frete vêm do banco. */
export async function createOrder(input: z.infer<typeof OrderInput>, user: PublicUser | null): Promise<Order> {
  const products = await db.product.findMany({ where: { id: { in: input.items.map((i) => i.productId) } } });
  const byId = new Map(products.map((p) => [p.id, p]));

  const items: OrderLineItem[] = input.items.map(({ productId, size, quantity }) => {
    const p = byId.get(productId) ?? fail("Um dos itens não está mais disponível.");
    if (!parseJSON<number[]>(p.sizes, []).includes(size)) fail(`Tamanho ${size} indisponível para ${p.name}.`);
    if ((sizeStockOf(p)[size] ?? p.stock) < quantity) fail(`Estoque insuficiente para ${p.name} (tamanho ${size}).`);
    return {
      productId,
      slug: p.slug,
      name: p.name,
      size,
      quantity,
      unitPrice: p.price,
      subtotal: round2(p.price * quantity),
    };
  });

  const subtotal = round2(items.reduce((s, i) => s + i.subtotal, 0));
  const { coupon } = await resolveCoupon(input.couponCode, subtotal);
  const discount = coupon?.discount ?? 0;
  const shipping = shippingFor(subtotal - discount);
  const total = round2(subtotal - discount + shipping);

  // Código imprevisível (não sequencial) e único.
  let code: string;
  do code = `AST-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  while (await db.order.findFirst({ where: { code } }));

  const { method, cardLast4 } = input.payment;
  const order = serializeOrder(
    await db.order.create({
      data: {
        code,
        userId: user?.id ?? null,
        status: method === "card" ? "created" : "paid",
        items: JSON.stringify(items),
        subtotal,
        shipping,
        total,
        customer: JSON.stringify(input.customer),
        address: JSON.stringify(input.address),
        payment: JSON.stringify({ method, cardLast4, couponCode: coupon?.code, discount }),
      },
    }),
  );

  // Baixa de estoque (global e por tamanho).
  for (const i of items) {
    const p = byId.get(i.productId)!;
    const sizeStock = sizeStockOf(p);
    if (sizeStock[i.size] !== undefined) sizeStock[i.size] = Math.max(0, sizeStock[i.size] - i.quantity);
    p.sizeStock = JSON.stringify(sizeStock);
    await db.product.update({
      where: { id: p.id },
      data: { stock: { decrement: i.quantity }, sizeStock: p.sizeStock },
    });
  }

  await sendEmailNotification({
    type: "order_created",
    to: order.customer.email,
    subject: `Pedido ${order.code} confirmado · Astrofeet`,
    body: buildOrderConfirmationBody(order),
    orderId: order.id,
  });
  if (coupon)
    await sendEmailNotification({
      type: "coupon_applied",
      to: order.customer.email,
      subject: `Cupom ${coupon.code} aplicado · Pedido ${order.code}`,
      body: `Olá, ${order.customer.name}!\n\nO cupom ${coupon.code} foi aplicado ao pedido ${order.code}: -${formatPrice(discount)}.\n\n— Equipe Astrofeet`,
      orderId: order.id,
    });
  if (user) await withLock(`points:${user.id}`, () => addPoints(user.id, Math.floor(total * LOYALTY.pointsPerReal)));
  return order;
}

/** Admin vê todos (a menos que peça só os seus); cliente vê os próprios. */
export async function listOrders(user: PublicUser, mine = false) {
  const where = user.role === "admin" && !mine ? {} : { userId: user.id };
  return (await db.order.findMany({ where, orderBy: { createdAt: "desc" } })).map(serializeOrder);
}

export const StatusInput = z.enum(ORDER_STATUSES, { error: "Status inválido." });

/** Muda o status e avisa o cliente quando de fato mudou. */
export async function setOrderStatus(id: string, status: Order["status"]): Promise<Order | null> {
  const existing = await db.order.findUnique({ where: { id } });
  if (!existing) return null;
  const order = serializeOrder(await db.order.update({ where: { id }, data: { status } }));
  if (existing.status !== status) await notifyOrderStatus(order, status);
  return order;
}

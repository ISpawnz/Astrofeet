import "server-only";
import { db } from "@/server/db";
import { formatPrice, orderStatusLabel } from "@/shared/format";
import type { NotificationType, Order } from "@/shared/types";

/**
 * E-mail simulado: grava a notificação no banco (o admin vê o que seria
 * enviado). Em produção, delegaria a um provedor transacional (SES, Postmark…).
 * Nunca lança: falha de notificação não pode derrubar pedido ou cadastro.
 */
export async function sendEmailNotification(n: {
  type: NotificationType;
  to: string;
  subject: string;
  body: string;
  orderId?: string | null;
}): Promise<void> {
  try {
    await db.notification.create({ data: { ...n, orderId: n.orderId ?? null, sentAt: new Date(), status: "sent" } });
  } catch (e) {
    console.error("[notification]", e);
  }
}

export function buildOrderConfirmationBody(o: Order): string {
  const { payment: p, address: a } = o;
  return [
    `Olá, ${o.customer.name}!`,
    "",
    `Recebemos seu pedido ${o.code} e já estamos separando os seus itens.`,
    "",
    "ITENS DO PEDIDO:",
    ...o.items.map((i) => `  • ${i.name} — tam. ${i.size} × ${i.quantity} — ${formatPrice(i.subtotal)}`),
    "",
    `Subtotal: ${formatPrice(o.subtotal)}`,
    ...(p.discount ? [`Desconto (${p.couponCode}): -${formatPrice(p.discount)}`] : []),
    `Frete: ${o.shipping === 0 ? "Grátis" : formatPrice(o.shipping)}`,
    `Total: ${formatPrice(o.total)}`,
    "",
    `Entrega: ${a.street}, ${a.number} — ${a.city}/${a.state}`,
    `Pagamento: ${p.method === "card" ? `cartão final ${p.cardLast4 ?? "—"}` : p.method}`,
    "",
    "Obrigado por comprar na Astrofeet.",
    "— Equipe Astrofeet",
  ].join("\n");
}

const STATUS_NOTE: Record<string, string> = {
  paid: "Recebemos o pagamento. Seu pedido já está em preparação.",
  shipped: "Seu pedido foi enviado! Em breve ele chega na sua porta.",
  delivered: "Seu tênis chegou! Esperamos que você aproveite cada passo.",
  cancelled: "Seu pedido foi cancelado. Se isso foi um engano, fale com nosso assistente para reabrir.",
};

export function buildOrderStatusBody(o: { code: string; customerName: string; newStatus: string }): string {
  const note = STATUS_NOTE[o.newStatus];
  return [
    `Olá, ${o.customerName}!`,
    "",
    `Atualizamos o status do seu pedido ${o.code}.`,
    "",
    `Novo status: ${orderStatusLabel(o.newStatus)}.`,
    ...(note ? ["", note] : []),
    "",
    "— Equipe Astrofeet",
  ].join("\n");
}

/** Notifica a mudança de status de um pedido já serializado. */
export function notifyOrderStatus(order: Order, newStatus: string) {
  return sendEmailNotification({
    type: "order_status",
    to: order.customer.email,
    subject: `Pedido ${order.code} · status atualizado`,
    body: buildOrderStatusBody({ code: order.code, customerName: order.customer.name, newStatus }),
    orderId: order.id,
  });
}

import "server-only";
import { db } from "@/server/db";
import type { NotificationType, Order } from "@/shared/types";

const ORDER_STATUS_LABELS: Record<string, string> = {
  created: "Recebido",
  paid: "Pago",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

/**
 * Mock email-sender. Records a notification in the DB so the admin can see
 * what would have been emailed to the customer. In production this would
 * delegate to a real transactional email provider (e.g. SES, Postmark).
 *
 * Returns the persisted notification id.
 */
export async function sendEmailNotification(payload: {
  type: NotificationType;
  to: string;
  subject: string;
  body: string;
  orderId?: string | null;
}): Promise<string> {
  const created = await db.notification.create({
    data: {
      type: payload.type,
      to: payload.to,
      subject: payload.subject,
      body: payload.body,
      orderId: payload.orderId ?? null,
      sentAt: new Date(),
      status: "sent",
    },
  });
  return created.id as string;
}

/** Build a friendly order-confirmation email body in pt-BR. */
export function buildOrderConfirmationBody(order: {
  code: string;
  customer: { name: string };
  items: Order["items"];
  total: number;
  subtotal: number;
  shipping: number;
  payment: Order["payment"];
  address: Order["address"];
}): string {
  const itemLines = order.items
    .map(
      (i) =>
        `  • ${i.name} — tam. ${i.size} × ${i.quantity} — R$${i.subtotal.toFixed(2).replace(".", ",")}`,
    )
    .join("\n");
  const discount =
    typeof order.payment.discount === "number" && order.payment.discount > 0
      ? `\nDesconto (${order.payment.couponCode}): -R$${order.payment.discount.toFixed(2).replace(".", ",")}`
      : "";
  return [
    `Olá, ${order.customer.name}!`,
    "",
    `Recebemos seu pedido ${order.code} e já estamos preparando sua caixa estelar.`,
    "",
    "ITENS DO PEDIDO:",
    itemLines,
    "",
    `Subtotal: R$${order.subtotal.toFixed(2).replace(".", ",")}${discount}`,
    `Frete: ${order.shipping === 0 ? "Grátis" : `R$${order.shipping.toFixed(2).replace(".", ",")}`}`,
    `Total: R$${order.total.toFixed(2).replace(".", ",")}`,
    "",
    `Entrega: ${order.address.street}, ${order.address.number} — ${order.address.city}/${order.address.state}`,
    `Pagamento: ${order.payment.method === "card" ? `cartão final ${order.payment.cardLast4 ?? "—"}` : order.payment.method}`,
    "",
    "Obrigado por explorar a galáxia com a Astrofeet. 🚀",
    "— Equipe Astrofeet",
  ].join("\n");
}

/** Build a status-update email body. */
export function buildOrderStatusBody(opts: {
  code: string;
  customerName: string;
  newStatus: string;
}): string {
  const label = ORDER_STATUS_LABELS[opts.newStatus] ?? opts.newStatus;
  const lines: string[] = [
    `Olá, ${opts.customerName}!`,
    "",
    `Atualizamos o status do seu pedido ${opts.code}.`,
    "",
    `Novo status: ${label}.`,
  ];
  if (opts.newStatus === "shipped") {
    lines.push(
      "",
      "Seu sneaker acabou de decolar! Em breve ele estará pousando na sua porta.",
    );
  } else if (opts.newStatus === "delivered") {
    lines.push(
      "",
      "Seu sneaker chegou! Esperamos que você aproveite cada passo pela galáxia. ✨",
    );
  } else if (opts.newStatus === "cancelled") {
    lines.push(
      "",
      "Seu pedido foi cancelado. Se isso foi um engano, fale com a Nave para reabrir.",
    );
  } else if (opts.newStatus === "paid") {
    lines.push("", "Recebemos o pagamento. Seu pedido já está em preparação.");
  }
  lines.push("", "— Equipe Astrofeet");
  return lines.join("\n");
}

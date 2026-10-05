import { requireUser } from "@/server/auth";
import { route } from "@/server/http";
import { listOrders } from "@/server/orders";
import type { Order } from "@/shared/types";

export const runtime = "nodejs";

// Neutraliza "CSV injection" (células iniciadas por = + - @ viram fórmula no Excel) e escapa aspas.
const cell = (v: unknown) => {
  const s = String(v ?? "").replace(/^[=+\-@\t\r]/, "'$&");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const COLUMNS: [string, (o: Order) => unknown][] = [
  ["Código", (o) => o.code],
  ["Status", (o) => o.status],
  ["Data", (o) => new Date(o.createdAt).toLocaleString("pt-BR")],
  ["Cliente", (o) => o.customer.name],
  ["E-mail", (o) => o.customer.email],
  ["Telefone", (o) => o.customer.phone],
  ["CEP", (o) => o.address.cep],
  ["Cidade", (o) => o.address.city],
  ["Estado", (o) => o.address.state],
  ["Método de pagamento", (o) => o.payment.method],
  ["Cupom", (o) => o.payment.couponCode],
  ["Desconto", (o) => o.payment.discount ?? 0],
  ["Subtotal", (o) => o.subtotal],
  ["Frete", (o) => o.shipping],
  ["Total", (o) => o.total],
  ["Itens", (o) => o.items.map((i) => `${i.name} (tam. ${i.size} × ${i.quantity})`).join("; ")],
];

// GET /api/orders/export?format=csv|json — pedidos do usuário (admin: todos).
export const GET = route(async (req) => {
  const orders = await listOrders(await requireUser());
  const json = new URL(req.url).searchParams.get("format") === "json";
  const content = json
    ? JSON.stringify({ orders }, null, 2)
    : "﻿" +
      [COLUMNS.map(([h]) => h), ...orders.map((o) => COLUMNS.map(([, get]) => get(o)))]
        .map((r) => r.map(cell).join(","))
        .join("\n");
  return new Response(content, {
    headers: {
      "Content-Type": json ? "application/json" : "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos-astrofeet-${Date.now()}.${json ? "json" : "csv"}"`,
    },
  });
});

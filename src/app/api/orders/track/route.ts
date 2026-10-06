import { db } from "@/server/db";
import { fail, parseJSON, route } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { serializeOrder } from "@/server/serialize";

export const runtime = "nodejs";

// Consulta pública de pedido. Código + e-mail são obrigatórios (sem o e-mail,
// quem adivinhasse um código veria nome e cidade) e "não existe" / "e-mail não
// confere" dão a mesma resposta, para não permitir enumeração.
export const GET = route(async (req) => {
  rateLimit(req, "orders:track", 20, 10 * 60 * 1000);
  const q = new URL(req.url).searchParams;
  const code = (q.get("code") ?? "").trim().toUpperCase();
  const email = (q.get("email") ?? "").trim().toLowerCase();
  if (!code || !email) fail("Informe o código do pedido e o e-mail da compra.");

  const row = await db.order.findFirst({ where: { code } });
  const sameEmail = parseJSON<{ email?: string }>(row?.customer, {}).email?.toLowerCase() === email;
  if (!row || !sameEmail) fail("Pedido não encontrado para este código e e-mail.", 404);

  const o = serializeOrder(row);
  return {
    order: {
      code: o.code,
      status: o.status,
      total: o.total,
      subtotal: o.subtotal,
      shipping: o.shipping,
      items: o.items.map(({ name, quantity, size, unitPrice, subtotal }) => ({
        name,
        quantity,
        size,
        unitPrice,
        subtotal,
      })),
      customerName: o.customer.name,
      city: o.address.city,
      state: o.address.state,
      paymentMethod: o.payment.method,
      createdAt: o.createdAt,
    },
  };
});

import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { serializeOrder } from "@/server/serialize";
import { HttpError, handleApiError, ok } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";

// Public order lookup by code (no auth required) — used by the order tracking page.
// Only returns a trimmed public shape (no internal id leaks beyond what's needed).
export async function GET(req: NextRequest) {
  try {
    rateLimit(req, "orders:track", 20, 10 * 60 * 1000);
    const url = new URL(req.url);
    const code = (url.searchParams.get("code") || "").trim().toUpperCase();
    const email = (url.searchParams.get("email") || "").trim().toLowerCase();

    // Código + e-mail são obrigatórios: sem o e-mail, qualquer pessoa que
    // adivinhasse um código veria nome e cidade do cliente.
    if (!code || !email)
      throw new HttpError("Informe o código do pedido e o e-mail da compra.", 400);

    const order = await db.order.findFirst({ where: { code } });
    let orderEmail = "";
    try {
      orderEmail = String(JSON.parse((order?.customer as string) || "{}").email ?? "").toLowerCase();
    } catch {
      /* noop */
    }
    // Mesma resposta para "não existe" e "e-mail não confere" (sem enumeração).
    if (!order || orderEmail !== email)
      throw new HttpError("Pedido não encontrado para este código e e-mail.", 404);

    const full = serializeOrder(order);
    return ok({
      order: {
        code: full.code,
        status: full.status,
        total: full.total,
        subtotal: full.subtotal,
        shipping: full.shipping,
        items: full.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          size: i.size,
          unitPrice: i.unitPrice,
          subtotal: i.subtotal,
        })),
        customerName: full.customer.name,
        city: full.address.city,
        state: full.address.state,
        paymentMethod: full.payment.method,
        createdAt: full.createdAt,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}

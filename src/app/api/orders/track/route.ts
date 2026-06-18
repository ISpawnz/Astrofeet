import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { serializeOrder } from "@/lib/serialize";
import { HttpError, handleApiError, ok } from "@/lib/api";

export const runtime = "nodejs";

// Public order lookup by code (no auth required) — used by the order tracking page.
// Only returns a trimmed public shape (no internal id leaks beyond what's needed).
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = (url.searchParams.get("code") || "").trim().toUpperCase();
    const email = (url.searchParams.get("email") || "").trim().toLowerCase();

    if (!code) throw new HttpError("Informe o código do pedido.", 400);

    const order = await db.order.findFirst({ where: { code } });
    if (!order) throw new HttpError("Pedido não encontrado.", 404);

    // If email provided, it must match (light verification for non-authed lookup).
    if (email) {
      let customer = { email: "" };
      try {
        customer = JSON.parse(order.customer as string);
      } catch {
        /* noop */
      }
      if ((customer as { email: string }).email.toLowerCase() !== email) {
        throw new HttpError(
          "O e-mail informado não corresponde a este pedido.",
          403,
        );
      }
    }

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

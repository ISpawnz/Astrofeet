import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { serializeOrder } from "@/lib/serialize";
import { HttpError, handleApiError, ok } from "@/lib/api";
import { sendEmailNotification, buildOrderStatusBody } from "@/lib/notifications";

export const runtime = "nodejs";

const VALID = ["created", "paid", "shipped", "delivered", "cancelled"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const status = String(body.status ?? "");
    if (!VALID.includes(status))
      throw new HttpError("Status inválido.", 400);
    const existing = await db.order.findUnique({ where: { id } });
    if (!existing) throw new HttpError("Pedido não encontrado.", 404);
    const previousStatus = existing.status as string;
    const updated = await db.order.update({
      where: { id },
      data: { status },
    });
    const serialized = serializeOrder(updated);

    // Queue a status-update "email" only if the status actually changed.
    if (previousStatus !== status) {
      try {
        await sendEmailNotification({
          type: "order_status",
          to: serialized.customer.email,
          subject: `Pedido ${serialized.code} · status atualizado`,
          body: buildOrderStatusBody({
            code: serialized.code,
            customerName: serialized.customer.name,
            newStatus: status,
          }),
          orderId: updated.id,
        });
      } catch {
        // Non-fatal: notification failure should not block the status update.
      }
    }

    return ok({ order: serialized });
  } catch (e) {
    return handleApiError(e);
  }
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { serializeOrder } from "@/lib/serialize";
import { HttpError, handleApiError, ok } from "@/lib/api";
import { sendEmailNotification, buildOrderStatusBody } from "@/lib/notifications";

export const runtime = "nodejs";

const VALID = ["created", "paid", "shipped", "delivered", "cancelled"];

// POST /api/admin/bulk-status
// Body: { orderIds: string[], status: string }
// Updates multiple orders' status at once and queues notifications.
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const orderIds = Array.isArray(body.orderIds) ? body.orderIds : [];
    const status = String(body.status ?? "");

    if (orderIds.length === 0)
      throw new HttpError("Selecione ao menos um pedido.", 400);
    if (!VALID.includes(status))
      throw new HttpError("Status inválido.", 400);

    const results: { id: string; code: string; success: boolean }[] = [];
    for (const id of orderIds) {
      try {
        const existing = await db.order.findUnique({ where: { id } });
        if (!existing) {
          results.push({ id, code: "?", success: false });
          continue;
        }
        const previousStatus = existing.status as string;
        const updated = await db.order.update({
          where: { id },
          data: { status },
        });
        const serialized = serializeOrder(updated);

        // Queue status-update notification if status actually changed
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
            // Non-fatal
          }
        }
        results.push({ id, code: updated.code, success: true });
      } catch {
        results.push({ id, code: "?", success: false });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    return ok({
      updated: successCount,
      total: orderIds.length,
      results,
    });
  } catch (e) {
    return handleApiError(e);
  }
}

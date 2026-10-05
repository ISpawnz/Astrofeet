import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { getCurrentUser, requireAdmin } from "@/server/auth";
import { serializeNotification } from "@/server/serialize";
import { HttpError, handleApiError, ok } from "@/server/http";
import type { NotificationType } from "@/shared/types";

export const runtime = "nodejs";

// GET /api/notifications — admin: list recent notifications (most recent first).
// Non-admin: list notifications sent to their own email (so customers can see
// the mock emails "they received").
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new HttpError("Não autenticado.", 401);

    const url = new URL(req.url);
    const limit = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get("limit") ?? "50")),
    );

    let records;
    if (user.role === "admin") {
      records = await db.notification.findMany({
        orderBy: { sentAt: "desc" },
      });
    } else {
      records = await db.notification.findMany({
        where: { to: user.email },
        orderBy: { sentAt: "desc" },
      });
    }
    return ok({
      notifications: records
        .slice(0, limit)
        .map(serializeNotification),
    });
  } catch (e) {
    return handleApiError(e);
  }
}

// POST /api/notifications — internal use: queue a notification "email".
// Body: { type, to, subject, body, orderId? }
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const type = String(body.type ?? "order_created") as NotificationType;
    const to = String(body.to ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const bodyText = String(body.body ?? "").trim();
    const orderId = body.orderId ? String(body.orderId) : null;

    if (!to || !to.includes("@"))
      throw new HttpError("Destinatário inválido.", 400);
    if (!subject) throw new HttpError("Assunto obrigatório.", 400);

    const created = await db.notification.create({
      data: {
        type,
        to,
        subject,
        body: bodyText,
        orderId,
        sentAt: new Date(),
        status: "sent",
      },
    });
    return ok(
      { notification: serializeNotification(created as unknown as Parameters<typeof serializeNotification>[0]) },
      201,
    );
  } catch (e) {
    return handleApiError(e);
  }
}

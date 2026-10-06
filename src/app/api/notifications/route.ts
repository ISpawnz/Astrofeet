import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { serializeNotification } from "@/server/serialize";
import { route } from "@/server/http";

export const runtime = "nodejs";

// GET /api/notifications — admin vê todas; cliente vê as enviadas ao seu e-mail.
export const GET = route(async (req) => {
  const user = await requireUser();
  const limit = Math.min(100, Math.max(1, Number(new URL(req.url).searchParams.get("limit")) || 50));
  const rows = await db.notification.findMany({
    where: user.role === "admin" ? {} : { to: user.email },
    orderBy: { sentAt: "desc" },
    take: limit,
  });
  return { notifications: rows.map(serializeNotification) };
});

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { HttpError, handleApiError, ok } from "@/lib/api";

export const runtime = "nodejs";

// GET /api/stock-alerts — list the authenticated user's stock alert subscriptions
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new HttpError("Não autenticado.", 401);
    // Stock alerts are stored as a JSON array on the user record (subscribedProductIds).
    const u = await db.user.findUnique({ where: { id: user.id } });
    let ids: string[] = [];
    try {
      ids = JSON.parse((u?.stockAlerts as string) || "[]");
    } catch {
      ids = [];
    }
    return ok({ productIds: ids });
  } catch (e) {
    return handleApiError(e);
  }
}

// POST /api/stock-alerts — subscribe to a product's stock alert
// Body: { productId: string }
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new HttpError("Não autenticado.", 401);
    const body = await req.json().catch(() => ({}));
    const productId = String(body.productId ?? "");
    if (!productId) throw new HttpError("Produto inválido.", 400);

    const u = await db.user.findUnique({ where: { id: user.id } });
    let ids: string[] = [];
    try {
      ids = JSON.parse((u?.stockAlerts as string) || "[]");
    } catch {
      ids = [];
    }
    if (!ids.includes(productId)) {
      ids.push(productId);
      await db.user.update({
        where: { id: user.id },
        data: { stockAlerts: JSON.stringify(ids) },
      });
    }
    return ok({ productIds: ids, subscribed: true }, 201);
  } catch (e) {
    return handleApiError(e);
  }
}

// DELETE /api/stock-alerts?productId=... — unsubscribe
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new HttpError("Não autenticado.", 401);
    const url = new URL(req.url);
    const productId = url.searchParams.get("productId") || "";
    if (!productId) throw new HttpError("Produto inválido.", 400);

    const u = await db.user.findUnique({ where: { id: user.id } });
    let ids: string[] = [];
    try {
      ids = JSON.parse((u?.stockAlerts as string) || "[]");
    } catch {
      ids = [];
    }
    const next = ids.filter((x) => x !== productId);
    await db.user.update({
      where: { id: user.id },
      data: { stockAlerts: JSON.stringify(next) },
    });
    return ok({ productIds: next, subscribed: false });
  } catch (e) {
    return handleApiError(e);
  }
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { serializeOrder } from "@/lib/serialize";
import { HttpError, handleApiError, ok } from "@/lib/api";

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
    const updated = await db.order.update({
      where: { id },
      data: { status },
    });
    return ok({ order: serializeOrder(updated) });
  } catch (e) {
    return handleApiError(e);
  }
}

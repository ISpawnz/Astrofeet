import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { serializeCoupon } from "@/server/serialize";
import { HttpError, handleApiError, ok } from "@/server/http";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) throw new HttpError("Cupom não encontrado.", 404);

    const data: Record<string, unknown> = {};
    if (typeof body.active === "boolean") data.active = body.active;
    if (typeof body.description === "string" && body.description.trim())
      data.description = body.description.trim();
    if (body.value !== undefined) {
      const value = Number(body.value);
      if (!Number.isFinite(value) || value <= 0)
        throw new HttpError("Valor deve ser maior que zero.", 400);
      if (existing.type === "percent" && value > 100)
        throw new HttpError("Percentual não pode exceder 100%.", 400);
      data.value = value;
    }
    if (body.minSubtotal !== undefined) {
      const minSubtotal = Number(body.minSubtotal);
      if (!Number.isFinite(minSubtotal) || minSubtotal < 0)
        throw new HttpError("Subtotal mínimo inválido.", 400);
      data.minSubtotal = minSubtotal;
    }
    if (body.expiresAt !== undefined) {
      data.expiresAt = body.expiresAt ? String(body.expiresAt) : null;
    }
    if (body.code !== undefined) {
      const code = String(body.code).trim().toUpperCase();
      if (!/^[A-Z0-9]{3,20}$/.test(code))
        throw new HttpError("Código inválido.", 400);
      data.code = code;
    }

    const updated = await db.coupon.update({ where: { id }, data });
    return ok({ coupon: serializeCoupon(updated) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) throw new HttpError("Cupom não encontrado.", 404);
    await db.coupon.delete({ where: { id } });
    return ok({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}

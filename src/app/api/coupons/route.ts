import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { serializeCoupon } from "@/lib/serialize";
import { HttpError, handleApiError, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    return ok({ coupons: coupons.map(serializeCoupon) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const code = String(body.code ?? "")
      .trim()
      .toUpperCase();
    const type = String(body.type ?? "");
    const value = Number(body.value);
    const minSubtotal = Number(body.minSubtotal ?? 0);
    const description = String(body.description ?? "").trim();
    const active = body.active !== false;
    const expiresAt = body.expiresAt ? String(body.expiresAt) : null;

    if (!/^[A-Z0-9]{3,20}$/.test(code))
      throw new HttpError(
        "Código inválido. Use 3 a 20 caracteres (A-Z, 0-9).",
        400,
      );
    if (type !== "percent" && type !== "fixed")
      throw new HttpError("Tipo deve ser 'percent' ou 'fixed'.", 400);
    if (!Number.isFinite(value) || value <= 0)
      throw new HttpError("Valor deve ser maior que zero.", 400);
    if (type === "percent" && value > 100)
      throw new HttpError("Percentual não pode exceder 100%.", 400);
    if (!Number.isFinite(minSubtotal) || minSubtotal < 0)
      throw new HttpError("Subtotal mínimo inválido.", 400);
    if (!description) throw new HttpError("Descrição é obrigatória.", 400);

    const existing = await db.coupon.findFirst({ where: { code } });
    if (existing) throw new HttpError("Já existe um cupom com esse código.", 409);

    const created = await db.coupon.create({
      data: {
        code,
        type,
        value,
        minSubtotal,
        active,
        description,
        expiresAt,
      },
    });
    return ok({ coupon: serializeCoupon(created) }, 201);
  } catch (e) {
    return handleApiError(e);
  }
}

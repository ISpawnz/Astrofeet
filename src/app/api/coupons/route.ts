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
    const orders = await db.order.findMany({});
    // Tally usage per coupon code by scanning the payment JSON.
    const usageByCode = new Map<string, { count: number; totalDiscount: number }>();
    for (const o of orders) {
      try {
        const payment = JSON.parse((o.payment as string) || "{}") as {
          couponCode?: string;
          discount?: number;
        };
        if (payment.couponCode) {
          const code = String(payment.couponCode).toUpperCase();
          const prev = usageByCode.get(code) ?? { count: 0, totalDiscount: 0 };
          prev.count += 1;
          prev.totalDiscount += Number(payment.discount ?? 0);
          usageByCode.set(code, prev);
        }
      } catch {
        /* ignore malformed payment JSON */
      }
    }
    const serialized = coupons.map((c) => {
      const base = serializeCoupon(c);
      const usage = usageByCode.get((c.code as string).toUpperCase());
      return {
        ...base,
        usageCount: usage?.count ?? 0,
        totalDiscount: Number((usage?.totalDiscount ?? 0).toFixed(2)),
      };
    });
    return ok({ coupons: serialized });
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

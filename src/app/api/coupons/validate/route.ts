import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { HttpError, handleApiError, ok } from "@/lib/api";

export const runtime = "nodejs";

// Live coupon preview: validates a coupon code against a subtotal and returns
// the discount amount + description, WITHOUT applying it. Used by the checkout
// to show the user the discount before they finalize.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.code ?? "").trim().toUpperCase();
    const subtotal = Number(body.subtotal ?? 0);

    if (!code) throw new HttpError("Informe um cupom.", 400);
    if (!Number.isFinite(subtotal) || subtotal < 0)
      throw new HttpError("Subtotal inválido.", 400);

    const coupon = await db.coupon.findFirst({
      where: { code, active: true },
    });
    if (!coupon) throw new HttpError("Cupom inválido ou expirado.", 400);

    if (coupon.expiresAt) {
      const exp = new Date(coupon.expiresAt as string);
      if (exp.getTime() < Date.now())
        throw new HttpError("Este cupom expirou.", 400);
    }

    const minSubtotal = coupon.minSubtotal as number;
    if (subtotal < minSubtotal) {
      return ok({
        valid: false,
        code: coupon.code,
        description: coupon.description,
        minSubtotal,
        discount: 0,
        message: `Válido apenas acima de R$${minSubtotal.toFixed(2).replace(".", ",")}.`,
      });
    }

    let discount = 0;
    if (coupon.type === "percent") {
      discount = Number(((subtotal * (coupon.value as number)) / 100).toFixed(2));
    } else {
      discount = Number((coupon.value as number).toFixed(2));
    }
    discount = Math.min(discount, subtotal);

    return ok({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      description: coupon.description,
      discount,
    });
  } catch (e) {
    return handleApiError(e);
  }
}

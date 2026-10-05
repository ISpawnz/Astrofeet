import { NextRequest } from "next/server";
import { HttpError, handleApiError, ok } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { resolveCoupon } from "@/server/coupons";

export const runtime = "nodejs";

// Prévia do cupom (não aplica). Mesma regra do checkout (server/coupons.ts).
// Com rate limit para impedir enumeração de códigos por força bruta.
export async function POST(req: NextRequest) {
  try {
    rateLimit(req, "coupons:validate", 30, 10 * 60 * 1000);
    const body = await req.json().catch(() => ({}));
    const code = String(body.code ?? "").trim().toUpperCase().slice(0, 40);
    const subtotal = Number(body.subtotal ?? 0);

    if (!code) throw new HttpError("Informe um cupom.", 400);
    if (!Number.isFinite(subtotal) || subtotal < 0)
      throw new HttpError("Subtotal inválido.", 400);

    const { coupon, belowMin } = await resolveCoupon(code, subtotal, { soft: true });
    if (!coupon) {
      const min = belowMin ?? 0;
      return ok({
        valid: false,
        code,
        description: "",
        minSubtotal: min,
        discount: 0,
        message: `Válido apenas acima de R$${min.toFixed(2).replace(".", ",")}.`,
      });
    }
    return ok({ valid: true, ...coupon });
  } catch (e) {
    return handleApiError(e);
  }
}

import { z } from "zod";
import { body, route } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { resolveCoupon } from "@/server/coupons";
import { formatPrice } from "@/shared/format";

export const runtime = "nodejs";

const Preview = z.object({
  code: z.string().trim().toUpperCase().min(1, "Informe um cupom.").max(40),
  subtotal: z.coerce.number().min(0, "Subtotal inválido."),
});

// Prévia do cupom (não aplica). Mesma regra do checkout; rate limit contra enumeração de códigos.
export const POST = route(async (req) => {
  rateLimit(req, "coupons:validate", 30, 10 * 60 * 1000);
  const { code, subtotal } = await body(req, Preview);
  const { coupon, belowMin = 0 } = await resolveCoupon(code, subtotal, { soft: true });
  return coupon
    ? { valid: true, ...coupon }
    : {
        valid: false,
        code,
        description: "",
        minSubtotal: belowMin,
        discount: 0,
        message: `Válido apenas acima de ${formatPrice(belowMin)}.`,
      };
});

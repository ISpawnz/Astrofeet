import "server-only";
import { db } from "@/server/db";
import { z } from "zod";
import { fail, parseJSON, required } from "@/server/http";
import { formatPrice } from "@/shared/format";
import { round2 } from "@/shared/rules";

export interface ResolvedCoupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  description: string;
  discount: number;
}

/** Uso de cada cupom (pedidos não cancelados): código → { count, totalDiscount }. */
export async function couponUsage() {
  const usage = new Map<string, { count: number; totalDiscount: number }>();
  for (const o of await db.order.findMany({ where: { status: { not: "cancelled" } } })) {
    const p = parseJSON<{ couponCode?: string; discount?: number }>(o.payment, {});
    if (!p.couponCode) continue;
    const u = usage.get(p.couponCode.toUpperCase()) ?? { count: 0, totalDiscount: 0 };
    u.count++;
    u.totalDiscount = round2(u.totalDiscount + Number(p.discount ?? 0));
    usage.set(p.couponCode.toUpperCase(), u);
  }
  return usage;
}

/**
 * Regra única de cupom — usada pelo preview (/coupons/validate) e pela criação
 * do pedido, para que as duas nunca divirjam. Lança HttpError se inválido.
 * Com `soft`, subtotal abaixo do mínimo devolve { belowMin } em vez de lançar.
 */
export async function resolveCoupon(
  rawCode: string | undefined,
  subtotal: number,
  opts: { soft?: boolean } = {},
): Promise<{ coupon: ResolvedCoupon | null; belowMin?: number }> {
  const code = (rawCode ?? "").trim().toUpperCase();
  if (!code) return { coupon: null };

  const c = (await db.coupon.findFirst({ where: { code, active: true } })) ?? fail("Cupom inválido ou expirado.");
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) fail("Este cupom expirou.");
  if (typeof c.maxUses === "number" && ((await couponUsage()).get(code)?.count ?? 0) >= c.maxUses)
    fail("Este cupom já foi utilizado.");

  if (subtotal < c.minSubtotal) {
    if (opts.soft) return { coupon: null, belowMin: c.minSubtotal };
    fail(`Cupom válido apenas para pedidos acima de ${formatPrice(c.minSubtotal)}.`);
  }
  const discount = Math.min(round2(c.type === "percent" ? (subtotal * c.value) / 100 : c.value), subtotal);
  return { coupon: { code, type: c.type, value: c.value, description: c.description, discount } };
}

/** Campos editáveis de um cupom (criação e edição no admin). */
export const CouponFields = {
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{3,20}$/, "Código inválido. Use 3 a 20 caracteres (A-Z, 0-9)."),
  value: z.coerce.number().positive("Valor deve ser maior que zero."),
  minSubtotal: z.coerce.number().min(0, "Subtotal mínimo inválido."),
  description: required("Descrição é obrigatória.", 200),
  active: z.boolean(),
  expiresAt: z
    .string()
    .nullish()
    .transform((v) => v || null),
};

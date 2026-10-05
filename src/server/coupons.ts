import "server-only";
import { db } from "@/server/db";
import { HttpError } from "@/server/http";

export interface ResolvedCoupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  description: string;
  discount: number;
}

const brl = (n: number) => n.toFixed(2).replace(".", ",");

/** Quantos pedidos (não cancelados) já usaram este cupom. */
async function countUses(code: string): Promise<number> {
  const orders = await db.order.findMany({});
  let n = 0;
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    try {
      const p = JSON.parse((o.payment as string) || "{}") as { couponCode?: string };
      if (p.couponCode === code) n++;
    } catch {
      /* ignore */
    }
  }
  return n;
}

/**
 * Regra única de cupom — usada pelo preview (/coupons/validate) e pela criação
 * do pedido, para que as duas nunca divirjam. Lança HttpError se inválido.
 * Com `soft`, subtotal abaixo do mínimo devolve { coupon, belowMin } em vez de lançar.
 */
export async function resolveCoupon(
  rawCode: string | undefined,
  subtotal: number,
  opts: { soft?: boolean } = {},
): Promise<{ coupon: ResolvedCoupon | null; belowMin?: number }> {
  const code = (rawCode ?? "").trim().toUpperCase();
  if (!code) return { coupon: null };

  const c = await db.coupon.findFirst({ where: { code, active: true } });
  if (!c) throw new HttpError("Cupom inválido ou expirado.", 400);

  if (c.expiresAt && new Date(c.expiresAt as string).getTime() < Date.now())
    throw new HttpError("Este cupom expirou.", 400);

  const maxUses = typeof c.maxUses === "number" ? c.maxUses : null;
  if (maxUses !== null && (await countUses(code)) >= maxUses)
    throw new HttpError("Este cupom já foi utilizado.", 400);

  const min = c.minSubtotal as number;
  if (subtotal < min) {
    if (opts.soft) return { coupon: null, belowMin: min };
    throw new HttpError(`Cupom válido apenas para pedidos acima de R$${brl(min)}.`, 400);
  }

  const value = c.value as number;
  const raw = c.type === "percent" ? (subtotal * value) / 100 : value;
  const discount = Math.min(Number(raw.toFixed(2)), subtotal);

  return {
    coupon: {
      code,
      type: c.type as "percent" | "fixed",
      value,
      description: c.description as string,
      discount,
    },
  };
}

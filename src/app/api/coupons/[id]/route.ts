import { z } from "zod";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { serializeCoupon } from "@/server/serialize";
import { CouponFields } from "@/server/coupons";
import { body, fail, route } from "@/server/http";

export const runtime = "nodejs";

const findCoupon = async (id: string) =>
  (await db.coupon.findUnique({ where: { id } })) ?? fail("Cupom não encontrado.", 404);

export const PATCH = route(async (req, { id }) => {
  await requireAdmin();
  const existing = await findCoupon(id);
  const data = await body(req, z.object(CouponFields).partial());
  if (existing.type === "percent" && (data.value ?? 0) > 100) fail("Percentual não pode exceder 100%.");
  return { coupon: serializeCoupon(await db.coupon.update({ where: { id }, data })) };
});

export const DELETE = route(async (_req, { id }) => {
  await requireAdmin();
  await findCoupon(id);
  await db.coupon.delete({ where: { id } });
  return { ok: true };
});

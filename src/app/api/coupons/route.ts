import { z } from "zod";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { serializeCoupon } from "@/server/serialize";
import { couponUsage, CouponFields } from "@/server/coupons";
import { body, fail, ok, route } from "@/server/http";

export const runtime = "nodejs";

const NewCoupon = z
  .object({
    ...CouponFields,
    type: z.enum(["percent", "fixed"], { error: "Tipo deve ser 'percent' ou 'fixed'." }),
    minSubtotal: CouponFields.minSubtotal.default(0),
    active: CouponFields.active.default(true),
  })
  .refine((c) => c.type !== "percent" || c.value <= 100, "Percentual não pode exceder 100%.");

export const GET = route(async () => {
  await requireAdmin();
  const [coupons, usage] = await Promise.all([db.coupon.findMany({ orderBy: { createdAt: "desc" } }), couponUsage()]);
  return {
    coupons: coupons.map((c) => {
      const u = usage.get(c.code);
      return { ...serializeCoupon(c), usageCount: u?.count ?? 0, totalDiscount: u?.totalDiscount ?? 0 };
    }),
  };
});

export const POST = route(async (req) => {
  await requireAdmin();
  const data = await body(req, NewCoupon);
  if (await db.coupon.findFirst({ where: { code: data.code } })) fail("Já existe um cupom com esse código.", 409);
  return ok({ coupon: serializeCoupon(await db.coupon.create({ data })) }, 201);
});

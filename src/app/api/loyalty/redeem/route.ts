import crypto from "node:crypto";
import { z } from "zod";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { body, fail, ok, route } from "@/server/http";
import { sendEmailNotification } from "@/server/notifications";
import { withLock } from "@/server/lock";
import { rateLimit } from "@/server/rate-limit";
import { addPoints, getPoints } from "@/server/loyalty";
import { formatPrice } from "@/shared/format";
import { LOYALTY, round2 } from "@/shared/rules";

export const runtime = "nodejs";

const Redeem = z.object({
  points: z.coerce.number().int().min(LOYALTY.minRedeem, `Mínimo de ${LOYALTY.minRedeem} pontos para resgatar.`),
});

// POST /api/loyalty/redeem — troca pontos por um cupom de valor fixo, de uso único.
export const POST = route(async (req) => {
  rateLimit(req, "loyalty:redeem", 10, 15 * 60 * 1000);
  const user = await requireUser();
  const { points } = await body(req, Redeem);
  // Serializado por usuário: impede gastar os mesmos pontos em requisições paralelas.
  return withLock(`points:${user.id}`, async () => {
    if (points > (await getPoints(user.id))) fail("Pontos insuficientes.");
    const pointsRemaining = await addPoints(user.id, -points);
    const discount = round2(points * LOYALTY.brlPerPoint);
    const code = `STARS${points}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const description = `Resgate de ${points} pontos`;
    const coupon = await db.coupon.create({
      data: {
        code,
        type: "fixed",
        value: discount,
        minSubtotal: 0,
        active: true,
        maxUses: 1,
        description,
        expiresAt: null,
      },
    });
    await sendEmailNotification({
      type: "coupon_applied",
      to: user.email,
      subject: `Cupom ${code} resgatado · ${points} pontos`,
      body: `Olá, ${user.name}!\n\nVocê trocou ${points} pontos por um cupom de ${formatPrice(discount)}.\nUse o código ${code} no checkout.\n\nPontos restantes: ${pointsRemaining}\n\n— Equipe Astrofeet`,
    });
    return ok(
      { coupon: { id: coupon.id, code, type: "fixed", value: discount, description }, pointsRemaining, discount },
      201,
    );
  });
});

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { HttpError, handleApiError, ok } from "@/lib/api";
import { sendEmailNotification } from "@/lib/notifications";

export const runtime = "nodejs";

const POINTS_TO_BRL_RATE = 0.05;
const MIN_REDEEM_POINTS = 100;

function parsePoints(stored: string | undefined): number {
  if (!stored) return 0;
  try {
    const v = JSON.parse(stored);
    return typeof v === "number" ? v : 0;
  } catch {
    return 0;
  }
}

// POST /api/loyalty/redeem — redeem points for a discount coupon
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new HttpError("Não autenticado.", 401);

    const body = await req.json().catch(() => ({}));
    const pointsToRedeem = Math.floor(Number(body.points ?? 0));

    if (pointsToRedeem < MIN_REDEEM_POINTS)
      throw new HttpError(`Mínimo de ${MIN_REDEEM_POINTS} pontos para resgatar.`, 400);

    const u = await db.user.findUnique({ where: { id: user.id } });
    const currentPoints = parsePoints(u?.loyaltyPoints as string | undefined);

    if (pointsToRedeem > currentPoints)
      throw new HttpError("Pontos insuficientes.", 400);

    // Deduct points
    const newPoints = currentPoints - pointsToRedeem;
    await db.user.update({
      where: { id: user.id },
      data: { loyaltyPoints: JSON.stringify(newPoints) },
    });

    // Create a fixed-amount coupon
    const discount = Number((pointsToRedeem * POINTS_TO_BRL_RATE).toFixed(2));
    const code = `STARS${pointsToRedeem}-${Date.now().toString().slice(-4)}`;
    const coupon = await db.coupon.create({
      data: {
        code,
        type: "fixed",
        value: discount,
        minSubtotal: 0,
        active: true,
        description: `Resgate de ${pointsToRedeem} pontos estelares`,
        expiresAt: null,
      },
    });

    // Queue a notification
    try {
      await sendEmailNotification({
        type: "coupon_applied",
        to: user.email,
        subject: `Cupom ${code} resgatado · ${pointsToRedeem} pontos`,
        body: [
          `Olá, ${user.name}!`,
          "",
          `Você resgatou ${pointsToRedeem} pontos estelares por um cupom de R$${discount.toFixed(2).replace(".", ",")}!`,
          "",
          `Use o código ${code} no checkout para aplicar o desconto.`,
          "",
          `Pontos restantes: ${newPoints}`,
          "",
          "— Equipe Astrofeet",
        ].join("\n"),
      });
    } catch {
      // Non-fatal
    }

    return ok({
      coupon: {
        id: coupon.id,
        code,
        type: "fixed",
        value: discount,
        description: `Resgate de ${pointsToRedeem} pontos estelares`,
      },
      pointsRemaining: newPoints,
      discount,
    }, 201);
  } catch (e) {
    return handleApiError(e);
  }
}

import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { HttpError, handleApiError, ok } from "@/server/http";
import { sendEmailNotification } from "@/server/notifications";
import { withLock } from "@/server/lock";
import { rateLimit } from "@/server/rate-limit";
import crypto from "node:crypto";

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
    rateLimit(req, "loyalty:redeem", 10, 15 * 60 * 1000);
    const user = await getCurrentUser();
    if (!user) throw new HttpError("Não autenticado.", 401);
    // Serializado por usuário: impede gastar os mesmos pontos em requisições paralelas.
    return await withLock(`points:${user.id}`, () => redeem(req, user));
  } catch (e) {
    return handleApiError(e);
  }
}

async function redeem(req: NextRequest, user: { id: string; email: string; name: string }) {
  try {

    const body = await req.json().catch(() => ({}));
    const pointsToRedeem = Math.floor(Number(body.points ?? 0));
    if (!Number.isFinite(pointsToRedeem)) throw new HttpError("Quantidade inválida.", 400);

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
    const code = `STARS${pointsToRedeem}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const coupon = await db.coupon.create({
      data: {
        code,
        type: "fixed",
        value: discount,
        minSubtotal: 0,
        active: true,
        maxUses: 1, // cupom de resgate vale para um único pedido
        description: `Resgate de ${pointsToRedeem} pontos`,
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
          `Você resgatou ${pointsToRedeem} pontos por um cupom de R$${discount.toFixed(2).replace(".", ",")}!`,
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
        description: `Resgate de ${pointsToRedeem} pontos`,
      },
      pointsRemaining: newPoints,
      discount,
    }, 201);
  } catch (e) {
    return handleApiError(e);
  }
}

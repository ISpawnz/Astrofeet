import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { HttpError, handleApiError, ok } from "@/server/http";
import { sendEmailNotification } from "@/server/notifications";

export const runtime = "nodejs";

// Points earned per real spent (1 point per R$1)
const POINTS_PER_REAL = 1;
// Redemption rate: 100 points = R$5 discount
const POINTS_TO_BRL_RATE = 0.05; // 1 point = R$0.05
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

// GET /api/loyalty — returns the user's points balance + history
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new HttpError("Não autenticado.", 401);

    const u = await db.user.findUnique({ where: { id: user.id } });
    const points = parsePoints(u?.loyaltyPoints as string | undefined);

    // Build a simple history from orders (points earned = floor(total))
    const orders = await db.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    const history = orders.map((o) => {
      let total = 0;
      try { total = Number(o.total); } catch { total = 0; }
      return {
        type: "earned" as const,
        points: Math.floor(total * POINTS_PER_REAL),
        description: `Pedido ${o.code}`,
        date: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
      };
    });

    return ok({
      points,
      pointsValue: Number((points * POINTS_TO_BRL_RATE).toFixed(2)),
      pointsPerReal: POINTS_PER_REAL,
      pointsToBrlRate: POINTS_TO_BRL_RATE,
      minRedeemPoints: MIN_REDEEM_POINTS,
      history,
    });
  } catch (e) {
    return handleApiError(e);
  }
}

// POST /api/loyalty/redeem — redeem points for a discount coupon
// Body: { points: number }
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

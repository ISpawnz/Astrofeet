import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { route } from "@/server/http";
import { getPoints } from "@/server/loyalty";
import { LOYALTY, round2 } from "@/shared/rules";

export const runtime = "nodejs";

// GET /api/loyalty — saldo de pontos + histórico (1 ponto por R$1 em cada pedido).
export const GET = route(async () => {
  const user = await requireUser();
  const [points, orders] = await Promise.all([
    getPoints(user.id),
    db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);
  return {
    points,
    pointsValue: round2(points * LOYALTY.brlPerPoint),
    pointsPerReal: LOYALTY.pointsPerReal,
    pointsToBrlRate: LOYALTY.brlPerPoint,
    minRedeemPoints: LOYALTY.minRedeem,
    history: orders.map((o) => ({
      type: "earned" as const,
      points: Math.floor(o.total * LOYALTY.pointsPerReal),
      description: `Pedido ${o.code}`,
      date: new Date(o.createdAt).toISOString(),
    })),
  };
});

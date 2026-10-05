import "server-only";
import { db } from "@/server/db";
import { parseJSON } from "@/server/http";

// Pontos ficam no registro do usuário (campo loyaltyPoints, JSON numérico).
export async function getPoints(userId: string): Promise<number> {
  const n = parseJSON<unknown>((await db.user.findUnique({ where: { id: userId } }))?.loyaltyPoints, 0);
  return typeof n === "number" ? n : 0;
}

export async function addPoints(userId: string, delta: number): Promise<number> {
  const points = Math.max(0, (await getPoints(userId)) + delta);
  await db.user.update({ where: { id: userId }, data: { loyaltyPoints: JSON.stringify(points) } });
  return points;
}

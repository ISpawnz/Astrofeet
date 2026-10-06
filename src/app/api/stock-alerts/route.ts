import { z } from "zod";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { body, fail, ok, parseJSON, route } from "@/server/http";

export const runtime = "nodejs";

// Inscrições de "avise-me quando voltar" ficam no usuário (stockAlerts: JSON de ids).
async function alerts(userId: string, update?: (ids: string[]) => string[]) {
  const ids = parseJSON<string[]>((await db.user.findUnique({ where: { id: userId } }))?.stockAlerts, []);
  if (!update) return ids;
  const next = update(ids);
  await db.user.update({ where: { id: userId }, data: { stockAlerts: JSON.stringify(next) } });
  return next;
}

export const GET = route(async () => ({ productIds: await alerts((await requireUser()).id) }));

export const POST = route(async (req) => {
  const user = await requireUser();
  const { productId } = await body(req, z.object({ productId: z.string().min(1, "Produto inválido.") }));
  const productIds = await alerts(user.id, (ids) => (ids.includes(productId) ? ids : [...ids, productId]));
  return ok({ productIds, subscribed: true }, 201);
});

export const DELETE = route(async (req) => {
  const user = await requireUser();
  const productId = new URL(req.url).searchParams.get("productId") || fail("Produto inválido.");
  return { productIds: await alerts(user.id, (ids) => ids.filter((x) => x !== productId)), subscribed: false };
});

import { z } from "zod";
import { db } from "@/server/db";
import { getCurrentUser, publicUser, requireUser } from "@/server/auth";
import { body, route, str } from "@/server/http";

export const runtime = "nodejs";

export const GET = route(async () => ({ user: await getCurrentUser() }));

// PATCH /api/auth/me — atualiza o nome do usuário logado.
export const PATCH = route(async (req) => {
  const user = await requireUser();
  const { name } = await body(req, z.object({ name: str(80).min(2, "Nome precisa ter ao menos 2 caracteres.") }));
  return { user: publicUser(await db.user.update({ where: { id: user.id }, data: { name } })) };
});

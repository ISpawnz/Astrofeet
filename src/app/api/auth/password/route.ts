import { z } from "zod";
import { db } from "@/server/db";
import { hashPassword, requireUser, setSessionCookie, verifyPassword } from "@/server/auth";
import { body, fail, password, route } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";

const Change = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual."),
    newPassword: password("A nova senha precisa ter ao menos 8 caracteres."),
  })
  .refine((b) => b.currentPassword !== b.newPassword, "A nova senha precisa ser diferente da atual.");

// POST /api/auth/password — troca a senha. Sessões em outros aparelhos caem
// (o token carrega uma impressão da senha); esta sessão recebe um cookie novo.
export const POST = route(async (req) => {
  rateLimit(req, "auth:password", 8, 15 * 60 * 1000);
  const user = await requireUser();
  const { currentPassword, newPassword } = await body(req, Change);
  const record = (await db.user.findUnique({ where: { id: user.id } })) ?? fail("Conta não encontrada.", 404);
  if (!verifyPassword(currentPassword, record.passwordHash as string)) fail("Senha atual incorreta.");
  await setSessionCookie(
    await db.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(newPassword) } }),
  );
  return { ok: true };
});

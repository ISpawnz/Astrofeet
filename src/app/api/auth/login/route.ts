import { z } from "zod";
import { db } from "@/server/db";
import { setSessionCookie, verifyPassword, hashPassword, publicUser } from "@/server/auth";
import { body, fail, route } from "@/server/http";
import { rateLimit, rateLimitKey } from "@/server/rate-limit";

export const runtime = "nodejs";

const DUMMY_HASH = hashPassword("astrofeet-dummy-password");
const Login = z.object({
  email: z.string().trim().toLowerCase().email("E-mail ou senha inválidos."),
  password: z.string().min(8, "E-mail ou senha inválidos."),
});

export const POST = route(async (req) => {
  rateLimit(req, "auth:login", 10, 15 * 60 * 1000);
  const { email, password } = await body(req, Login);
  rateLimitKey("auth:login", email, 8, 15 * 60 * 1000);
  const user = await db.user.findUnique({ where: { email } });
  // Sem usuário também roda o scrypt: o tempo de resposta não revela se o e-mail existe.
  const valid = verifyPassword(password, user ? (user.passwordHash as string) : DUMMY_HASH);
  if (!user || !valid) fail("E-mail ou senha incorretos.", 401);
  await setSessionCookie(user);
  return { user: publicUser(user) };
});

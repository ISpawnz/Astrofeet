import { z } from "zod";
import { db } from "@/server/db";
import { hashPassword, publicUser, setSessionCookie } from "@/server/auth";
import { body, email, fail, password, route, str } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { sendEmailNotification } from "@/server/notifications";

export const runtime = "nodejs";

const Register = z.object({ name: str(80).min(2, "Informe seu nome."), email, password: password() });

export const POST = route(async (req) => {
  rateLimit(req, "auth:register", 5, 15 * 60 * 1000);
  const { name, email, password } = await body(req, Register);
  if (await db.user.findUnique({ where: { email } })) fail("Este e-mail já está cadastrado.", 409);
  const user = await db.user.create({ data: { name, email, passwordHash: hashPassword(password), role: "customer" } });
  await setSessionCookie(user);
  await sendEmailNotification({
    type: "welcome",
    to: email,
    subject: `Bem-vindo à Astrofeet, ${name}!`,
    body: [
      `Olá, ${name}!`,
      "",
      "Que bom ter você na Astrofeet!",
      "",
      "Aqui você encontra lançamentos exclusivos, frete grátis acima de R$300 e 30 dias para trocar ou devolver.",
      "",
      "Use o cupom GALAXIA10 para 10% off na sua primeira compra!",
      "",
      "— Equipe Astrofeet",
    ].join("\n"),
  });
  return { user: publicUser(user) };
});

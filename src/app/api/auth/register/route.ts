import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { hashPassword, setSessionCookie } from "@/server/auth";
import { HttpError, handleApiError, ok } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { sendEmailNotification } from "@/server/notifications";
import type { Role } from "@/shared/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    rateLimit(req, "auth:register", 5, 15 * 60 * 1000);
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (name.length < 2) throw new HttpError("Informe seu nome.", 400);
    if (!email.includes("@")) throw new HttpError("E-mail inválido.", 400);
    if (password.length < 8)
      throw new HttpError("A senha precisa ter ao menos 8 caracteres.", 400);

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) throw new HttpError("Este e-mail já está cadastrado.", 409);

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        role: "customer",
      },
    });
    await setSessionCookie(user.id, "customer", user.email, user.name);

    // Queue a welcome notification (mock email).
    try {
      await sendEmailNotification({
        type: "welcome",
        to: email,
        subject: `Bem-vindo à Astrofeet, ${name}!`,
        body: [
          `Olá, ${name}!`,
          "",
          "Que bom ter você na Astrofeet!",
          "",
          "Aqui você encontra drops exclusivos, frete grátis acima de R$300 e 30 dias para trocar ou devolver.",
          "",
          "Fique de olho: lançamentos chegam o tempo todo. Use o cupom GALAXIA10 para 10% off na sua primeira compra!",
          "",
          "Boa exploração,",
          "— Equipe Astrofeet",
        ].join("\n"),
      });
    } catch {
      // Non-fatal: notification failure should never block registration.
    }

    return ok({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as Role,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}

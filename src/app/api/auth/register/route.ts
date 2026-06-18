import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { HttpError, handleApiError, ok } from "@/lib/api";
import { sendEmailNotification } from "@/lib/notifications";
import type { Role } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (name.length < 2) throw new HttpError("Informe seu nome.", 400);
    if (!email.includes("@")) throw new HttpError("E-mail inválido.", 400);
    if (password.length < 6)
      throw new HttpError("A senha precisa ter ao menos 6 caracteres.", 400);

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
        subject: `Bem-vindo à Astrofeet, ${name}! 🚀`,
        body: [
          `Olá, ${name}!`,
          "",
          "Bem-vindo à Astrofeet — sua nova navegação por sneakers de outro planeta!",
          "",
          "Aqui você encontra drops exclusivos, frete grátis acima de R$300 e 30 dias para trocar ou devolver.",
          "",
          "Fique de olhos abertos: novidades chegam o tempo todo. Use o cupom GALAXIA10 para 10% off na sua primeira compra!",
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

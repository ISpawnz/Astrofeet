import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { HttpError, handleApiError, ok } from "@/lib/api";
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

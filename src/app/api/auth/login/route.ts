import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { setSessionCookie, verifyPassword, hashPassword } from "@/server/auth";
import { HttpError, handleApiError, ok } from "@/server/http";
import { rateLimit, rateLimitKey } from "@/server/rate-limit";
import type { Role } from "@/shared/types";

export const runtime = "nodejs";

const DUMMY_HASH = hashPassword("astrofeet-dummy-password");

export async function POST(req: NextRequest) {
  try {
    rateLimit(req, "auth:login", 10, 15 * 60 * 1000);
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!email.includes("@") || password.length < 8) {
      throw new HttpError("E-mail ou senha inválidos.", 400);
    }
    rateLimitKey("auth:login", email, 8, 15 * 60 * 1000);
    const user = await db.user.findUnique({ where: { email } });
    // Sem usuário também rodamos o scrypt, para o tempo de resposta não revelar
    // se o e-mail existe.
    const hash = user ? (user.passwordHash as string) : DUMMY_HASH;
    const valid = verifyPassword(password, hash);
    if (!user || !valid) {
      throw new HttpError("E-mail ou senha incorretos.", 401);
    }
    await setSessionCookie(
      user.id as string,
      user.role as Role,
      user.email as string,
      user.name as string,
    );
    return ok({
      user: {
        id: user.id as string,
        name: user.name as string,
        email: user.email as string,
        role: user.role as Role,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}

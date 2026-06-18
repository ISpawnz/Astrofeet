import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { HttpError, handleApiError, ok } from "@/lib/api";
import type { Role } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!email.includes("@") || password.length < 6) {
      throw new HttpError("E-mail ou senha inválidos.", 400);
    }
    const user = await db.user.findUnique({ where: { email } });
    if (!user) throw new HttpError("E-mail ou senha incorretos.", 401);
    if (!verifyPassword(password, user.passwordHash as string)) {
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

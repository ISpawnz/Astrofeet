import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { getCurrentUser, setSessionCookie } from "@/server/auth";
import { verifyPassword, hashPassword } from "@/server/crypto";
import { HttpError, handleApiError, ok } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import type { Role } from "@/shared/types";

export const runtime = "nodejs";

// POST /api/auth/password — change the authenticated user's password.
// Body: { currentPassword: string, newPassword: string }
export async function POST(req: NextRequest) {
  try {
    rateLimit(req, "auth:password", 8, 15 * 60 * 1000);
    const user = await getCurrentUser();
    if (!user) throw new HttpError("Não autenticado.", 401);

    const body = await req.json().catch(() => ({}));
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");

    if (!currentPassword)
      throw new HttpError("Informe sua senha atual.", 400);
    if (newPassword.length < 8)
      throw new HttpError("A nova senha precisa ter ao menos 8 caracteres.", 400);
    if (newPassword.length > 100)
      throw new HttpError("A nova senha é longa demais.", 400);
    if (currentPassword === newPassword)
      throw new HttpError("A nova senha precisa ser diferente da atual.", 400);

    const record = await db.user.findUnique({ where: { id: user.id } });
    if (!record) throw new HttpError("Conta não encontrada.", 404);

    const stored = record.passwordHash as string;
    if (!verifyPassword(currentPassword, stored))
      throw new HttpError("Senha atual incorreta.", 400);

    const newHash = hashPassword(newPassword);
    const updated = await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // Re-sign the session cookie to keep it fresh.
    await setSessionCookie(
      updated.id as string,
      updated.role as Role,
      updated.email as string,
      updated.name as string,
    );

    return ok({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}

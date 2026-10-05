import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { getCurrentUser, setSessionCookie } from "@/server/auth";
import { HttpError, handleApiError, ok } from "@/server/http";
import type { Role } from "@/shared/types";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  return ok({ user });
}

// PATCH /api/auth/me — update the authenticated user's profile (name only for now).
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new HttpError("Não autenticado.", 401);

    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    if (name.length < 2)
      throw new HttpError("Nome precisa ter ao menos 2 caracteres.", 400);

    const updated = await db.user.update({
      where: { id: user.id },
      data: { name },
    });

    // Re-sign the session cookie so the new name is reflected immediately.
    await setSessionCookie(
      updated.id as string,
      updated.role as Role,
      updated.email as string,
      updated.name as string,
    );

    return ok({
      user: {
        id: updated.id as string,
        name: updated.name as string,
        email: updated.email as string,
        role: updated.role as Role,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}

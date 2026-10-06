import "server-only";
import { cookies } from "next/headers";
import { db } from "@/server/db";
import { hashPassword, verifyPassword, signToken, verifyToken, passwordStamp, SESSION_MAX_AGE } from "@/server/crypto";
import { fail } from "@/server/http";
import type { PublicUser, Role } from "@/shared/types";

export { hashPassword, verifyPassword };

const COOKIE = "astrofeet_session";
type UserRow = Record<string, unknown>;

export const publicUser = (u: UserRow): PublicUser => ({
  id: u.id as string,
  name: u.name as string,
  email: u.email as string,
  role: u.role as Role,
});

export async function setSessionCookie(user: UserRow) {
  (await cookies()).set(COOKIE, signToken(user.id as string, passwordStamp(user.passwordHash as string)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    priority: "high",
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE);
}

// O cookie só prova quem é o usuário; conta, papel e senha atual são sempre
// relidos do banco. Admin rebaixado/removido ou senha trocada derruba a sessão na hora.
export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  const session = token ? verifyToken(token) : null;
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.uid } });
  if (!user || passwordStamp(user.passwordHash as string) !== session.pwd) return null;
  return publicUser(user);
}

export async function requireUser(): Promise<PublicUser> {
  return (await getCurrentUser()) ?? fail("Não autenticado.", 401);
}

export async function requireAdmin(): Promise<PublicUser> {
  const user = await requireUser();
  return user.role === "admin" ? user : fail("Acesso restrito.", 403);
}

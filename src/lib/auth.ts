import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
} from "@/lib/crypto";
import type { PublicUser, Role } from "@/lib/types";

export { hashPassword, verifyPassword };

const COOKIE_NAME = "astrofeet_session";

export async function setSessionCookie(
  userId: string,
  role: Role,
  email: string,
  name: string,
) {
  const token = signToken({ uid: userId, role, email, name });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const session = await getSession();
  if (!session) return null;
  return {
    id: session.uid,
    name: session.name,
    email: session.email,
    role: session.role,
  };
}

export async function requireAdmin(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Não autenticado.", 401);
  }
  if (user.role !== "admin") {
    throw new AuthError("Acesso restrito.", 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function resolveUserByEmail(email: string) {
  return db.user.findUnique({ where: { email: email.toLowerCase() } });
}

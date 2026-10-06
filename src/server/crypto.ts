import "server-only";
import crypto from "node:crypto";

// Hash de senha + token de sessão assinado (sem dependência do banco, evita ciclos).

const DEV_SECRET = "astrofeet-dev-secret-change-me-in-production-please";
const WEEK = 60 * 60 * 24 * 7;

function secret(): string {
  const s = process.env.ASTROFEET_AUTH_SECRET;
  if (process.env.NODE_ENV === "production" && (!s || s.length < 32))
    throw new Error("ASTROFEET_AUTH_SECRET deve ter pelo menos 32 caracteres em producao.");
  return s || DEV_SECRET;
}

const hmac = (data: string) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");
const safeEqual = (a: string, b: string) =>
  a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [alg, salt, expected] = stored.split("$");
  if (alg !== "scrypt" || !salt || !expected) return false;
  return safeEqual(crypto.scryptSync(password, salt, 64).toString("hex"), expected);
}

/** Impressão curta do hash da senha: muda quando a senha muda e invalida tokens antigos. */
export const passwordStamp = (hash: string) => hmac(hash).slice(0, 12);

interface TokenPayload {
  uid: string;
  pwd: string;
  exp: number;
}

export const SESSION_MAX_AGE = WEEK;

export function signToken(uid: string, pwd: string): string {
  const data = Buffer.from(JSON.stringify({ uid, pwd, exp: Math.floor(Date.now() / 1000) + WEEK })).toString(
    "base64url",
  );
  return `${data}.${hmac(data)}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const [data, sig] = token.split(".");
  if (!data || !sig || !safeEqual(sig, hmac(data))) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as TokenPayload;
    return payload.exp >= Date.now() / 1000 ? payload : null;
  } catch {
    return null;
  }
}

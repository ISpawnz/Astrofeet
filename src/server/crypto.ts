import "server-only";
import crypto from "node:crypto";

// Password hashing + token signing utilities (no DB dependency, to avoid cycles).

const DEV_SECRET = "astrofeet-dev-secret-change-me-in-production-please";

function getAuthSecret(): string {
  const secret = process.env.ASTROFEET_AUTH_SECRET;

  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
    throw new Error("ASTROFEET_AUTH_SECRET deve ter pelo menos 32 caracteres em producao.");
  }

  return secret || DEV_SECRET;
}

function buf(key: string): Buffer {
  return crypto.createHash("sha256").update(key).digest();
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") return false;
    const salt = parts[1];
    const expected = parts[2];
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected));
  } catch {
    return false;
  }
}

interface TokenPayload {
  uid: string;
  role: "customer" | "admin";
  email: string;
  name: string;
  iat: number;
  exp: number;
}

export function signToken(
  payload: Omit<TokenPayload, "iat" | "exp">,
): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24 * 7;
  const body: TokenPayload = { ...payload, iat, exp };
  const data = Buffer.from(JSON.stringify(body)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", buf(getAuthSecret()))
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const [data, sig] = token.split(".");
    if (!data || !sig) return null;
    const expected = crypto
      .createHmac("sha256", buf(getAuthSecret()))
      .update(data)
      .digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
      return null;
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8"),
    ) as TokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

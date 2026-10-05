import "server-only";
import { NextRequest } from "next/server";
import { HttpError } from "@/server/http";

type Bucket = {
  count: number;
  resetAt: number;
};

const g = globalThis as unknown as { __astrofeet_buckets?: Map<string, Bucket> };
const buckets = (g.__astrofeet_buckets ??= new Map<string, Bucket>());
let lastSweep = 0;

// Evita crescimento infinito do Map (um bucket por IP/chave).
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}

function clientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || req.headers.get("x-real-ip") || "local";
}

function hit(bucketKey: string, limit: number, windowMs: number) {
  const now = Date.now();
  sweep(now);
  const current = buckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return;
  }

  current.count += 1;

  if (current.count > limit) {
    const retry = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    throw new HttpError(`Muitas tentativas. Tente novamente em ${retry}s.`, 429);
  }
}

/** Limite por IP. */
export function rateLimit(req: NextRequest, key: string, limit: number, windowMs: number) {
  hit(`${key}:ip:${clientIp(req)}`, limit, windowMs);
}

/** Limite por identificador (ex.: e-mail), independente do IP — freia
 *  ataques distribuídos de força bruta contra uma conta específica. */
export function rateLimitKey(key: string, id: string, limit: number, windowMs: number) {
  hit(`${key}:id:${id.toLowerCase()}`, limit, windowMs);
}

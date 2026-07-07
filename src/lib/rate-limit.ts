import "server-only";
import { NextRequest } from "next/server";
import { HttpError } from "@/lib/api";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function clientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || req.headers.get("x-real-ip") || "local";
}

export function rateLimit(req: NextRequest, key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucketKey = `${key}:${clientIp(req)}`;
  const current = buckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return;
  }

  current.count += 1;

  if (current.count > limit) {
    throw new HttpError("Muitas tentativas. Tente novamente em instantes.", 429);
  }
}

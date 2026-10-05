import { clearSessionCookie } from "@/server/auth";
import { ok } from "@/server/http";

export const runtime = "nodejs";

export async function POST() {
  await clearSessionCookie();
  return ok({ ok: true });
}

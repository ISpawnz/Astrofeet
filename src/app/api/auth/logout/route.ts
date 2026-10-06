import { clearSessionCookie } from "@/server/auth";
import { route } from "@/server/http";

export const runtime = "nodejs";

export const POST = route(async () => {
  await clearSessionCookie();
  return { ok: true };
});

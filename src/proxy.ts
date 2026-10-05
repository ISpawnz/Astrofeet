import { NextRequest, NextResponse } from "next/server";

// Proxy (antigo middleware): primeira barreira de segurança da API.
// Bloqueia requisições que alteram estado (POST/PUT/PATCH/DELETE) vindas de
// outras origens (CSRF). O cookie de sessão já é SameSite=Lax; isto é defesa
// em profundidade e cobre navegadores/clients que ignoram SameSite.

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function allowedHosts(req: NextRequest): Set<string> {
  const hosts = new Set<string>();
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) hosts.add(host.toLowerCase());
  for (const extra of (process.env.ASTROFEET_ALLOWED_ORIGINS ?? "").split(",")) {
    const v = extra.trim().toLowerCase();
    if (!v) continue;
    try {
      hosts.add(new URL(v).host);
    } catch {
      hosts.add(v);
    }
  }
  return hosts;
}

function forbidden() {
  return NextResponse.json({ message: "Origem não permitida." }, { status: 403 });
}

export function proxy(req: NextRequest) {
  if (!MUTATING.has(req.method)) return NextResponse.next();

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (!allowedHosts(req).has(new URL(origin).host.toLowerCase())) return forbidden();
    } catch {
      return forbidden();
    }
  } else if (req.headers.get("sec-fetch-site") === "cross-site") {
    return forbidden();
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};

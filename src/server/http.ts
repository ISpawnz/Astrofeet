import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export class HttpError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

/** Lança um erro HTTP (uso: `cond || fail("msg")`). */
export function fail(message: string, status = 400): never {
  throw new HttpError(message, status);
}

export const ok = <T>(data: T, status = 200) => NextResponse.json(data, { status });

function toResponse(e: unknown) {
  if (e instanceof HttpError) return ok({ message: e.message }, e.status);
  if ((e as { code?: string })?.code === "P2025") return ok({ message: "Registro não encontrado." }, 404);
  console.error("[api error]", e);
  return ok({ message: "Erro interno do servidor." }, 500);
}

type Ctx = { params: Promise<Record<string, string>> };

/**
 * Envolve um handler: erros viram JSON com o status certo e um objeto
 * retornado vira `200 OK` (devolva `ok(x, 201)` para outro status).
 */
export function route(handler: (req: NextRequest, params: Record<string, string>) => unknown) {
  return async (req: NextRequest, ctx: Ctx) => {
    try {
      const out = await handler(req, ctx?.params ? await ctx.params : {});
      return out instanceof Response ? out : ok(out);
    } catch (e) {
      return toResponse(e);
    }
  };
}

/** Lê e valida o corpo JSON; a primeira mensagem de erro do schema vira 400. */
export async function body<S extends z.ZodType>(req: NextRequest, schema: S): Promise<z.infer<S>> {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  return parsed.data;
}

/** JSON.parse tolerante para os campos serializados do banco. */
export function parseJSON<T>(raw: unknown, fallback: T): T {
  try {
    return (typeof raw === "string" && raw ? JSON.parse(raw) : fallback) ?? fallback;
  } catch {
    return fallback;
  }
}

// Campos reutilizados pelos schemas.
export const str = (max = 200) => z.string().trim().max(max);
export const required = (msg: string, max = 200) => str(max).min(1, msg);
export const email = z.string().trim().toLowerCase().email("E-mail inválido.").max(160);
export const password = (msg = "A senha precisa ter ao menos 8 caracteres.") =>
  z.string().min(8, msg).max(100, "Senha longa demais.");

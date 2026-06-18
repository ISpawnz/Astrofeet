import { NextResponse } from "next/server";

export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export function handleApiError(e: unknown) {
  if (e instanceof HttpError) return jsonError(e.message, e.status);
  // Prisma known errors
  const prismaError = e as { code?: string; message?: string };
  if (prismaError?.code === "P2002") {
    return jsonError("Registro duplicado. Esse dado já existe.", 409);
  }
  if (prismaError?.code === "P2025") {
    return jsonError("Registro não encontrado.", 404);
  }
  console.error("[api error]", e);
  const msg =
    e instanceof Error ? e.message : "Algo deu errado. Tente novamente.";
  return jsonError(msg, 500);
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

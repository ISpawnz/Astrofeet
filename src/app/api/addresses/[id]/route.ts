import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { serializeAddress } from "@/lib/serialize";
import { HttpError, handleApiError, ok } from "@/lib/api";

export const runtime = "nodejs";

// GET /api/addresses/[id] — fetch a single address (must belong to the user).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new HttpError("Não autenticado.", 401);
    const { id } = await params;
    const addr = await db.address.findUnique({ where: { id } });
    if (!addr || addr.userId !== user.id)
      throw new HttpError("Endereço não encontrado.", 404);
    return ok({ address: serializeAddress(addr as unknown as Parameters<typeof serializeAddress>[0]) });
  } catch (e) {
    return handleApiError(e);
  }
}

// PATCH /api/addresses/[id] — update an existing address.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new HttpError("Não autenticado.", 401);
    const { id } = await params;
    const addr = await db.address.findUnique({ where: { id } });
    if (!addr || addr.userId !== user.id)
      throw new HttpError("Endereço não encontrado.", 404);

    const body = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};

    if (body.label !== undefined) {
      const label = String(body.label).trim();
      if (!label) throw new HttpError("Apelido não pode ser vazio.", 400);
      data.label = label;
    }
    if (body.recipient !== undefined) {
      const recipient = String(body.recipient).trim();
      if (recipient.length < 2)
        throw new HttpError("Informe o nome de quem recebe.", 400);
      data.recipient = recipient;
    }
    if (body.cep !== undefined) {
      const cep = String(body.cep).replace(/\D/g, "");
      if (cep.length !== 8) throw new HttpError("CEP inválido.", 400);
      data.cep = cep;
    }
    if (body.street !== undefined) data.street = String(body.street).trim();
    if (body.number !== undefined) data.number = String(body.number).trim();
    if (body.complement !== undefined)
      data.complement = String(body.complement).trim();
    if (body.district !== undefined)
      data.district = String(body.district).trim();
    if (body.city !== undefined) data.city = String(body.city).trim();
    if (body.state !== undefined) {
      const state = String(body.state).trim().toUpperCase();
      if (state.length !== 2) throw new HttpError("UF inválida.", 400);
      data.state = state;
    }
    if (body.isDefault !== undefined) {
      const isDefault = Boolean(body.isDefault);
      if (isDefault) {
        // unset previous default
        const existing = await db.address.findMany({
          where: { userId: user.id, isDefault: true },
        });
        for (const a of existing) {
          if (a.id !== id) {
            await db.address.update({
              where: { id: a.id },
              data: { isDefault: false },
            });
          }
        }
      }
      data.isDefault = isDefault;
    }

    const updated = await db.address.update({
      where: { id },
      data,
    });
    return ok({ address: serializeAddress(updated as unknown as Parameters<typeof serializeAddress>[0]) });
  } catch (e) {
    return handleApiError(e);
  }
}

// DELETE /api/addresses/[id] — delete an address.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new HttpError("Não autenticado.", 401);
    const { id } = await params;
    const addr = await db.address.findUnique({ where: { id } });
    if (!addr || addr.userId !== user.id)
      throw new HttpError("Endereço não encontrado.", 404);
    await db.address.delete({ where: { id } });
    return ok({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}

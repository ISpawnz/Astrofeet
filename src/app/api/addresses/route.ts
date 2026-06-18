import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { serializeAddress } from "@/lib/serialize";
import { HttpError, handleApiError, ok } from "@/lib/api";
import type { Address } from "@/lib/types";

export const runtime = "nodejs";

// GET /api/addresses — list the authenticated user's saved addresses.
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new HttpError("Não autenticado.", 401);
    const records = await db.address.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    // Default address always comes first
    const sorted = [...records].sort((a, b) => {
      const ad = a.isDefault ? 1 : 0;
      const bd = b.isDefault ? 1 : 0;
      if (ad !== bd) return bd - ad;
      return 0;
    });
    return ok({ addresses: sorted.map(serializeAddress) });
  } catch (e) {
    return handleApiError(e);
  }
}

// POST /api/addresses — create a new saved address for the user.
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new HttpError("Não autenticado.", 401);

    const body = await req.json().catch(() => ({}));
    const label = String(body.label ?? "").trim();
    const recipient = String(body.recipient ?? "").trim();
    const cep = String(body.cep ?? "").replace(/\D/g, "");
    const street = String(body.street ?? "").trim();
    const number = String(body.number ?? "").trim();
    const complement = String(body.complement ?? "").trim();
    const district = String(body.district ?? "").trim();
    const city = String(body.city ?? "").trim();
    const state = String(body.state ?? "").trim().toUpperCase();
    const isDefault = Boolean(body.isDefault);

    if (!label) throw new HttpError("Dê um apelido ao endereço.", 400);
    if (!recipient || recipient.length < 2)
      throw new HttpError("Informe o nome de quem recebe.", 400);
    if (cep.length !== 8)
      throw new HttpError("CEP inválido. Use 8 dígitos.", 400);
    if (!street) throw new HttpError("Informe a rua.", 400);
    if (!number) throw new HttpError("Informe o número.", 400);
    if (!city) throw new HttpError("Informe a cidade.", 400);
    if (state.length !== 2) throw new HttpError("UF inválida.", 400);

    // If marking as default, unset previous default
    if (isDefault) {
      const existing = await db.address.findMany({
        where: { userId: user.id, isDefault: true },
      });
      for (const a of existing) {
        await db.address.update({
          where: { id: a.id },
          data: { isDefault: false },
        });
      }
    } else {
      // If user has no addresses, force this one to be the default.
      const count = await db.address.count({ where: { userId: user.id } });
      if (count === 0) {
        // first address becomes default automatically
      }
    }
    // Auto-default: if this is the user's first address, always mark it as default.
    const addressCount = await db.address.count({ where: { userId: user.id } });
    const effectiveDefault = isDefault || addressCount === 0;

    const created = await db.address.create({
      data: {
        userId: user.id,
        label,
        recipient,
        cep,
        street,
        number,
        complement,
        district,
        city,
        state,
        isDefault: effectiveDefault,
      },
    });

    return ok(
      { address: serializeAddress(created as unknown as Parameters<typeof serializeAddress>[0]) },
      201,
    );
  } catch (e) {
    return handleApiError(e);
  }
}

// Helper type re-export for downstream consumers.
export type { Address };

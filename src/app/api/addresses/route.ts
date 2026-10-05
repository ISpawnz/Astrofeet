import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { serializeAddress } from "@/server/serialize";
import { body, ok, route } from "@/server/http";
import { AddressInput, clearDefault } from "@/server/addresses";

export const runtime = "nodejs";

// Endereço padrão primeiro, depois os mais recentes.
export const GET = route(async () => {
  const user = await requireUser();
  const rows = await db.address.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return { addresses: rows.sort((a, b) => Number(!!b.isDefault) - Number(!!a.isDefault)).map(serializeAddress) };
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const data = await body(req, AddressInput);
  // O primeiro endereço é sempre o padrão.
  const isDefault = data.isDefault || (await db.address.count({ where: { userId: user.id } })) === 0;
  if (isDefault) await clearDefault(user.id);
  return ok(
    { address: serializeAddress(await db.address.create({ data: { ...data, userId: user.id, isDefault } })) },
    201,
  );
});

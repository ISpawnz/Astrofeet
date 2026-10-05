import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { serializeAddress } from "@/server/serialize";
import { body, route } from "@/server/http";
import { AddressPatch, clearDefault, ownAddress } from "@/server/addresses";

export const runtime = "nodejs";

export const PATCH = route(async (req, { id }) => {
  const user = await requireUser();
  await ownAddress(user.id, id);
  const data = await body(req, AddressPatch);
  if (data.isDefault) await clearDefault(user.id, id);
  return { address: serializeAddress(await db.address.update({ where: { id }, data })) };
});

export const DELETE = route(async (_req, { id }) => {
  const user = await requireUser();
  await ownAddress(user.id, id);
  await db.address.delete({ where: { id } });
  return { ok: true };
});

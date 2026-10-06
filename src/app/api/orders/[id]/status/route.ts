import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { body, fail, route } from "@/server/http";
import { setOrderStatus, StatusInput } from "@/server/orders";

export const runtime = "nodejs";

export const PATCH = route(async (req, { id }) => {
  await requireAdmin();
  const { status } = await body(req, z.object({ status: StatusInput }));
  return { order: (await setOrderStatus(id, status)) ?? fail("Pedido não encontrado.", 404) };
});

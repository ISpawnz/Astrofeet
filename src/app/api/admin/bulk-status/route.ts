import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { body, route } from "@/server/http";
import { setOrderStatus, StatusInput } from "@/server/orders";

export const runtime = "nodejs";

const Bulk = z.object({
  orderIds: z.array(z.string()).min(1, "Selecione ao menos um pedido.").max(200),
  status: StatusInput,
});

// POST /api/admin/bulk-status — muda o status de vários pedidos de uma vez.
export const POST = route(async (req) => {
  await requireAdmin();
  const { orderIds, status } = await body(req, Bulk);
  const results: { id: string; code: string; success: boolean }[] = [];
  for (const id of orderIds) {
    const order = await setOrderStatus(id, status).catch(() => null);
    results.push({ id, code: order?.code ?? "?", success: !!order });
  }
  return { updated: results.filter((r) => r.success).length, total: orderIds.length, results };
});

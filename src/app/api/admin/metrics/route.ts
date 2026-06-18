import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { serializeOrder } from "@/lib/serialize";
import { handleApiError, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [orders, totalProducts, todayOrders, allOrders] = await Promise.all([
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      db.product.count(),
      db.order.findMany({ where: { createdAt: { gte: startOfToday } } }),
      db.order.findMany(),
    ]);

    const revenue = allOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((s, o) => s + o.total, 0);
    const paidToday = todayOrders.filter((o) => o.status !== "cancelled");
    const revenueToday = paidToday.reduce((s, o) => s + o.total, 0);
    const ticket =
      paidToday.length > 0 ? revenueToday / paidToday.length : 0;

    const byStatus: Record<string, number> = {};
    for (const o of allOrders) {
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    }

    return ok({
      ordersToday: todayOrders.length,
      revenue: Number(revenue.toFixed(2)),
      ticket: Number(ticket.toFixed(2)),
      totalOrders: allOrders.length,
      totalProducts,
      recent: orders.map(serializeOrder),
      byStatus,
    });
  } catch (e) {
    return handleApiError(e);
  }
}

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

    const [orders, totalProducts, todayOrders, allOrders, allProducts] = await Promise.all([
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      db.product.count(),
      db.order.findMany({ where: { createdAt: { gte: startOfToday } } }),
      db.order.findMany(),
      db.product.findMany({}),
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

    // Revenue over last 7 days (for chart)
    const last7Days: { date: string; label: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dayOrders = allOrders.filter((o) => {
        const created = o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt as string);
        return created >= dayStart && created < dayEnd && o.status !== "cancelled";
      });
      const dayRevenue = dayOrders.reduce((s, o) => s + (o.total as number), 0);
      last7Days.push({
        date: dayStart.toISOString().slice(0, 10),
        label: dayStart.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" }),
        revenue: Number(dayRevenue.toFixed(2)),
        orders: dayOrders.length,
      });
    }

    // Top products by total sold (from all orders' items)
    const productSales = new Map<string, { name: string; slug: string; units: number; revenue: number }>();
    for (const o of allOrders) {
      if (o.status === "cancelled") continue;
      try {
        const items = JSON.parse(o.items as string) as Array<{
          productId: string;
          name: string;
          slug: string;
          quantity: number;
          subtotal: number;
        }>;
        for (const item of items) {
          const existing = productSales.get(item.productId);
          if (existing) {
            existing.units += item.quantity;
            existing.revenue += item.subtotal;
          } else {
            productSales.set(item.productId, {
              name: item.name,
              slug: item.slug,
              units: item.quantity,
              revenue: item.subtotal,
            });
          }
        }
      } catch {
        // skip malformed items
      }
    }
    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p) => ({
        ...p,
        revenue: Number(p.revenue.toFixed(2)),
      }));

    // Total customers
    const totalCustomers = (await db.user.findMany({})).filter(
      (u) => u.role === "customer",
    ).length;

    return ok({
      ordersToday: todayOrders.length,
      revenue: Number(revenue.toFixed(2)),
      ticket: Number(ticket.toFixed(2)),
      totalOrders: allOrders.length,
      totalProducts,
      totalCustomers,
      recent: orders.map(serializeOrder),
      byStatus,
      revenueLast7Days: last7Days,
      topProducts,
    });
  } catch (e) {
    return handleApiError(e);
  }
}


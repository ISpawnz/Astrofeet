import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { serializeOrder } from "@/server/serialize";
import { route } from "@/server/http";
import { round2 } from "@/shared/rules";

export const runtime = "nodejs";

const DAY = 24 * 60 * 60 * 1000;
const startOfDay = (offsetDays = 0) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() - offsetDays * DAY);
};

export const GET = route(async () => {
  await requireAdmin();
  const [rows, totalProducts, users] = await Promise.all([
    db.order.findMany({ orderBy: { createdAt: "desc" } }),
    db.product.count(),
    db.user.findMany({}),
  ]);
  const orders = rows.map(serializeOrder);
  const valid = orders.filter((o) => o.status !== "cancelled");
  const revenue = valid.reduce((s, o) => s + o.total, 0);
  const inRange = (o: { createdAt: string }, from: Date, to = new Date(from.getTime() + DAY)) =>
    new Date(o.createdAt) >= from && new Date(o.createdAt) < to;

  const byStatus: Record<string, number> = {};
  for (const o of orders) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;

  const sales = new Map<string, { name: string; slug: string; units: number; revenue: number }>();
  for (const i of valid.flatMap((o) => o.items)) {
    const s = sales.get(i.productId) ?? { name: i.name, slug: i.slug, units: 0, revenue: 0 };
    sales.set(i.productId, { ...s, units: s.units + i.quantity, revenue: round2(s.revenue + i.subtotal) });
  }

  return {
    ordersToday: orders.filter((o) => inRange(o, startOfDay())).length,
    revenue: round2(revenue),
    ticket: valid.length ? round2(revenue / valid.length) : 0,
    totalOrders: orders.length,
    totalProducts,
    totalCustomers: users.filter((u) => u.role === "customer").length,
    recent: orders.slice(0, 50),
    byStatus,
    revenueLast7Days: [6, 5, 4, 3, 2, 1, 0].map((i) => {
      const day = startOfDay(i);
      const dayOrders = valid.filter((o) => inRange(o, day));
      return {
        date: day.toISOString().slice(0, 10),
        label: day.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" }),
        revenue: round2(dayOrders.reduce((s, o) => s + o.total, 0)),
        orders: dayOrders.length,
      };
    }),
    topProducts: [...sales.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
  };
});

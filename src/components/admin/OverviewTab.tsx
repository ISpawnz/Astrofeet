"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ShoppingBag, TrendingUp, Receipt, Package, Inbox, Users, Trophy } from "lucide-react";
import { api } from "@/client/api";
import { formatPrice, formatDate, formatShortDate, orderStatusLabel } from "@/shared/format";

import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

import { fadeUp } from "@/components/shared/motion";
import { ORDER_STATUSES } from "@/shared/rules";
import { CHART_PALETTE, MetricCard, MetricCardSkeleton, StatusBadge } from "./shared";

export function OverviewTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: () => api.adminMetrics(),
  });

  const byStatusData = useMemo(() => {
    if (!data) return [];
    return ORDER_STATUSES.map((s) => ({
      status: s,
      label: orderStatusLabel(s),
      count: data.byStatus[s] ?? 0,
    }));
  }, [data]);

  const recentByStatus = useMemo(() => {
    if (!data || data.recent.length === 0) return [];
    const map: Record<string, number> = {};
    for (const o of data.recent) {
      map[o.status] = (map[o.status] ?? 0) + 1;
    }
    return ORDER_STATUSES.filter((s) => (map[s] ?? 0) > 0).map((s, i) => ({
      status: s,
      label: orderStatusLabel(s),
      count: map[s],
      color: CHART_PALETTE[i % CHART_PALETTE.length],
    }));
  }, [data]);

  if (isError) {
    return (
      <div className="glass rounded-2xl border border-black/10 p-8 text-center text-sm text-muted-foreground">
        Não foi possível carregar os números do painel. Tente novamente em instantes.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {isLoading || !data ? (
          Array.from({ length: 5 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard
              index={0}
              icon={<ShoppingBag className="h-5 w-5" />}
              label="Pedidos hoje"
              value={String(data.ordersToday)}
              accent="#cc3d0a"
            />
            <MetricCard
              index={1}
              icon={<TrendingUp className="h-5 w-5" />}
              label="Faturamento"
              value={formatPrice(data.revenue)}
              accent="#15803d"
            />
            <MetricCard
              index={2}
              icon={<Receipt className="h-5 w-5" />}
              label="Ticket médio"
              value={formatPrice(data.ticket)}
              accent="#111111"
            />
            <MetricCard
              index={3}
              icon={<Package className="h-5 w-5" />}
              label="Produtos ativos"
              value={String(data.totalProducts)}
              accent="#c8102e"
            />
            <MetricCard
              index={4}
              icon={<Users className="h-5 w-5" />}
              label="Clientes"
              value={String(data.totalCustomers)}
              accent="#111111"
            />
          </>
        )}
      </div>

      {/* Revenue (last 7 days) + Top products */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="glass relative overflow-hidden rounded-2xl border border-black/10 p-5"
        >
          <div className="relative mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-[var(--brand)]/15 text-[var(--brand)]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Faturamento últimos 7 dias</h3>
              <p className="text-xs text-muted-foreground">Receita diária do catálogo</p>
            </div>
          </div>
          <div className="orbit-divider mb-4" />
          <div className="relative h-60 w-full">
            {isLoading || !data ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : data.revenueLast7Days.every((d) => d.revenue === 0) ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <Inbox className="h-8 w-8 opacity-50" />
                Sem vendas nos últimos 7 dias
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueLast7Days} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                  <defs>
                    <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#cc3d0a" />
                      <stop offset="100%" stopColor="#111111" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "currentColor", fontSize: 11 }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => (v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`)}
                    tick={{ fill: "currentColor", fontSize: 10 }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                    width={64}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(204,61,10,0.08)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const row = payload[0]?.payload as
                        | {
                            date: string;
                            label: string;
                            revenue: number;
                            orders: number;
                          }
                        | undefined;
                      if (!row) return null;
                      return (
                        <div className="rounded-xl border border-black/10 bg-[rgba(20,18,32,0.95)] px-3 py-2 text-xs shadow-xl backdrop-blur">
                          <p className="font-semibold text-foreground">
                            {row.label} · {formatShortDate(row.date)}
                          </p>
                          <p className="mt-0.5 text-[var(--brand)]">
                            Faturamento: <span className="font-semibold">{formatPrice(row.revenue)}</span>
                          </p>
                          <p className="text-muted-foreground">
                            Pedidos: <span className="font-semibold text-foreground">{row.orders}</span>
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="url(#revGradient)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.45, delay: 0.12 }}
          className="glass relative overflow-hidden rounded-2xl border border-black/10 p-5"
        >
          <div className="relative mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-[var(--success)]/15 text-[var(--success)]">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Produtos mais vendidos</h3>
              <p className="text-xs text-muted-foreground">Top 5 por receita</p>
            </div>
          </div>
          <div className="orbit-divider mb-4" />
          <div className="relative">
            {isLoading || !data ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-lg" />
                ))}
              </div>
            ) : data.topProducts.length === 0 ? (
              <div className="flex h-60 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <Inbox className="h-8 w-8 opacity-50" />
                Sem vendas registradas ainda
              </div>
            ) : (
              <ul className="space-y-3">
                {data.topProducts.map((p, i) => {
                  const maxRevenue = data.topProducts[0].revenue || 1;
                  const pct = Math.max(8, Math.round((p.revenue / maxRevenue) * 100));
                  return (
                    <motion.li
                      key={p.slug}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.35,
                        delay: Math.min(i * 0.07, 0.4),
                      }}
                      className="space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/[0.03] text-[10px] font-bold text-muted-foreground">
                            {i + 1}
                          </span>
                          <span className="line-clamp-1 font-medium">{p.name}</span>
                        </span>
                        <span className="shrink-0 font-semibold text-[var(--brand)]">{formatPrice(p.revenue)}</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/[0.03]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: "#cc3d0a",
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {p.units} unidade{p.units === 1 ? "" : "s"}
                        </span>
                        <span>{pct}%</span>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl border border-black/10 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Pedidos por status</h3>
              <p className="text-xs text-muted-foreground">Visão geral do funil</p>
            </div>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="h-56 w-full">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byStatusData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "currentColor", fontSize: 11 }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "currentColor", fontSize: 11 }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(204,61,10,0.08)" }}
                    contentStyle={{
                      background: "rgba(20,18,32,0.92)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "#fff",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#cc3d0a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl border border-black/10 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Últimos pedidos</h3>
              <p className="text-xs text-muted-foreground">Distribuição por status</p>
            </div>
          </div>
          <div className="flex h-56 w-full items-center justify-center">
            {isLoading ? (
              <Skeleton className="h-40 w-40 rounded-full" />
            ) : recentByStatus.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground">
                <Inbox className="mx-auto mb-2 h-8 w-8 opacity-50" />
                Sem pedidos recentes
              </div>
            ) : (
              <div className="flex w-full items-center gap-4">
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie
                      data={recentByStatus}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={48}
                      outerRadius={80}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {recentByStatus.map((entry) => (
                        <Cell key={entry.status} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(20,18,32,0.92)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        color: "#fff",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="flex-1 space-y-2">
                  {recentByStatus.map((entry) => (
                    <li key={entry.status} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
                        {entry.label}
                      </span>
                      <span className="font-semibold">{entry.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent orders table */}
      <div className="glass rounded-2xl border border-black/10 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Últimos pedidos</h3>
            <p className="text-xs text-muted-foreground">Os 6 pedidos mais recentes</p>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto rounded-xl border border-black/5">
          <Table>
            <TableHeader>
              <TableRow className="border-black/10 hover:bg-transparent">
                <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Código</TableHead>
                <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Cliente</TableHead>
                <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Total</TableHead>
                <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Status</TableHead>
                <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-black/5">
                    <TableCell colSpan={5}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !data || data.recent.length === 0 ? (
                <TableRow className="border-black/5">
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    <Inbox className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    Nenhum pedido recente
                  </TableCell>
                </TableRow>
              ) : (
                data.recent.slice(0, 6).map((o) => (
                  <TableRow key={o.id} className="border-black/5">
                    <TableCell className="font-mono text-xs text-[var(--brand)]">{o.code}</TableCell>
                    <TableCell className="font-medium">{o.customer.name}</TableCell>
                    <TableCell className="font-semibold">{formatPrice(o.total)}</TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

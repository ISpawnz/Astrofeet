"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ShoppingBag,
  TrendingUp,
  Receipt,
  Package,
  ArrowLeft,
  LogIn,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  ShieldAlert,
  Star,
  PackageSearch,
  Inbox,
  Ticket,
  Power,
  Copy,
  Check,
  Bell,
  Mail,
  Clock,
  Truck,
  Sparkles,
  RefreshCw,
  ChevronDown,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { api } from "@/lib/client";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import type {
  Order,
  Product,
  OrderStatus,
  Coupon,
  Notification,
  NotificationType,
} from "@/lib/types";
import {
  formatPrice,
  formatDate,
  orderStatusLabel,
  orderStatusColor,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_ORDER: OrderStatus[] = [
  "created",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
];

const NEON_PALETTE = [
  "#34e7ff",
  "#ff5cf0",
  "#a779ff",
  "#c6ff5a",
  "#ff7a3c",
];

const ALL_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44];

const ACCENT_PRESETS: { name: string; value: string }[] = [
  { name: "Cyan", value: "#34e7ff" },
  { name: "Magenta", value: "#ff5cf0" },
  { name: "Violet", value: "#a779ff" },
  { name: "Lime", value: "#c6ff5a" },
  { name: "Gold", value: "#ffd24a" },
  { name: "Orange", value: "#ff7a3c" },
];

const BADGE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Nenhum" },
  { value: "Novo", label: "Novo" },
  { value: "Drop limitado", label: "Drop limitado" },
  { value: "Mais vendido", label: "Mais vendido" },
];

const CATEGORIES = [
  "Runner",
  "Lifestyle",
  "Performance",
  "Skate",
  "Casual",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function itemsCount(order: Order): number {
  return order.items.reduce((acc, it) => acc + it.quantity, 0);
}

// ---------------------------------------------------------------------------
// Admin guard
// ---------------------------------------------------------------------------

function AdminGuard() {
  const openAuth = useUIStore((s) => s.openAuth);
  const navigate = useUIStore((s) => s.navigate);
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-strong w-full rounded-3xl border border-white/10 p-8"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold">Acesso restrito ao painel.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área é reservada ao comando da Astrofeet. Faça login com uma
          conta de administrador para continuar.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            onClick={() => openAuth("login")}
            className="bg-[var(--neon-cyan)] text-black hover:bg-[var(--neon-cyan)]/90"
          >
            <LogIn className="h-4 w-4" />
            Fazer login
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("home")}
            className="border-white/10 bg-white/5 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar à loja
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  index?: number;
}

function MetricCard({ icon, label, value, accent, index = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.3) }}
      className="glass relative overflow-hidden rounded-2xl border border-white/10 p-5"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-25 blur-2xl"
        style={{ background: accent }}
      />
      <div className="relative flex items-start justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10"
          style={{
            color: accent,
            background: `${accent}1f`,
          }}
        >
          {icon}
        </div>
      </div>
      <p className="relative mt-4 text-3xl font-black tracking-tight">
        {value}
      </p>
      <p className="relative mt-1 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </motion.div>
  );
}

function MetricCardSkeleton() {
  return (
    <div className="glass rounded-2xl border border-white/10 p-5">
      <Skeleton className="h-11 w-11 rounded-xl" />
      <Skeleton className="mt-4 h-9 w-24" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini stat (compact glass card with icon + number + label)
// ---------------------------------------------------------------------------

interface MiniStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}

function MiniStat({ icon, label, value, accent }: MiniStatProps) {
  return (
    <div className="glass flex items-center gap-3 rounded-2xl border border-white/10 p-3 sm:p-4">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10"
        style={{ color: accent, background: `${accent}1f` }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight tracking-tight">
          {value}
        </p>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", orderStatusColor(status))}
    >
      {orderStatusLabel(status)}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------

function OverviewTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: () => api.adminMetrics(),
  });

  const byStatusData = useMemo(() => {
    if (!data) return [];
    return STATUS_ORDER.map((s) => ({
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
    return STATUS_ORDER.filter((s) => (map[s] ?? 0) > 0).map((s, i) => ({
      status: s,
      label: orderStatusLabel(s),
      count: map[s],
      color: NEON_PALETTE[i % NEON_PALETTE.length],
    }));
  }, [data]);

  if (isError) {
    return (
      <div className="glass rounded-2xl border border-white/10 p-8 text-center text-sm text-muted-foreground">
        Não foi possível carregar os números do painel. Tente novamente em
        instantes.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))
        ) : (
          <>
            <MetricCard
              index={0}
              icon={<ShoppingBag className="h-5 w-5" />}
              label="Pedidos hoje"
              value={String(data.ordersToday)}
              accent="#34e7ff"
            />
            <MetricCard
              index={1}
              icon={<TrendingUp className="h-5 w-5" />}
              label="Faturamento"
              value={formatPrice(data.revenue)}
              accent="#c6ff5a"
            />
            <MetricCard
              index={2}
              icon={<Receipt className="h-5 w-5" />}
              label="Ticket médio"
              value={formatPrice(data.ticket)}
              accent="#a779ff"
            />
            <MetricCard
              index={3}
              icon={<Package className="h-5 w-5" />}
              label="Produtos ativos"
              value={String(data.totalProducts)}
              accent="#ff5cf0"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl border border-white/10 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Pedidos por status</h3>
              <p className="text-xs text-muted-foreground">
                Visão geral do funil
              </p>
            </div>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="h-56 w-full">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byStatusData}
                  margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
                >
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
                    cursor={{ fill: "rgba(52,231,255,0.08)" }}
                    contentStyle={{
                      background: "rgba(20,18,32,0.92)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "#fff",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    fill="#34e7ff"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl border border-white/10 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Últimos pedidos</h3>
              <p className="text-xs text-muted-foreground">
                Distribuição por status
              </p>
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
                    <li
                      key={entry.status}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: entry.color }}
                        />
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
      <div className="glass rounded-2xl border border-white/10 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Últimos pedidos</h3>
            <p className="text-xs text-muted-foreground">
              Os 6 pedidos mais recentes
            </p>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto rounded-xl border border-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                  Código
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                  Cliente
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                  Total
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                  Data
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5">
                    <TableCell colSpan={5}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !data || data.recent.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    <Inbox className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    Nenhum pedido recente
                  </TableCell>
                </TableRow>
              ) : (
                data.recent.slice(0, 6).map((o) => (
                  <TableRow key={o.id} className="border-white/5">
                    <TableCell className="font-mono text-xs text-[var(--neon-cyan)]">
                      {o.code}
                    </TableCell>
                    <TableCell className="font-medium">
                      {o.customer.name}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(o.total)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(o.createdAt)}
                    </TableCell>
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

// ---------------------------------------------------------------------------
// Orders table
// ---------------------------------------------------------------------------

function OrdersTable() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("paid");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Date range filter state (YYYY-MM-DD strings from <input type="date">)
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: () => api.listOrders(),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
    return data.filter((o) => {
      if (q) {
        const matches =
          o.code.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (fromTime !== null || toTime !== null) {
        const t = new Date(o.createdAt).getTime();
        if (fromTime !== null && t < fromTime) return false;
        if (toTime !== null && t > toTime) return false;
      }
      return true;
    });
  }, [data, query, dateFrom, dateTo]);

  const dateFilterActive = Boolean(dateFrom || dateTo);

  // Keep selection in sync with the visible list (drop ids that no longer match)
  useEffect(() => {
    if (selectedIds.length === 0) return;
    const visibleIds = new Set(filtered.map((o) => o.id));
    setSelectedIds((prev) =>
      prev.filter((id) => visibleIds.has(id)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  const visibleIds = filtered.map((o) => o.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const someVisibleSelected =
    visibleIds.some((id) => selectedIds.includes(id)) && !allVisibleSelected;

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );
  }

  function toggleAll(checked: boolean) {
    if (checked) {
      const next = new Set(selectedIds);
      for (const id of visibleIds) next.add(id);
      setSelectedIds([...next]);
    } else {
      const visible = new Set(visibleIds);
      setSelectedIds((prev) => prev.filter((id) => !visible.has(id)));
    }
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function clearDateFilter() {
    setDateFrom("");
    setDateTo("");
  }

  async function onBulkUpdate() {
    if (selectedIds.length === 0 || bulkSubmitting) return;
    setBulkSubmitting(true);
    try {
      const result = await api.bulkUpdateStatus(selectedIds, bulkStatus);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-metrics"] }),
      ]);
      toast.success(
        `${result.updated} pedido${result.updated === 1 ? "" : "s"} atualizado${
          result.updated === 1 ? "" : "s"
        } para "${orderStatusLabel(bulkStatus)}".`,
      );
      clearSelection();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar os pedidos.",
      );
    } finally {
      setBulkSubmitting(false);
    }
  }

  async function onStatusChange(order: Order, status: string) {
    setUpdating(order.id);
    try {
      await api.updateOrderStatus(order.id, status);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-metrics"] }),
      ]);
      toast.success(`Pedido ${order.code} atualizado para "${orderStatusLabel(status)}".`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível atualizar o status.",
      );
    } finally {
      setUpdating(null);
    }
  }

  if (isError) {
    return (
      <div className="glass rounded-2xl border border-white/10 p-8 text-center text-sm text-muted-foreground">
        Não foi possível carregar os pedidos. Tente novamente em instantes.
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <div className="glass rounded-2xl border border-white/10 p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Todos os pedidos</h3>
            <p className="text-xs text-muted-foreground">
              Atualize o status de cada pedido em tempo real.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por código ou cliente"
              className="border-white/10 bg-white/5 pl-9"
            />
          </div>
        </div>

        {/* Date range filter */}
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3 w-3" />
              De
            </Label>
            <Input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border-white/10 bg-white/5 text-sm [color-scheme:dark]"
            />
          </div>
          <div className="flex-1">
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3 w-3" />
              Até
            </Label>
            <Input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="border-white/10 bg-white/5 text-sm [color-scheme:dark]"
            />
          </div>
          {dateFilterActive && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearDateFilter}
              className="h-9 shrink-0 border border-white/10 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Limpar filtro
            </Button>
          )}
          <div className="hidden shrink-0 items-center text-xs text-muted-foreground sm:flex">
            {filtered.length} pedido{filtered.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="max-h-[28rem] overflow-y-auto rounded-xl border border-white/5">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-[var(--card)] backdrop-blur">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="w-10 px-3">
                  <Checkbox
                    checked={
                      allVisibleSelected
                        ? true
                        : someVisibleSelected
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={(v) => toggleAll(v === true)}
                    aria-label="Selecionar todos os pedidos visíveis"
                    className="border-white/20 data-[state=checked]:bg-[var(--neon-cyan)] data-[state=checked]:text-black data-[state=checked]:border-[var(--neon-cyan)]"
                  />
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                  Código
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                  Cliente
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                  Itens
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                  Total
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                  Data
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5">
                    <TableCell colSpan={7}>
                      <Skeleton className="h-7 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                      <Inbox className="h-8 w-8 opacity-50" />
                      {query || dateFilterActive
                        ? "Nenhum pedido encontrado para esses filtros."
                        : "Ainda não há pedidos registrados."}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o) => {
                  const checked = selectedIds.includes(o.id);
                  return (
                    <TableRow
                      key={o.id}
                      className={cn(
                        "border-white/5 transition-colors",
                        checked && "bg-[var(--neon-cyan)]/[0.06]",
                      )}
                    >
                      <TableCell className="px-3">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => toggleRow(o.id, v === true)}
                          aria-label={`Selecionar pedido ${o.code}`}
                          className="border-white/20 data-[state=checked]:bg-[var(--neon-cyan)] data-[state=checked]:text-black data-[state=checked]:border-[var(--neon-cyan)]"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-[var(--neon-cyan)]">
                        {o.code}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{o.customer.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {o.customer.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{itemsCount(o)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(o.total)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={o.status} />
                          <Select
                            value={o.status}
                            disabled={updating === o.id}
                            onValueChange={(v) => onStatusChange(o, v)}
                          >
                            <SelectTrigger
                              size="sm"
                              className="h-8 w-9 justify-center border-white/10 bg-white/5 px-0"
                              aria-label="Alterar status"
                            >
                              {updating === o.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                              ) : (
                                <span className="text-xs text-muted-foreground">···</span>
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_ORDER.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {orderStatusLabel(s)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(o.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Floating bulk action bar */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25 }}
          className="sticky bottom-4 z-30"
        >
          <div className="glass-strong flex flex-col gap-3 rounded-2xl border border-[var(--neon-cyan)]/30 p-3 shadow-[0_8px_40px_-12px_rgba(52,231,255,0.35)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 items-center rounded-full bg-[var(--neon-cyan)]/15 px-3 text-sm font-bold text-[var(--neon-cyan)]">
                {selectedIds.length}
              </div>
              <span className="text-sm font-medium">
                {selectedIds.length === 1
                  ? "1 selecionado"
                  : `${selectedIds.length} selecionados`}
              </span>
              <button
                type="button"
                onClick={clearSelection}
                className="hidden items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground sm:inline-flex"
              >
                <X className="h-3.5 w-3.5" />
                Limpar seleção
              </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                value={bulkStatus}
                onValueChange={(v) => setBulkStatus(v as OrderStatus)}
                disabled={bulkSubmitting}
              >
                <SelectTrigger className="h-9 w-full border-white/15 bg-white/5 text-sm sm:w-44">
                  <SelectValue placeholder="Novo status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {orderStatusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                onClick={onBulkUpdate}
                disabled={bulkSubmitting}
                className="btn-cosmic h-9 gap-2 rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-5 text-sm font-bold text-black hover:opacity-90"
              >
                {bulkSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Atualizar {selectedIds.length}{" "}
                {selectedIds.length === 1 ? "pedido" : "pedidos"}
              </Button>

              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex h-9 items-center justify-center gap-1 rounded-full px-3 text-xs font-medium text-muted-foreground transition hover:bg-white/5 hover:text-foreground sm:hidden"
              >
                <X className="h-3.5 w-3.5" />
                Limpar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product form modal
// ---------------------------------------------------------------------------

interface ProductFormState {
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: string;
  stock: string;
  rating: string;
  accent: string;
  badge: string;
  description: string;
  sizes: number[];
  sizeStock: Record<string, string>;
  images: string[];
  featured: boolean;
  bestSeller: boolean;
}

// Image upload limits (shared by upload zone + URL add).
const MAX_PRODUCT_IMAGES = 5;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

function emptyForm(): ProductFormState {
  return {
    name: "",
    slug: "",
    brand: "",
    category: CATEGORIES[0],
    price: "",
    stock: "0",
    rating: "5",
    accent: ACCENT_PRESETS[0].value,
    badge: "",
    description: "",
    sizes: [...ALL_SIZES],
    sizeStock: {},
    images: [],
    featured: false,
    bestSeller: false,
  };
}

function formFromProduct(p: Product): ProductFormState {
  const ss = p.sizeStock ?? {};
  const sizeStock: Record<string, string> = {};
  for (const s of p.sizes) {
    const v = ss[String(s)];
    sizeStock[String(s)] = v !== undefined ? String(v) : "";
  }
  return {
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    category: p.category,
    price: String(p.price),
    stock: String(p.stock),
    rating: String(p.rating),
    accent: p.accent,
    badge: p.badge ?? "",
    description: p.description,
    sizes: [...p.sizes].sort((a, b) => a - b),
    sizeStock,
    images: [...p.images],
    featured: p.featured,
    bestSeller: p.bestSeller,
  };
}

function ProductFormModal({
  open,
  editing,
  onOpenChange,
}: {
  open: boolean;
  editing: Product | null;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProductFormState>(emptyForm());
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form whenever modal opens or editing target changes
  useEffect(() => {
    if (open) {
      setForm(editing ? formFromProduct(editing) : emptyForm());
      setSlugEdited(Boolean(editing));
      setUrlInput("");
    }
  }, [open, editing]);

  function update<K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateName(v: string) {
    setForm((f) => {
      const next = { ...f, name: v };
      if (!slugEdited) next.slug = slugify(v);
      return next;
    });
  }

  function toggleSize(s: number) {
    setForm((f) => {
      const has = f.sizes.includes(s);
      const sizes = has
        ? f.sizes.filter((x) => x !== s)
        : [...f.sizes, s].sort((a, b) => a - b);
      // Clean up sizeStock for removed sizes.
      const sizeStock = { ...f.sizeStock };
      if (has) delete sizeStock[String(s)];
      return { ...f, sizes, sizeStock };
    });
  }

  function setSizeStock(s: number, value: string) {
    setForm((f) => ({
      ...f,
      sizeStock: { ...f.sizeStock, [String(s)]: value },
    }));
  }

  // ----- Image management (upload + URL add + remove) -----

  function handleFiles(files: File[]) {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("Selecione apenas arquivos de imagem.");
      return;
    }
    const availableSlots = MAX_PRODUCT_IMAGES - form.images.length;
    if (availableSlots <= 0) {
      toast.error("Você já atingiu o limite de 5 imagens.");
      return;
    }
    const toRead = imageFiles.slice(0, availableSlots);
    if (imageFiles.length > toRead.length) {
      toast.warning(
        `Apenas ${availableSlots} imagem(ns) adicionada(s) — limite de 5.`,
      );
    }
    for (const file of toRead) {
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`"${file.name}" excede 2 MB.`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result =
          typeof reader.result === "string" ? reader.result : "";
        if (!result) return;
        setForm((f) => {
          if (f.images.length >= MAX_PRODUCT_IMAGES) return f;
          return { ...f, images: [...f.images, result] };
        });
      };
      reader.onerror = () => {
        toast.error(`Não foi possível ler "${file.name}".`);
      };
      reader.readAsDataURL(file);
    }
  }

  function addUrls() {
    const urls = urlInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (urls.length === 0) return;
    const availableSlots = MAX_PRODUCT_IMAGES - form.images.length;
    if (availableSlots <= 0) {
      toast.error("Você já atingiu o limite de 5 imagens.");
      return;
    }
    const toAdd = urls.slice(0, availableSlots);
    if (urls.length > toAdd.length) {
      toast.warning(
        `Apenas ${availableSlots} URL(s) adicionada(s) — limite de 5.`,
      );
    }
    setForm((f) => ({ ...f, images: [...f.images, ...toAdd] }));
    setUrlInput("");
  }

  function removeImage(index: number) {
    setForm((f) => ({
      ...f,
      images: f.images.filter((_, i) => i !== index),
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const name = form.name.trim();
    const brand = form.brand.trim();
    const category = form.category.trim();
    const priceNum = Number(form.price);
    const stockNum = parseInt(form.stock || "0", 10);
    const ratingNum = Math.min(5, Math.max(0, Number(form.rating) || 0));

    if (!name) return toast.error("Dê um nome ao produto.");
    if (!brand) return toast.error("Informe a marca.");
    if (!category) return toast.error("Informe a categoria.");
    if (!Number.isFinite(priceNum) || priceNum < 0)
      return toast.error("Informe um preço válido.");
    if (form.sizes.length === 0)
      return toast.error("Selecione ao menos um tamanho.");

    const slug = (form.slug.trim() || slugify(name)).toLowerCase();
    const images =
      form.images.length > 0 ? form.images : [`/products/${slug}.png`];

    // Build per-size stock map (only for selected sizes; parse ints).
    const sizeStockMap: Record<string, number> = {};
    for (const s of form.sizes) {
      const raw = form.sizeStock[String(s)];
      const v = raw === "" ? undefined : parseInt(raw || "0", 10);
      if (v !== undefined && Number.isFinite(v) && v >= 0)
        sizeStockMap[String(s)] = v;
    }

    const body: Partial<Product> = {
      name,
      slug,
      brand,
      category,
      price: priceNum,
      stock: Number.isFinite(stockNum) ? stockNum : 0,
      rating: ratingNum,
      accent: form.accent,
      badge: form.badge ? form.badge : null,
      description: form.description.trim(),
      sizes: form.sizes,
      images,
      featured: form.featured,
      bestSeller: form.bestSeller,
    };
    // Always send sizeStock so the backend can sync it with the selected sizes.
    (body as Record<string, unknown>).sizeStock = sizeStockMap;

    setSaving(true);
    try {
      if (editing) {
        await api.updateProduct(editing.id, body);
        toast.success(`${name} atualizado com sucesso.`);
        // Restock automation: if the product was out of stock and now has
        // stock, the backend queues notifications to subscribed explorers.
        if (editing.stock === 0 && stockNum > 0) {
          toast.success(
            "Produto reabastecido! Os exploradores inscritos serão avisados.",
            {
              icon: <Bell className="h-4 w-4 text-[var(--neon-cyan)]" />,
              duration: 6000,
            },
          );
        }
      } else {
        await api.createProduct(body);
        toast.success(`${name} adicionado ao catálogo.`);
      }
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o produto.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-h-[90vh] overflow-y-auto border-white/10 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gradient-neon text-xl font-black">
            {editing ? "Editar produto" : "Novo produto"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Ajuste as informações do item no catálogo."
              : "Preencha as informações para adicionar um novo drop."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Identity */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Nome</Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => updateName(e.target.value)}
                placeholder="Orion Runner"
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-slug">Slug</Label>
              <Input
                id="p-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  update("slug", e.target.value);
                }}
                placeholder="orion-runner"
                className="border-white/10 bg-white/5 font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-brand">Marca</Label>
              <Input
                id="p-brand"
                value={form.brand}
                onChange={(e) => update("brand", e.target.value)}
                placeholder="Astrofeet"
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-category">Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => update("category", v)}
              >
                <SelectTrigger
                  id="p-category"
                  className="w-full border-white/10 bg-white/5"
                >
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Numbers */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Preço (R$)</Label>
              <Input
                id="p-price"
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="699.90"
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-stock">Estoque</Label>
              <Input
                id="p-stock"
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => update("stock", e.target.value)}
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-rating">Avaliação (0–5)</Label>
              <Input
                id="p-rating"
                type="number"
                min={0}
                max={5}
                step="0.1"
                value={form.rating}
                onChange={(e) => update("rating", e.target.value)}
                className="border-white/10 bg-white/5"
              />
            </div>
          </div>

          {/* Accent + Badge */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Cor de destaque</Label>
              <div className="flex flex-wrap items-center gap-2">
                {ACCENT_PRESETS.map((a) => {
                  const active = form.accent.toLowerCase() === a.value.toLowerCase();
                  return (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => update("accent", a.value)}
                      title={a.name}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 transition-transform",
                        active
                          ? "scale-110 border-white"
                          : "border-white/20 hover:scale-105",
                      )}
                      style={{ background: a.value }}
                    />
                  );
                })}
                <label className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full border-2 border-white/20">
                  <span
                    className="block h-full w-full"
                    style={{ background: form.accent }}
                  />
                  <input
                    type="color"
                    value={form.accent}
                    onChange={(e) => update("accent", e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label="Cor personalizada"
                  />
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Selo</Label>
              <Select
                value={form.badge}
                onValueChange={(v) => update("badge", v)}
              >
                <SelectTrigger className="w-full border-white/10 bg-white/5">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  {BADGE_OPTIONS.map((b) => (
                    <SelectItem key={b.value || "none"} value={b.value || "__none__"}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Tamanhos disponíveis</Label>
              {form.sizes.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    // Distribute global stock evenly across selected sizes.
                    const total = parseInt(form.stock || "0", 10) || 0;
                    const per = Math.floor(total / form.sizes.length);
                    const rem = total - per * form.sizes.length;
                    const next: Record<string, string> = {};
                    form.sizes.forEach((s, i) => {
                      next[String(s)] = String(per + (i < rem ? 1 : 0));
                    });
                    setForm((f) => ({ ...f, sizeStock: next }));
                  }}
                  className="text-[11px] font-medium text-[var(--neon-cyan)] transition hover:underline"
                >
                  Distribuir estoque
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_SIZES.map((s) => {
                const active = form.sizes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(s)}
                    className={cn(
                      "h-9 w-11 rounded-lg border text-sm font-medium transition-colors",
                      active
                        ? "border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/15 text-[var(--neon-cyan)]"
                        : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Per-size stock editor */}
          {form.sizes.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Estoque por tamanho
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Total:{" "}
                  <span className="font-semibold text-foreground">
                    {form.sizes.reduce(
                      (acc, s) =>
                        acc +
                        (parseInt(form.sizeStock[String(s)] || "0", 10) || 0),
                      0,
                    )}
                  </span>{" "}
                  / Estoque global: {form.stock || "0"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {form.sizes.map((s) => {
                  const val = form.sizeStock[String(s)] ?? "";
                  const num = parseInt(val || "0", 10) || 0;
                  return (
                    <div
                      key={s}
                      className="flex flex-col items-center gap-1 rounded-xl border border-white/5 bg-white/[0.03] p-2"
                    >
                      <span className="text-xs font-bold text-muted-foreground">
                        Tam {s}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={val}
                        onChange={(e) => setSizeStock(s, e.target.value)}
                        className={cn(
                          "h-9 w-full rounded-lg border bg-white/5 px-2 text-center text-sm font-semibold outline-none transition focus:border-[var(--neon-cyan)]",
                          num === 0
                            ? "border-rose-500/40 text-rose-300"
                            : num <= 2
                              ? "border-amber-500/40 text-amber-300"
                              : "border-white/10 text-foreground",
                        )}
                        placeholder="0"
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Deixe vazio para usar o estoque global. Tamanhos com 0 ficam
                indisponíveis na loja.
              </p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Descrição</Label>
            <Textarea
              id="p-desc"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Conte a história do drop, materiais e tecnologia..."
              className="min-h-24 border-white/10 bg-white/5"
            />
          </div>

          {/* Images */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
                Imagens do produto
              </Label>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  form.images.length >= MAX_PRODUCT_IMAGES
                    ? "bg-[var(--neon-magenta)]/15 text-[var(--neon-magenta)]"
                    : "bg-white/5 text-muted-foreground",
                )}
              >
                {form.images.length}/{MAX_PRODUCT_IMAGES}
              </span>
            </div>

            {/* Drop zone */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!dragging) setDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragging(false);
                if (e.dataTransfer.files?.length) {
                  handleFiles(Array.from(e.dataTransfer.files));
                }
              }}
              className={cn(
                "group flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition",
                dragging
                  ? "border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10"
                  : "border-white/15 bg-white/[0.02] hover:border-[var(--neon-cyan)]/50 hover:bg-white/[0.04]",
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] transition group-hover:scale-110">
                <Upload className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium">
                Arraste imagens aqui ou clique para selecionar
              </span>
              <span className="text-[11px] text-muted-foreground">
                PNG, JPG ou WEBP · até 2 MB cada · máx. {MAX_PRODUCT_IMAGES}{" "}
                imagens
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    handleFiles(Array.from(e.target.files));
                  }
                  e.target.value = "";
                }}
              />
            </button>

            {/* Thumbnails */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {form.images.map((src, i) => (
                  <motion.div
                    key={`${src.slice(0, 24)}-${i}`}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.18, delay: i * 0.02 }}
                    className="group relative aspect-square overflow-hidden rounded-xl border-2 border-white/10 bg-white/5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Imagem ${i + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      aria-label={`Remover imagem ${i + 1}`}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition hover:bg-rose-500/80 group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* URL input */}
            <div className="space-y-1.5">
              <Label
                htmlFor="p-images"
                className="text-xs uppercase tracking-wider text-muted-foreground"
              >
                Ou cole URLs (separadas por vírgula)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="p-images"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addUrls();
                    }
                  }}
                  placeholder={`/products/${form.slug || "slug"}.png, https://...`}
                  className="border-white/10 bg-white/5 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addUrls}
                  className="shrink-0 border-white/10 bg-white/5 hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Adicionar</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Se nenhuma imagem for enviada, usaremos{" "}
                <code>/products/&lt;slug&gt;.png</code>.
              </p>
            </div>
          </div>

          <Separator className="bg-white/5" />

          {/* Toggles */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <div>
                <p className="text-sm font-medium">Destaque</p>
                <p className="text-xs text-muted-foreground">
                  Aparece em "Novidades"
                </p>
              </div>
              <Switch
                checked={form.featured}
                onCheckedChange={(v) => update("featured", v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <div>
                <p className="text-sm font-medium">Mais vendido</p>
                <p className="text-xs text-muted-foreground">
                  Aparece em "Mais vendidos"
                </p>
              </div>
              <Switch
                checked={form.bestSeller}
                onCheckedChange={(v) => update("bestSeller", v)}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10"
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[var(--neon-cyan)] text-black hover:bg-[var(--neon-cyan)]/90"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Products table
// ---------------------------------------------------------------------------

function ProductsTable() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.products(),
  });

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setModalOpen(true);
  }

  async function onConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteProduct(deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      toast.success(`${deleteTarget.name} removido do catálogo.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível remover o produto.",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (isError) {
    return (
      <div className="glass rounded-2xl border border-white/10 p-8 text-center text-sm text-muted-foreground">
        Não foi possível carregar o catálogo. Tente novamente em instantes.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">Catálogo</h3>
          <p className="text-xs text-muted-foreground">
            Gerencie os drops disponíveis na loja.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[var(--neon-cyan)] text-black hover:bg-[var(--neon-cyan)]/90"
        >
          <Plus className="h-4 w-4" />
          Novo produto
        </Button>
      </div>

      <div className="glass rounded-2xl border border-white/10 p-3 sm:p-4">
        <div className="max-h-[28rem] overflow-y-auto rounded-xl border border-white/5">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-[var(--card)] backdrop-blur">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                  Produto
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                  Categoria
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                  Preço
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                  Estoque
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                  Selo
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                  Flags
                </TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5">
                    <TableCell colSpan={7}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !data || data.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                      <PackageSearch className="h-10 w-10 opacity-50" />
                      <div>
                        <p className="font-medium text-foreground">
                          Catálogo vazio
                        </p>
                        <p className="text-xs">
                          Adicione o primeiro drop da Astrofeet.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={openCreate}
                        className="bg-[var(--neon-cyan)] text-black hover:bg-[var(--neon-cyan)]/90"
                      >
                        <Plus className="h-4 w-4" />
                        Novo produto
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((p) => (
                  <TableRow key={p.id} className="border-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5"
                          style={{
                            boxShadow: `inset 0 0 18px ${p.accent}33`,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="h-full w-full object-contain p-1"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.brand}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          color: p.accent,
                          background: `${p.accent}1a`,
                        }}
                      >
                        {p.category}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(p.price)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "text-sm",
                            p.stock === 0
                              ? "text-rose-300"
                              : p.stock <= 5
                                ? "text-amber-300"
                                : "text-foreground",
                          )}
                        >
                          {p.stock}
                        </span>
                        {p.stock === 0 && (
                          <span
                            title="Produto esgotado — exploradores podem estar inscritos para alerta"
                            aria-label="Produto esgotado — exploradores podem estar inscritos para alerta"
                            className="relative flex h-5 w-5 items-center justify-center rounded-full bg-[var(--neon-magenta)]/15 text-[var(--neon-magenta)]"
                          >
                            <Bell className="h-3 w-3" />
                            <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--neon-magenta)] opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--neon-magenta)]" />
                            </span>
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.badge ? (
                        <Badge
                          variant="outline"
                          className="rounded-full border-white/15 bg-white/5 text-[10px]"
                        >
                          {p.badge}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.featured && (
                          <span className="rounded-md bg-[var(--neon-cyan)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--neon-cyan)]">
                            Destaque
                          </span>
                        )}
                        {p.bestSeller && (
                          <span className="rounded-md bg-[var(--neon-lime)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--neon-lime)]">
                            Top
                          </span>
                        )}
                        <span className="flex items-center gap-0.5 text-[11px] text-amber-300">
                          <Star className="h-3 w-3 fill-current" />
                          {p.rating.toFixed(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-white/10"
                          onClick={() => openEdit(p)}
                          aria-label={`Editar ${p.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-rose-300 hover:bg-rose-500/10"
                          onClick={() => setDeleteTarget(p)}
                          aria-label={`Remover ${p.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ProductFormModal
        open={modalOpen}
        editing={editing}
        onOpenChange={setModalOpen}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="glass-strong border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover produto?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Esta ação vai remover "${deleteTarget.name}" do catálogo. Não dá pra desfazer.`
                : "Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-white/10 bg-white/5 hover:bg-white/10"
              disabled={deleting}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              disabled={deleting}
              className="bg-rose-500 text-white hover:bg-rose-500/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Coupon form modal
// ---------------------------------------------------------------------------

interface CouponFormState {
  code: string;
  type: "percent" | "fixed";
  value: string;
  minSubtotal: string;
  description: string;
  expiresAt: string; // YYYY-MM-DD or ""
  active: boolean;
}

function emptyCouponForm(): CouponFormState {
  return {
    code: "",
    type: "percent",
    value: "",
    minSubtotal: "0",
    description: "",
    expiresAt: "",
    active: true,
  };
}

function formFromCoupon(c: Coupon): CouponFormState {
  let expiresAt = "";
  if (c.expiresAt) {
    try {
      expiresAt = new Date(c.expiresAt).toISOString().slice(0, 10);
    } catch {
      expiresAt = "";
    }
  }
  return {
    code: c.code,
    type: c.type,
    value: String(c.value),
    minSubtotal: String(c.minSubtotal ?? 0),
    description: c.description ?? "",
    expiresAt,
    active: c.active,
  };
}

const COUPON_CODE_RE = /^[A-Z0-9]{3,20}$/;

function CouponFormModal({
  open,
  editing,
  onOpenChange,
}: {
  open: boolean;
  editing: Coupon | null;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CouponFormState>(emptyCouponForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Sync form whenever modal opens or editing target changes
  useEffect(() => {
    if (open) {
      setForm(editing ? formFromCoupon(editing) : emptyCouponForm());
      setErrors({});
    }
  }, [open, editing]);

  function update<K extends keyof CouponFormState>(
    key: K,
    value: CouponFormState[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  function onCodeChange(v: string) {
    const upper = v
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 20);
    update("code", upper);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const code = form.code.trim();
    const valueNum = Number(form.value);
    const minSubtotalNum = Number(form.minSubtotal) || 0;
    const description = form.description.trim();

    const nextErrors: Record<string, string> = {};
    if (!COUPON_CODE_RE.test(code))
      nextErrors.code = "Use 3 a 20 caracteres entre A-Z e 0-9.";
    if (!Number.isFinite(valueNum) || valueNum <= 0)
      nextErrors.value = "Informe um valor maior que zero.";
    if (form.type === "percent" && valueNum > 100)
      nextErrors.value = "O percentual não pode passar de 100.";
    if (!description)
      nextErrors.description = "Descreva o cupom em poucas palavras.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Verifique os campos destacados.");
      return;
    }

    const expiresAt = form.expiresAt
      ? new Date(`${form.expiresAt}T23:59:59`).toISOString()
      : null;

    setSaving(true);
    try {
      if (editing) {
        await api.updateCoupon(editing.id, {
          code,
          value: valueNum,
          minSubtotal: minSubtotalNum,
          description,
          active: form.active,
          expiresAt,
        });
        toast.success(`Cupom ${code} atualizado com sucesso.`);
      } else {
        await api.createCoupon({
          code,
          type: form.type,
          value: valueNum,
          minSubtotal: minSubtotalNum,
          description,
          active: form.active,
          expiresAt,
        });
        toast.success(`Cupom ${code} criado com sucesso.`);
      }
      await queryClient.invalidateQueries({ queryKey: ["coupons"] });
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o cupom.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-h-[90vh] overflow-y-auto border-white/10 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-gradient-neon text-xl font-black">
            {editing ? "Editar cupom" : "Novo cupom"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Ajuste as regras e a validade deste cupom."
              : "Crie um cupom de desconto para a loja."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Code + Type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-code">Código</Label>
              <Input
                id="c-code"
                value={form.code}
                onChange={(e) => onCodeChange(e.target.value)}
                placeholder="ASTRO10"
                className={cn(
                  "border-white/10 bg-white/5 font-mono uppercase tracking-wider",
                  errors.code &&
                    "border-rose-500/60 focus-visible:ring-rose-500/40",
                )}
              />
              <p className="text-xs text-muted-foreground">
                3 a 20 caracteres entre A-Z e 0-9.
              </p>
              {errors.code && (
                <p className="text-xs text-rose-300">{errors.code}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-type">Tipo de desconto</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  update("type", v as "percent" | "fixed")
                }
              >
                <SelectTrigger
                  id="c-type"
                  className="w-full border-white/10 bg-white/5"
                >
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentual</SelectItem>
                  <SelectItem value="fixed">Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Value + min subtotal */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-value">
                {form.type === "percent" ? "Valor (%)" : "Valor (R$)"}
              </Label>
              <div className="relative">
                {form.type === "fixed" && (
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    R$
                  </span>
                )}
                <Input
                  id="c-value"
                  type="number"
                  min={0}
                  step={form.type === "percent" ? "1" : "0.01"}
                  value={form.value}
                  onChange={(e) => update("value", e.target.value)}
                  placeholder={form.type === "percent" ? "10" : "50.00"}
                  className={cn(
                    "border-white/10 bg-white/5",
                    form.type === "fixed" && "pl-10",
                    form.type === "percent" && "pr-9",
                    errors.value &&
                      "border-rose-500/60 focus-visible:ring-rose-500/40",
                  )}
                />
                {form.type === "percent" && (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                )}
              </div>
              {errors.value && (
                <p className="text-xs text-rose-300">{errors.value}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-min">Subtotal mínimo (R$)</Label>
              <Input
                id="c-min"
                type="number"
                min={0}
                step="0.01"
                value={form.minSubtotal}
                onChange={(e) => update("minSubtotal", e.target.value)}
                placeholder="0"
                className="border-white/10 bg-white/5"
              />
              <p className="text-xs text-muted-foreground">
                Use 0 para liberar em qualquer compra.
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="c-desc">Descrição</Label>
            <Input
              id="c-desc"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="10% off no carrinho inteiro"
              className={cn(
                "border-white/10 bg-white/5",
                errors.description &&
                  "border-rose-500/60 focus-visible:ring-rose-500/40",
              )}
            />
            {errors.description && (
              <p className="text-xs text-rose-300">{errors.description}</p>
            )}
          </div>

          {/* Validade + active */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-expires">Validade (opcional)</Label>
              <Input
                id="c-expires"
                type="date"
                value={form.expiresAt}
                onChange={(e) => update("expiresAt", e.target.value)}
                className="border-white/10 bg-white/5"
              />
              <p className="text-xs text-muted-foreground">
                Sem data = válido por tempo indeterminado.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <div>
                <p className="text-sm font-medium">Ativo</p>
                <p className="text-xs text-muted-foreground">
                  Cupons inativos não aparecem no checkout.
                </p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => update("active", v)}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10"
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[var(--neon-cyan)] text-black hover:bg-[var(--neon-cyan)]/90"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Coupons tab
// ---------------------------------------------------------------------------

function CouponsTab() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["coupons"],
    queryFn: () => api.listCoupons(),
  });

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(c: Coupon) {
    setEditing(c);
    setModalOpen(true);
  }

  async function onToggle(c: Coupon) {
    setTogglingId(c.id);
    try {
      await api.updateCoupon(c.id, { active: !c.active });
      await queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success(
        `Cupom ${c.code} ${c.active ? "desativado" : "ativado"}.`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar o cupom.",
      );
    } finally {
      setTogglingId(null);
    }
  }

  async function onCopy(c: Coupon) {
    try {
      await navigator.clipboard.writeText(c.code);
      toast.success(`Cupom ${c.code} copiado.`);
    } catch {
      toast.error("Não foi possível copiar o código.");
    }
  }

  async function onConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteCoupon(deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success(`Cupom ${deleteTarget.code} removido.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível remover o cupom.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">Cupons de desconto</h3>
          <p className="text-xs text-muted-foreground">
            Crie e gerencie os cupons da loja.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] text-black hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Novo cupom
        </Button>
      </div>

      {data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniStat
            icon={<Ticket className="h-4 w-4" />}
            label="Cupons ativos"
            value={String(data.filter((c) => c.active).length)}
            accent="#34e7ff"
          />
          <MiniStat
            icon={<Receipt className="h-4 w-4" />}
            label="Total de usos"
            value={String(
              data.reduce((acc, c) => acc + (c.usageCount ?? 0), 0),
            )}
            accent="#ff5cf0"
          />
          <MiniStat
            icon={<TrendingUp className="h-4 w-4" />}
            label="Desconto gerado"
            value={formatPrice(
              data.reduce((acc, c) => acc + (c.totalDiscount ?? 0), 0),
            )}
            accent="#c6ff5a"
          />
        </div>
      )}

      {isError ? (
        <div className="glass rounded-2xl border border-white/10 p-8 text-center text-sm text-muted-foreground">
          <p className="mb-4">
            Não foi possível carregar os cupons. Tente novamente em instantes.
          </p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="border-white/10 bg-white/5 hover:bg-white/10"
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-white/10 p-3 sm:p-4">
          <div className="max-h-[28rem] max-w-full overflow-y-auto overflow-x-auto rounded-xl border border-white/5">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-[var(--card)] backdrop-blur">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                    Código
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                    Descrição
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                    Tipo
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                    Valor
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                    Subtotal mín.
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                    Usos
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                    Desconto gerado
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                    Validade
                  </TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i} className="border-white/5">
                      <TableCell colSpan={10}>
                        <Skeleton className="h-9 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : !data || data.length === 0 ? (
                  <TableRow className="border-white/5">
                    <TableCell colSpan={10} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                          <Ticket className="h-6 w-6 opacity-60" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Nenhum cupom criado ainda
                          </p>
                          <p className="text-xs">
                            Crie o primeiro cupom de desconto da Astrofeet.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={openCreate}
                          className="bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] text-black hover:opacity-90"
                        >
                          <Plus className="h-4 w-4" />
                          Criar primeiro cupom
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: Math.min(i * 0.04, 0.3),
                      }}
                      className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                    >
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => onCopy(c)}
                          className="group inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-[var(--neon-cyan)] transition-colors hover:text-[var(--neon-cyan)]/80"
                          title="Copiar código"
                          aria-label={`Copiar cupom ${c.code}`}
                        >
                          {c.code}
                          <Copy className="h-3 w-3 opacity-50 transition-opacity group-hover:opacity-100" />
                        </button>
                      </TableCell>
                      <TableCell className="max-w-[18rem]">
                        <p className="line-clamp-1 text-sm text-foreground">
                          {c.description || "—"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {c.type === "percent" ? "Percentual" : "Fixo"}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {c.type === "percent"
                          ? `${c.value}%`
                          : formatPrice(c.value)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.minSubtotal > 0
                          ? formatPrice(c.minSubtotal)
                          : "Sem mínimo"}
                      </TableCell>
                      <TableCell>
                        {c.active ? (
                          <Badge
                            variant="outline"
                            className="rounded-full border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300"
                          >
                            Ativo
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="rounded-full border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
                          >
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {(c.usageCount ?? 0) > 0 ? (
                          <Badge
                            variant="outline"
                            className="rounded-full border-cyan-500/30 bg-cyan-500/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-300"
                          >
                            {c.usageCount}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(c.totalDiscount ?? 0) > 0 ? (
                          <span className="text-sm font-semibold text-emerald-300">
                            {formatPrice(c.totalDiscount ?? 0)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.expiresAt ? formatDate(c.expiresAt) : "Sem prazo"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                              "h-8 w-8 hover:bg-white/10",
                              c.active
                                ? "text-emerald-300"
                                : "text-muted-foreground",
                            )}
                            onClick={() => onToggle(c)}
                            disabled={togglingId === c.id}
                            aria-label={
                              c.active
                                ? `Desativar ${c.code}`
                                : `Ativar ${c.code}`
                            }
                            title={c.active ? "Desativar" : "Ativar"}
                          >
                            {togglingId === c.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 hover:bg-white/10"
                            onClick={() => openEdit(c)}
                            aria-label={`Editar ${c.code}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-rose-300 hover:bg-rose-500/10"
                            onClick={() => setDeleteTarget(c)}
                            aria-label={`Remover ${c.code}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <CouponFormModal
        open={modalOpen}
        editing={editing}
        onOpenChange={setModalOpen}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="glass-strong border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover cupom?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Esta ação vai remover o cupom "${deleteTarget.code}" da loja. Não dá pra desfazer.`
                : "Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-white/10 bg-white/5 hover:bg-white/10"
              disabled={deleting}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              disabled={deleting}
              className="bg-rose-500 text-white hover:bg-rose-500/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Notifications tab
// ---------------------------------------------------------------------------

type NotificationIcon = React.ComponentType<{ className?: string }>;

const NOTIFICATION_META: Record<
  NotificationType,
  { Icon: NotificationIcon; color: string }
> = {
  order_created: { Icon: Package, color: "#34e7ff" },
  order_status: { Icon: Truck, color: "#a779ff" },
  coupon_applied: { Icon: Ticket, color: "#ff5cf0" },
  welcome: { Icon: Sparkles, color: "#c6ff5a" },
};

function NotificationStatusBadge({
  status,
}: {
  status: Notification["status"];
}) {
  const map: Record<
    Notification["status"],
    { label: string; className: string }
  > = {
    sent: {
      label: "Enviado",
      className:
        "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
    },
    queued: {
      label: "Na fila",
      className: "border-amber-500/30 bg-amber-500/15 text-amber-300",
    },
    failed: {
      label: "Falhou",
      className: "border-rose-500/30 bg-rose-500/15 text-rose-300",
    },
  };
  const s = map[status] ?? map.sent;
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
        s.className,
      )}
    >
      {s.label}
    </Badge>
  );
}

function NotificationsTab() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.listNotifications(50),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">Central de notificações</h3>
          <p className="text-xs text-muted-foreground">
            Veja os e-mails enviados automaticamente pela loja (simulação).
          </p>
        </div>
        <Button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["notifications"] })
          }
          variant="outline"
          disabled={isFetching}
          className="border-white/10 bg-white/5 hover:bg-white/10"
        >
          <RefreshCw
            className={cn("h-4 w-4", isFetching && "animate-spin")}
          />
          Atualizar
        </Button>
      </div>

      {isError ? (
        <div className="glass rounded-2xl border border-white/10 p-8 text-center text-sm text-muted-foreground">
          <p className="mb-4">
            Não foi possível carregar as notificações. Tente novamente em
            instantes.
          </p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="border-white/10 bg-white/5 hover:bg-white/10"
          >
            Tentar novamente
          </Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="glass rounded-2xl border border-white/10 p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <Bell className="h-7 w-7 opacity-60" />
          </div>
          <p className="font-medium text-foreground">
            Nenhuma notificação enviada ainda.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Quando um pedido for criado ou tiver o status alterado, o e-mail
            aparecerá aqui.
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
            {data.map((n, i) => {
              const meta = NOTIFICATION_META[n.type] ?? NOTIFICATION_META.order_created;
              const isOpen = expandedId === n.id;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: Math.min(i * 0.04, 0.4),
                  }}
                >
                  <Collapsible
                    open={isOpen}
                    onOpenChange={(open) =>
                      setExpandedId(open ? n.id : null)
                    }
                  >
                    <div className="glass rounded-2xl border border-white/10 p-4 transition-colors hover:bg-white/[0.03]">
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10"
                          style={{
                            color: meta.color,
                            background: `${meta.color}1f`,
                          }}
                        >
                          <meta.Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <CollapsibleTrigger asChild>
                              <button
                                type="button"
                                className="text-left text-sm font-medium leading-tight transition-colors hover:text-[var(--neon-cyan)]"
                              >
                                {n.subject}
                              </button>
                            </CollapsibleTrigger>
                            <NotificationStatusBadge status={n.status} />
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              Para: {n.to}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(n.sentAt)}
                            </span>
                            {n.orderId && (
                              <button
                                type="button"
                                onClick={() =>
                                  toast(`Pedido ${n.orderId}`)
                                }
                                className="inline-flex items-center gap-1 text-[var(--neon-cyan)] transition-colors hover:underline"
                              >
                                <Package className="h-3 w-3" />
                                Ver pedido
                              </button>
                            )}
                          </div>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 hover:bg-white/10"
                            aria-label={isOpen ? "Recolher" : "Expandir"}
                          >
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform",
                                isOpen && "rotate-180",
                              )}
                            />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent>
                        <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-black/30 p-3 font-mono text-xs leading-relaxed text-foreground/90">
                          {n.body}
                        </pre>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                </motion.div>
              );
            })}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Mostrando {data.length}{" "}
            {data.length === 1 ? "notificação" : "notificações"}
          </p>
        </>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main AdminView
// ---------------------------------------------------------------------------

export function AdminView() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const navigate = useUIStore((s) => s.navigate);
  const [tab, setTab] = useState("overview");

  // Guard: wait for hydration, then enforce admin role
  if (!hydrated) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
        <div className="glass flex items-center gap-3 rounded-2xl border border-white/10 px-5 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando painel...
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return <AdminGuard />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--neon-cyan)]">
            Astrofeet · Comando
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
            <span className="text-gradient-neon">Painel do Comando</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conectado como{" "}
            <span className="font-medium text-foreground">{user.email}</span>
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("home")}
          className="w-fit border-white/10 bg-white/5 hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à loja
        </Button>
      </motion.div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="gap-5">
        <TabsList className="glass h-auto w-full justify-start gap-1 rounded-xl border border-white/10 p-1 sm:w-auto">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-[var(--neon-cyan)]/15 data-[state=active]:text-[var(--neon-cyan)] rounded-lg px-4 py-2"
          >
            Visão geral
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="data-[state=active]:bg-[var(--neon-cyan)]/15 data-[state=active]:text-[var(--neon-cyan)] rounded-lg px-4 py-2"
          >
            Pedidos
          </TabsTrigger>
          <TabsTrigger
            value="products"
            className="data-[state=active]:bg-[var(--neon-cyan)]/15 data-[state=active]:text-[var(--neon-cyan)] rounded-lg px-4 py-2"
          >
            Produtos
          </TabsTrigger>
          <TabsTrigger
            value="cupons"
            className="data-[state=active]:bg-[var(--neon-cyan)]/15 data-[state=active]:text-[var(--neon-cyan)] rounded-lg px-4 py-2"
          >
            <Ticket className="h-4 w-4" />
            Cupons
          </TabsTrigger>
          <TabsTrigger
            value="notificacoes"
            className="data-[state=active]:bg-[var(--neon-cyan)]/15 data-[state=active]:text-[var(--neon-cyan)] rounded-lg px-4 py-2"
          >
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersTable />
        </TabsContent>
        <TabsContent value="products">
          <ProductsTable />
        </TabsContent>
        <TabsContent value="cupons">
          <CouponsTab />
        </TabsContent>
        <TabsContent value="notificacoes">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminView;

"use client";

import { motion } from "framer-motion";

import type { Order, OrderStatus } from "@/shared/types";
import { orderStatusLabel, orderStatusColor } from "@/shared/format";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { fadeUp } from "@/components/shared/motion";

export const CHART_PALETTE = ["#cc3d0a", "#c8102e", "#111111", "#15803d", "#b45309"];

export const ALL_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44];

export const ACCENT_PRESETS: { name: string; value: string }[] = [
  { name: "Laranja", value: "#cc3d0a" },
  { name: "Vermelho", value: "#c8102e" },
  { name: "Preto", value: "#111111" },
  { name: "Verde", value: "#15803d" },
  { name: "Ouro", value: "#a16207" },
  { name: "Âmbar", value: "#b45309" },
];

export const BADGE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Nenhum" },
  { value: "Novo", label: "Novo" },
  { value: "Drop limitado", label: "Drop limitado" },
  { value: "Mais vendido", label: "Mais vendido" },
];

export function itemsCount(order: Order): number {
  return order.items.reduce((acc, it) => acc + it.quantity, 0);
}

export interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  index?: number;
}

export function MetricCard({ icon, label, value, accent, index = 0 }: MetricCardProps) {
  return (
    <motion.div
      {...fadeUp}
      transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.3) }}
      className="glass relative overflow-hidden rounded-2xl border border-black/10 p-5"
    >
      <div className="relative flex items-start justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/10"
          style={{
            color: accent,
            background: `${accent}1f`,
          }}
        >
          {icon}
        </div>
      </div>
      <p className="relative mt-4 text-3xl font-black tracking-tight">{value}</p>
      <p className="relative mt-1 text-xs tracking-wider text-muted-foreground uppercase">{label}</p>
    </motion.div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="glass rounded-2xl border border-black/10 p-5">
      <Skeleton className="h-11 w-11 rounded-xl" />
      <Skeleton className="mt-4 h-9 w-24" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

export interface MiniStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}

export function MiniStat({ icon, label, value, accent }: MiniStatProps) {
  return (
    <div className="glass flex items-center gap-3 rounded-2xl border border-black/10 p-3 sm:p-4">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-black/10"
        style={{ color: accent, background: `${accent}1f` }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg leading-tight font-bold tracking-tight">{value}</p>
        <p className="text-[11px] tracking-wider text-muted-foreground uppercase">{label}</p>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", orderStatusColor(status))}
    >
      {orderStatusLabel(status)}
    </Badge>
  );
}

"use client";

import { motion } from "framer-motion";
import { User, ShieldCheck, CreditCard, QrCode, Barcode, LifeBuoy, Truck } from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { toast } from "sonner";
import type { Order } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { EmptyState } from "@/components/shared/EmptyState";

export type PaymentInfo = Order["payment"] & {
  couponCode?: string;
  discount?: number;
};

export function paymentMethodInfo(method: string): {
  label: string;
  icon: React.ReactNode;
} {
  switch (method) {
    case "card":
      return { label: "Cartão de crédito", icon: <CreditCard className="h-4 w-4" /> };
    case "pix":
      return { label: "Pix", icon: <QrCode className="h-4 w-4" /> };
    case "boleto":
      return { label: "Boleto", icon: <Barcode className="h-4 w-4" /> };
    default:
      return { label: method || "Pagamento", icon: <CreditCard className="h-4 w-4" /> };
  }
}

export function getInitial(name: string | undefined): string {
  if (!name) return "✦";
  const trimmed = name.trim();
  if (!trimmed) return "✦";
  return trimmed[0]!.toUpperCase();
}

export function itemsSummary(order: Order): string {
  const items = order.items;
  if (items.length === 0) return "Sem itens";
  const firstTwo = items.slice(0, 2).map((i) => `${i.name} (Tam ${i.size})`);
  const more = items.length - 2;
  const base = firstTwo.join(", ");
  if (more > 0) return `${base} +${more} mais`;
  return base;
}

export function itemCount(order: Order): number {
  return order.items.reduce((n, i) => n + i.quantity, 0);
}

export function isCancelled(status: string): boolean {
  return status === "cancelled";
}

export function HydrationSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="glass-strong mb-6 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full bg-black/[0.03]" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40 rounded bg-black/[0.03]" />
              <Skeleton className="h-4 w-56 rounded bg-black/[0.03]" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-24 rounded-full bg-black/[0.03]" />
            <Skeleton className="h-9 w-24 rounded-full bg-black/[0.03]" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-2xl bg-black/[0.03]" />
          <Skeleton className="h-20 rounded-2xl bg-black/[0.03]" />
          <Skeleton className="h-20 rounded-2xl bg-black/[0.03]" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-3xl bg-black/[0.03]" />
        ))}
      </div>
    </div>
  );
}

export function NotSignedIn() {
  const openAuth = useUIStore((s) => s.openAuth);
  const navigate = useUIStore((s) => s.navigate);
  return (
    <section className="px-4 py-20">
      <EmptyState
        icon={User}
        title="Você ainda não entrou na sua conta"
        action={
          <Button onClick={() => openAuth("login")} className="rounded-full">
            Entrar / Criar conta
          </Button>
        }
      >
        Entre para acompanhar seus pedidos, ver seu histórico de compras e acessar sua lista de desejos.
      </EmptyState>
    </section>
  );
}

export function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-black/[0.02] p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: `${accent}22`, color: accent }}
        >
          {icon}
        </span>
        <p className="text-[11px] font-medium tracking-wider uppercase">{label}</p>
      </div>
      <p className="mt-2 text-xl font-black tracking-tight sm:text-2xl">{value}</p>
    </div>
  );
}

export function HelpFooter() {
  const navigate = useUIStore((s) => s.navigate);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className="glass mt-6 flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-black/[0.03]">
          <ShieldCheck className="h-6 w-6 text-[var(--success)]" />
        </div>
        <div>
          <p className="text-sm font-bold">Precisa de ajuda?</p>
          <p className="text-xs text-muted-foreground">
            O assistente está pronto para tirar suas dúvidas sobre pedidos, pagamentos e entregas.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => toast("O assistente está no canto inferior direito, pronto para ajudar")}
          variant="outline"
          className="rounded-full border-black/15 bg-black/[0.03] px-4 py-2 text-xs font-semibold backdrop-blur transition hover:bg-black/[0.06]"
        >
          <LifeBuoy className="h-4 w-4" />
          Falar com o assistente
        </Button>
        <Button
          onClick={() => navigate("track-order")}
          className="rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-bold text-white hover:opacity-90"
        >
          <Truck className="h-4 w-4" />
          Rastrear um pedido
        </Button>
      </div>
    </motion.div>
  );
}

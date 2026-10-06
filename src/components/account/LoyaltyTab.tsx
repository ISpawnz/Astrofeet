"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, Clock, Loader2, Star, Gift, TrendingUp, Copy } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { api } from "@/client/api";
import { formatPrice, formatDate } from "@/shared/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { fadeUp } from "@/components/shared/motion";

export const REDEEM_TIERS = [
  { cost: 100, value: 5, accent: "var(--brand)" },
  { cost: 250, value: 12.5, accent: "var(--ink)" },
  { cost: 500, value: 25, accent: "var(--hot)" },
] as const;

export function LoyaltyTab() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const queryClient = useQueryClient();
  const navigate = useUIStore((s) => s.navigate);

  const { data, isLoading } = useQuery({
    queryKey: ["loyalty"],
    queryFn: () => api.getLoyalty(),
    enabled: hydrated && !!user,
  });

  const [redeemingCost, setRedeemingCost] = useState<number | null>(null);

  const points = data?.points ?? 0;
  const pointsValue = data?.pointsValue ?? 0;
  const minRedeemPoints = data?.minRedeemPoints ?? 100;
  const history = data?.history ?? [];

  // Progress toward next redemption tier (uses the smallest tier the user
  // has not yet reached, capped at 100%).
  const nextTier = REDEEM_TIERS.find((t) => t.cost > points)?.cost ?? REDEEM_TIERS[REDEEM_TIERS.length - 1]!.cost;
  const prevTier = [...REDEEM_TIERS].reverse().find((t) => t.cost <= points)?.cost ?? 0;
  const span = Math.max(1, nextTier - prevTier);
  const progressPct = Math.min(100, Math.max(0, ((points - prevTier) / span) * 100));

  async function handleRedeem(cost: number) {
    setRedeemingCost(cost);
    try {
      const res = await api.redeemLoyalty(cost);
      toast.success(`Cupom ${res.coupon.code} criado! Use no checkout.`, {
        icon: <Gift className="h-4 w-4" />,
      });
      // Copy coupon code to clipboard.
      try {
        await navigator.clipboard.writeText(res.coupon.code);
        toast.success("Código copiado!", { icon: <Copy className="h-4 w-4" /> });
      } catch {
        // Clipboard may be unavailable (e.g. non-secure context); ignore.
      }
      await queryClient.invalidateQueries({ queryKey: ["loyalty"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível resgatar pontos agora.");
    } finally {
      setRedeemingCost(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="glass-strong relative overflow-hidden rounded-3xl p-6 sm:p-8"
      >
        {/* Gradient glows */}

        {/* Floating sparkles icon */}

        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            <Star className="h-3.5 w-3.5 text-[var(--ink)]" />
            Programa de recompensas
          </div>

          {isLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-14 w-44 rounded-xl" />
              <Skeleton className="h-4 w-56 rounded" />
              <Skeleton className="mt-3 h-2 w-full rounded-full" />
            </div>
          ) : (
            <>
              <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="text-gradient-animated text-5xl leading-none font-black sm:text-6xl">
                  {points.toLocaleString("pt-BR")}
                </span>
                <span className="mb-1 text-sm font-semibold text-muted-foreground">pontos</span>
              </div>

              <p className="mt-2 text-sm font-semibold text-[var(--success)]">
                Vale {formatPrice(pointsValue)} em descontos
              </p>

              {/* Progress bar */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Progresso até{" "}
                    <span className="font-bold text-foreground">{nextTier.toLocaleString("pt-BR")} pts</span>
                  </span>
                  <span>{Math.round(progressPct)}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-black/[0.06]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="h-full rounded-full bg-[var(--brand)]"
                  />
                </div>
                {points < minRedeemPoints ? (
                  <p className="text-[11px] text-muted-foreground">
                    Mínimo de {minRedeemPoints} pts para o primeiro resgate.
                  </p>
                ) : (
                  <p className="text-[11px] text-[var(--success)]">Você já pode resgatar recompensas! ✦</p>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Info banner */}
      <div className="glass flex items-start gap-3 rounded-2xl border border-amber-500/20 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-700">
          <Sparkles className="h-4 w-4" />
        </div>
        <p className="text-sm text-foreground/85">
          Ganhe <span className="font-bold text-amber-700">1 ponto</span> para cada{" "}
          <span className="font-bold text-amber-700">R$1</span> gasto. Use os pontos para resgatar cupons de desconto
          exclusivos.
        </p>
      </div>

      {/* Redemption section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ink)]/15 text-[var(--ink)]">
            <Gift className="h-4 w-4" />
          </span>
          <h3 className="text-lg font-bold sm:text-xl">Resgatar recompensas</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {REDEEM_TIERS.map((tier) => {
            const canRedeem = points >= tier.cost;
            const isRedeeming = redeemingCost === tier.cost;
            return (
              <motion.div
                key={tier.cost}
                {...fadeUp}
                transition={{ duration: 0.35 }}
                className="glass relative flex flex-col gap-3 overflow-hidden rounded-2xl p-5"
              >
                <div className="relative">
                  <p className="text-3xl font-black tracking-tight" style={{ color: tier.accent }}>
                    {tier.cost}
                    <span className="ml-1 text-sm font-semibold text-muted-foreground">pts</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Cupom de desconto</p>
                  <p className="text-xl font-bold text-foreground">{formatPrice(tier.value)}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRedeem(tier.cost)}
                  disabled={!canRedeem || isRedeeming}
                  aria-disabled={!canRedeem}
                  title={canRedeem ? `Resgatar por ${tier.cost} pontos` : "Pontos insuficientes"}
                  className={cn(
                    "relative mt-auto flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all",
                    canRedeem
                      ? "bg-[var(--brand)] text-white hover:opacity-90"
                      : "cursor-not-allowed border border-black/10 bg-black/[0.02] text-muted-foreground",
                  )}
                >
                  {isRedeeming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resgatando…
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4" />
                      Resgatar
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* History section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)]/15 text-[var(--brand)]">
            <Clock className="h-4 w-4" />
          </span>
          <h3 className="text-lg font-bold sm:text-xl">Histórico de pontos</h3>
        </div>

        <div className="glass-strong rounded-2xl p-2 sm:p-3">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/[0.024]">
                <Sparkles className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">Você ainda não ganhou pontos.</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Faça um pedido para começar a acumular recompensas!
              </p>
              <Button
                type="button"
                onClick={() => navigate("products")}
                className="mt-1 gap-2 rounded-full bg-[var(--brand)] px-5 font-bold text-white hover:opacity-90"
              >
                Explorar drops
              </Button>
            </div>
          ) : (
            <ul className="max-h-64 space-y-1.5 overflow-y-auto p-1 sm:p-2">
              {history.map((entry, i) => (
                <motion.li
                  key={`${entry.date}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4) }}
                  className="flex items-center gap-3 rounded-xl border border-black/5 bg-black/[0.02] p-3 transition hover:border-black/15"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--success)]/15 text-[var(--success)]">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {entry.description || "Pedido concluído"}
                    </p>
                    <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(entry.date)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[var(--success)]/15 px-2.5 py-1 text-xs font-bold text-[var(--success)]">
                    +{entry.points}
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

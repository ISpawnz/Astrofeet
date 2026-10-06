"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Package, Heart, ShoppingBag, Mail, Sparkles, Wallet } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { useWishlistStore } from "@/stores/wishlist";
import { useCartStore } from "@/stores/cart";
import { api } from "@/client/api";
import { formatPrice } from "@/shared/format";
import { toast } from "sonner";
import type { Order, PublicUser } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { fadeUp } from "@/components/shared/motion";
import { StatCard, getInitial } from "./shared";

export function AccountHeader({ user, orders }: { user: PublicUser; orders: Order[] | undefined }) {
  const navigate = useUIStore((s) => s.navigate);
  const logout = useAuthStore((s) => s.logout);
  const cartCount = useCartStore((s) => s.count());
  const wishlistCount = useWishlistStore((s) => s.count());
  const [leaving, setLeaving] = useState(false);

  const totalOrders = orders?.length ?? 0;
  const totalInvested = orders?.reduce((sum, o) => sum + (o.total || 0), 0) ?? 0;

  const roleLabel = user.role === "admin" ? "Administrador" : "Cliente";
  const roleAccent = user.role === "admin" ? "var(--hot)" : "var(--brand)";

  async function handleLogout() {
    setLeaving(true);
    try {
      await api.logout();
    } catch {
      // ignore network errors — we still clear locally
    }
    logout();
    toast.success("Você saiu da sua conta. Até a próxima!");
    setLeaving(false);
    navigate("home");
  }

  return (
    <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="glass-strong rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center sm:h-20 sm:w-20">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand)] text-2xl font-black text-white sm:h-20 sm:w-20 sm:text-3xl">
              {getInitial(user.name)}
            </div>
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-black tracking-tight sm:text-2xl">{user.name}</h1>
              <Badge
                variant="outline"
                className="rounded-full border-black/15 px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ color: roleAccent, borderColor: `${roleAccent}55` }}
              >
                <Sparkles className="mr-1 h-3 w-3" />
                {roleLabel}
              </Badge>
            </div>
            <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{user.email}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => navigate("wishlist")}
            variant="outline"
            className="rounded-full border-black/15 bg-black/[0.03] px-4 py-2 text-xs font-semibold backdrop-blur transition hover:bg-black/[0.06]"
          >
            <Heart className="h-4 w-4 text-[var(--hot)]" />
            Ver lista de desejos
            {wishlistCount > 0 && (
              <span className="ml-1 rounded-full bg-[var(--hot)] px-1.5 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Button>
          <Button
            onClick={handleLogout}
            disabled={leaving}
            variant="ghost"
            className="rounded-full px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-500/10 hover:text-rose-700"
          >
            <LogOut className="h-4 w-4" />
            {leaving ? "Saindo..." : "Sair"}
          </Button>
        </div>
      </div>

      <Separator className="my-6 bg-black/[0.06]" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Package className="h-4 w-4" />}
          label="Total de pedidos"
          value={orders ? String(totalOrders) : "—"}
          accent="var(--brand)"
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Total investido"
          value={orders ? formatPrice(totalInvested) : "—"}
          accent="var(--ink)"
        />
        <StatCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="No carrinho"
          value={String(cartCount)}
          accent="var(--success)"
        />
      </div>
    </motion.div>
  );
}

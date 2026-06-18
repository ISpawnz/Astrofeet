"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  LogOut,
  Package,
  Rocket,
  ChevronDown,
  ChevronRight,
  Heart,
  ShoppingBag,
  Mail,
  ShieldCheck,
  CreditCard,
  QrCode,
  Barcode,
  MapPin,
  CalendarDays,
  Compass,
  LifeBuoy,
  Sparkles,
  AlertCircle,
  Wallet,
  Hash,
  Layers,
  Clock,
  KeyRound,
  Home,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { useWishlistStore } from "@/stores/wishlist";
import { useCartStore } from "@/stores/cart";
import { api } from "@/lib/client";
import {
  formatPrice,
  formatDate,
  orderStatusLabel,
  orderStatusColor,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Order, PublicUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

// ---------- Helpers ----------

type PaymentInfo = Order["payment"] & {
  couponCode?: string;
  discount?: number;
};

function paymentMethodInfo(method: string): {
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

function getInitial(name: string | undefined): string {
  if (!name) return "✦";
  const trimmed = name.trim();
  if (!trimmed) return "✦";
  return trimmed[0]!.toUpperCase();
}

function itemsSummary(order: Order): string {
  const items = order.items;
  if (items.length === 0) return "Sem itens";
  const firstTwo = items.slice(0, 2).map((i) => `${i.name} (Tam ${i.size})`);
  const more = items.length - 2;
  const base = firstTwo.join(", ");
  if (more > 0) return `${base} +${more} mais`;
  return base;
}

function itemCount(order: Order): number {
  return order.items.reduce((n, i) => n + i.quantity, 0);
}

function isCancelled(status: string): boolean {
  return status === "cancelled";
}

// ---------- Hydration skeleton ----------

function HydrationSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="glass-strong mb-6 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full bg-white/5" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40 rounded bg-white/5" />
              <Skeleton className="h-4 w-56 rounded bg-white/5" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-24 rounded-full bg-white/5" />
            <Skeleton className="h-9 w-24 rounded-full bg-white/5" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-2xl bg-white/5" />
          <Skeleton className="h-20 rounded-2xl bg-white/5" />
          <Skeleton className="h-20 rounded-2xl bg-white/5" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-3xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}

// ---------- Auth guard ----------

function NotSignedIn() {
  const openAuth = useUIStore((s) => s.openAuth);
  const navigate = useUIStore((s) => s.navigate);
  return (
    <section className="mx-auto flex min-h-[68vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass flex w-full flex-col items-center gap-6 rounded-3xl p-10 sm:p-14"
      >
        <div className="relative flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[var(--neon-violet)]/15 blur-3xl" />
          <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-dashed border-[var(--neon-cyan)]/30" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <User className="h-10 w-10 text-[var(--neon-cyan)]" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold sm:text-3xl">
            Você ainda não entrou na órbita
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Entre na sua conta para acompanhar seus pedidos, ver seu histórico de
            compras e acessar sua lista de desejos a qualquer momento.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() => openAuth("login")}
            className="rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-6 py-3 text-sm font-bold text-black hover:opacity-90"
          >
            Entrar / Criar conta
          </Button>
          <Button
            onClick={() => navigate("home")}
            variant="outline"
            className="rounded-full border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/10"
          >
            Voltar ao início
          </Button>
        </div>
      </motion.div>
    </section>
  );
}

// ---------- Header ----------

function StatCard({
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
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div
        className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-25 blur-2xl"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="flex items-center gap-2 text-muted-foreground">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: `${accent}22`, color: accent }}
        >
          {icon}
        </span>
        <p className="text-[11px] font-medium uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

function AccountHeader({
  user,
  orders,
}: {
  user: PublicUser;
  orders: Order[] | undefined;
}) {
  const navigate = useUIStore((s) => s.navigate);
  const logout = useAuthStore((s) => s.logout);
  const cartCount = useCartStore((s) => s.count());
  const wishlistCount = useWishlistStore((s) => s.count());
  const [leaving, setLeaving] = useState(false);

  const totalOrders = orders?.length ?? 0;
  const totalInvested =
    orders?.reduce((sum, o) => sum + (o.total || 0), 0) ?? 0;

  const roleLabel = user.role === "admin" ? "Comando" : "Explorador";
  const roleAccent =
    user.role === "admin" ? "var(--neon-magenta)" : "var(--neon-cyan)";

  async function handleLogout() {
    setLeaving(true);
    try {
      await api.logout();
    } catch {
      // ignore network errors — we still clear locally
    }
    logout();
    toast.success("Você saiu da órbita. Até a próxima! 🚀");
    setLeaving(false);
    navigate("home");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-strong rounded-3xl p-6 sm:p-8"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center sm:h-20 sm:w-20">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-violet)] opacity-40 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-violet)] text-2xl font-black text-black sm:h-20 sm:w-20 sm:text-3xl">
              {getInitial(user.name)}
            </div>
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-black tracking-tight sm:text-2xl">
                {user.name}
              </h1>
              <Badge
                variant="outline"
                className="rounded-full border-white/15 px-2.5 py-0.5 text-[11px] font-semibold"
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
            className="rounded-full border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/10"
          >
            <Heart className="h-4 w-4 text-[var(--neon-magenta)]" />
            Ver lista de desejos
            {wishlistCount > 0 && (
              <span className="ml-1 rounded-full bg-[var(--neon-magenta)] px-1.5 text-[10px] font-bold text-black">
                {wishlistCount}
              </span>
            )}
          </Button>
          <Button
            onClick={handleLogout}
            disabled={leaving}
            variant="ghost"
            className="rounded-full px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
          >
            <LogOut className="h-4 w-4" />
            {leaving ? "Saindo..." : "Sair"}
          </Button>
        </div>
      </div>

      <Separator className="my-6 bg-white/10" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Package className="h-4 w-4" />}
          label="Total de pedidos"
          value={orders ? String(totalOrders) : "—"}
          accent="var(--neon-cyan)"
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Total investido"
          value={orders ? formatPrice(totalInvested) : "—"}
          accent="var(--neon-violet)"
        />
        <StatCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="No carrinho"
          value={String(cartCount)}
          accent="var(--neon-lime)"
        />
      </div>
    </motion.div>
  );
}

// ---------- Order card ----------

function OrderCard({ order, index }: { order: Order; index: number }) {
  const navigate = useUIStore((s) => s.navigate);
  const [open, setOpen] = useState(false);

  const pay = paymentMethodInfo(order.payment.method);
  const payment = order.payment as PaymentInfo;
  const couponCode = payment.couponCode;
  const discount = payment.discount ?? 0;
  const cancelled = isCancelled(order.status);
  const items = order.items;
  const total = itemCount(order);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.4) }}
      className={cn(
        "glass overflow-hidden rounded-3xl transition",
        cancelled && "opacity-90",
      )}
    >
      {/* Top row */}
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Package className="h-5 w-5 text-[var(--neon-cyan)]" />
            </div>
            <div>
              <p className="font-mono text-sm font-black tracking-wider text-[var(--neon-cyan)] neon-text sm:text-base">
                {order.code}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "h-8 gap-1.5 rounded-full px-3 text-xs font-semibold",
              orderStatusColor(order.status),
            )}
          >
            {orderStatusLabel(order.status)}
          </Badge>
        </div>

        {/* Items summary */}
        <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
          <p className="line-clamp-2 text-sm text-foreground/90">
            {itemsSummary(order)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {total} {total === 1 ? "item" : "itens"}
            </span>
            <span className="flex items-center gap-1">
              {pay.icon}
              {pay.label}
              {order.payment.method === "card" && order.payment.cardLast4 && (
                <span className="font-mono text-foreground/70">
                  · final {order.payment.cardLast4}
                </span>
              )}
            </span>
            {couponCode && discount > 0 && (
              <span className="flex items-center gap-1 font-semibold text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                Cupom {couponCode} · -{formatPrice(discount)}
              </span>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Total
            </p>
            <p
              className={cn(
                "text-lg font-black tracking-tight sm:text-xl",
                cancelled
                  ? "text-muted-foreground line-through"
                  : "text-gradient-neon",
              )}
            >
              {formatPrice(order.total)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() =>
                navigate("track-order", { code: order.code })
              }
              className="rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-4 py-2 text-xs font-bold text-black hover:opacity-90"
            >
              <Rocket className="h-4 w-4" />
              Rastrear
            </Button>
            <Collapsible open={open} onOpenChange={setOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/10"
                >
                  {open ? (
                    <>
                      Ocultar detalhes
                      <ChevronDown className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Ver detalhes
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleContent className="CollapsibleContent">
          <AnimatePresence>
            {open && (
              <motion.div
                key="details"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden border-t border-white/10"
              >
                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                  {/* Items list */}
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Package className="h-4 w-4 text-[var(--neon-cyan)]" />
                      Itens do pedido
                    </h3>
                    <ul className="space-y-2.5">
                      {items.map((item, i) => (
                        <li
                          key={`${item.productId}-${item.size}-${i}`}
                          className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex flex-1 flex-col">
                            <p className="line-clamp-1 text-sm font-semibold">
                              {item.name}
                            </p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                Tam. {item.size}
                              </span>
                              <span className="flex items-center gap-1">
                                <Layers className="h-3 w-3" />
                                Qtd. {item.quantity}
                              </span>
                              <span>{formatPrice(item.unitPrice)} / un.</span>
                            </p>
                          </div>
                          <p className="self-center text-sm font-bold">
                            {formatPrice(item.subtotal)}
                          </p>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-2 space-y-1.5 rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-medium text-foreground">
                          {formatPrice(order.subtotal)}
                        </span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-emerald-300">
                          <span>Desconto</span>
                          <span className="font-medium">
                            -{formatPrice(discount)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-muted-foreground">
                        <span>Frete</span>
                        <span className="font-medium text-foreground">
                          {order.shipping === 0
                            ? "Grátis"
                            : formatPrice(order.shipping)}
                        </span>
                      </div>
                      <Separator className="my-1 bg-white/10" />
                      <div className="flex justify-between text-base font-bold">
                        <span>Total</span>
                        <span className="text-gradient-neon">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Side: address + payment */}
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <MapPin className="h-4 w-4 text-[var(--neon-magenta)]" />
                        Endereço de entrega
                      </h3>
                      <div className="mt-2 space-y-0.5 text-sm text-foreground/90">
                        <p className="font-semibold">{order.customer.name}</p>
                        <p className="text-muted-foreground">
                          {order.address.street}, {order.address.number}
                          {order.address.complement
                            ? ` — ${order.address.complement}`
                            : ""}
                        </p>
                        <p className="text-muted-foreground">
                          {order.address.district}
                        </p>
                        <p className="text-muted-foreground">
                          {order.address.city} · {order.address.state}
                        </p>
                        <p className="text-muted-foreground">
                          CEP {order.address.cep}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {pay.icon}
                        Pagamento
                      </h3>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="font-semibold text-foreground/90">
                          {pay.label}
                          {order.payment.method === "card" &&
                            order.payment.cardLast4 && (
                              <span className="ml-1 font-mono text-muted-foreground">
                                · final {order.payment.cardLast4}
                              </span>
                            )}
                        </p>
                        <p className="text-muted-foreground">
                          Status: {orderStatusLabel(order.status)}
                        </p>
                        {couponCode && discount > 0 && (
                          <p className="flex items-center gap-1 text-emerald-300">
                            <Sparkles className="h-3.5 w-3.5" />
                            Cupom {couponCode} aplicado ·{" "}
                            {formatPrice(discount)} de desconto
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

// ---------- Orders tab ----------

function OrdersTab({ orders, isLoading }: { orders: Order[] | undefined; isLoading: boolean }) {
  const navigate = useUIStore((s) => s.navigate);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-3xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass mx-auto flex max-w-xl flex-col items-center gap-5 rounded-3xl p-10 text-center sm:p-14"
      >
        <div className="relative flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[var(--neon-cyan)]/15 blur-3xl" />
          <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-dashed border-[var(--neon-cyan)]/30" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <Package className="h-10 w-10 text-[var(--neon-cyan)]" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Você ainda não fez nenhum pedido
          </h2>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Quando você finalizar sua primeira compra, ela aparece aqui com
            todos os detalhes para acompanhar a entrega.
          </p>
        </div>
        <Button
          onClick={() => navigate("products")}
          className="rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-6 py-3 text-sm font-bold text-black hover:opacity-90"
        >
          <Compass className="h-4 w-4" />
          Explorar drops
        </Button>
      </motion.div>
    );
  }

  // Most recent first
  const sorted = [...orders].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sorted.length} {sorted.length === 1 ? "pedido" : "pedidos"} no total
        </p>
      </div>
      {sorted.map((order, i) => (
        <OrderCard key={order.id} order={order} index={i} />
      ))}
    </div>
  );
}

// ---------- Profile tab ----------

function ProfileRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${accent}22`, color: accent }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-foreground/90">
          {value}
        </p>
      </div>
    </div>
  );
}

function ProfileTab({ user }: { user: PublicUser }) {
  const navigate = useUIStore((s) => s.navigate);
  const setUser = useAuthStore((s) => s.setUser);
  const roleLabel = user.role === "admin" ? "Comando" : "Explorador";
  const roleAccent =
    user.role === "admin" ? "var(--neon-magenta)" : "var(--neon-cyan)";

  // Editable name state
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user.name);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    setNameValue(user.name);
  }, [user.name]);

  async function saveName() {
    const trimmed = nameValue.trim();
    if (trimmed.length < 2) {
      toast.error("Nome precisa ter ao menos 2 caracteres.");
      return;
    }
    if (trimmed === user.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const updated = await api.updateProfile(trimmed);
      setUser(updated);
      toast.success("Nome atualizado com sucesso!");
      setEditingName(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível salvar.",
      );
    } finally {
      setSavingName(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Read-only profile */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="glass rounded-3xl p-6"
      >
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <User className="h-4 w-4 text-[var(--neon-cyan)]" />
          Meus dados
        </h2>
        <div className="mt-4 space-y-2.5">
          {/* Editable name row */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "color-mix(in oklab, var(--neon-cyan) 12%, transparent)" }}
            >
              <User className="h-4 w-4 text-[var(--neon-cyan)]" />
            </span>
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Nome
              </p>
              {editingName ? (
                <div className="mt-1 flex items-center gap-2">
                  <input
                    autoFocus
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveName();
                      if (e.key === "Escape") {
                        setEditingName(false);
                        setNameValue(user.name);
                      }
                    }}
                    className="h-9 flex-1 rounded-lg border border-[var(--neon-cyan)] bg-white/5 px-3 text-sm font-medium outline-none"
                    placeholder="Seu nome"
                  />
                  <button
                    onClick={saveName}
                    disabled={savingName}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--neon-cyan)] text-black transition hover:opacity-90 disabled:opacity-40"
                    aria-label="Salvar nome"
                  >
                    {savingName ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNameValue(user.name);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition hover:text-foreground"
                    aria-label="Cancelar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{user.name}</p>
                  <button
                    onClick={() => setEditingName(true)}
                    className="flex items-center gap-1 text-xs text-[var(--neon-cyan)] transition hover:underline"
                  >
                    <Pencil className="h-3 w-3" />
                    Editar
                  </button>
                </div>
              )}
            </div>
          </div>
          <ProfileRow
            icon={<Mail className="h-4 w-4" />}
            label="E-mail"
            value={user.email}
            accent="var(--neon-violet)"
          />
          <ProfileRow
            icon={<KeyRound className="h-4 w-4" />}
            label="Tipo de conta"
            value={
              <span style={{ color: roleAccent }} className="font-semibold">
                {roleLabel}
              </span>
            }
            accent={roleAccent}
          />
          <ProfileRow
            icon={<Clock className="h-4 w-4" />}
            label="Membro desde"
            value="Explorador desde 2026"
            accent="var(--neon-lime)"
          />
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-3.5">
          <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-[var(--neon-lime)]" />
          <p className="text-xs text-muted-foreground">
            Para trocar seu e-mail ou senha, fale com a Nave no canto inferior.
          </p>
        </div>
      </motion.div>

      {/* Address book (empty state) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="glass rounded-3xl p-6"
      >
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <MapPin className="h-4 w-4 text-[var(--neon-magenta)]" />
          Endereços salvos
        </h2>
        <div className="mt-4 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[var(--neon-magenta)]/15 blur-2xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <MapPin className="h-8 w-8 text-[var(--neon-magenta)]" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold">Nenhum endereço salvo ainda</p>
            <p className="mx-auto max-w-xs text-xs text-muted-foreground">
              Seus endereços de entrega ficam salvos a cada pedido. Em breve
              você poderá gerenciá-los aqui.
            </p>
          </div>
          <Button
            onClick={() => navigate("products")}
            variant="outline"
            className="rounded-full border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/10"
          >
            <Compass className="h-4 w-4" />
            Fazer um pedido
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ---------- Help footer ----------

function HelpFooter() {
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
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <ShieldCheck className="h-6 w-6 text-[var(--neon-lime)]" />
        </div>
        <div>
          <p className="text-sm font-bold">Precisa de ajuda?</p>
          <p className="text-xs text-muted-foreground">
            A Nave está pronta para tirar suas dúvidas sobre pedidos, pagamentos
            e entregas.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() =>
            toast("A Nave está no canto inferior direito, pronta para ajudar 🚀")
          }
          variant="outline"
          className="rounded-full border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/10"
        >
          <LifeBuoy className="h-4 w-4" />
          Falar com a Nave
        </Button>
        <Button
          onClick={() => navigate("track-order")}
          className="rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-4 py-2 text-xs font-bold text-black hover:opacity-90"
        >
          <Rocket className="h-4 w-4" />
          Rastrear um pedido
        </Button>
      </div>
    </motion.div>
  );
}

// ---------- Main ----------

export function AccountView() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: () => api.listOrders(),
    enabled: hydrated && !!user,
  });

  if (!hydrated) {
    return <HydrationSkeleton />;
  }

  if (!user) {
    return <NotSignedIn />;
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <button
          onClick={() => useUIStore.getState().navigate("home")}
          className="inline-flex items-center gap-1 transition hover:text-foreground"
        >
          <Home className="h-3.5 w-3.5" />
          Início
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">Minha conta</span>
      </div>

      <AccountHeader user={user} orders={orders} />

      <Tabs defaultValue="orders" className="mt-8">
        <TabsList className="glass h-auto gap-1 rounded-full border border-white/10 p-1">
          <TabsTrigger
            value="orders"
            className="rounded-full px-4 py-2 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--neon-cyan)] data-[state=active]:to-[var(--neon-violet)] data-[state=active]:text-black data-[state=active]:shadow-none"
          >
            <Package className="h-4 w-4" />
            Meus pedidos
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="rounded-full px-4 py-2 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--neon-cyan)] data-[state=active]:to-[var(--neon-violet)] data-[state=active]:text-black data-[state=active]:shadow-none"
          >
            <User className="h-4 w-4" />
            Meus dados
          </TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-6">
          <OrdersTab orders={orders} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="profile" className="mt-6">
          <ProfileTab user={user} />
        </TabsContent>
      </Tabs>

      <HelpFooter />
    </section>
  );
}

export default AccountView;

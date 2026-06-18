"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Star,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Plus,
  Bell,
  BellOff,
  RefreshCw,
  Truck,
  Ticket,
  Download,
  FileJson,
  Gift,
  TrendingUp,
  Copy,
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
  maskCEP,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Order, PublicUser, Address, Notification, NotificationType, Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

function OrderCard({
  order,
  index,
  imageMap = {},
}: {
  order: Order;
  index: number;
  imageMap?: Record<string, string>;
}) {
  const navigate = useUIStore((s) => s.navigate);
  const openNave = useUIStore((s) => s.openNave);
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
                {/* Panel header — order code + status + date */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 bg-white/[0.02] px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                      <Hash className="h-4 w-4 text-[var(--neon-cyan)]" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-black tracking-wider text-[var(--neon-cyan)] sm:text-base">
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
                      "h-7 gap-1.5 rounded-full px-3 text-xs font-semibold",
                      orderStatusColor(order.status),
                    )}
                  >
                    {orderStatusLabel(order.status)}
                  </Badge>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                  {/* Items list */}
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Package className="h-4 w-4 text-[var(--neon-cyan)]" />
                      Itens do pedido
                    </h3>
                    <ul className="space-y-2.5">
                      {items.map((item, i) => {
                        const img = imageMap[item.productId];
                        return (
                          <li
                            key={`${item.productId}-${item.size}-${i}`}
                            className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3"
                          >
                            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
                              {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={img}
                                  alt={item.name}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-muted-foreground" />
                              )}
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
                        );
                      })}
                    </ul>

                    {/* Totals breakdown */}
                    <div className="mt-2 space-y-1.5 rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-medium text-foreground">
                          {formatPrice(order.subtotal)}
                        </span>
                      </div>
                      {discount > 0 && (
                        <div className="flex items-center justify-between text-emerald-300">
                          <span className="flex items-center gap-1.5">
                            <Ticket className="h-3.5 w-3.5" />
                            Desconto
                            {couponCode && (
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                                {couponCode}
                              </span>
                            )}
                          </span>
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

                    {/* Coupon badge */}
                    {couponCode && discount > 0 && (
                      <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-2">
                        <Sparkles className="h-4 w-4 shrink-0 text-emerald-300" />
                        <p className="text-xs text-emerald-200">
                          Cupom{" "}
                          <span className="font-mono font-bold uppercase tracking-wider">
                            {couponCode}
                          </span>{" "}
                          aplicado · você economizou{" "}
                          <span className="font-bold">
                            {formatPrice(discount)}
                          </span>
                          .
                        </p>
                      </div>
                    )}
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
                          CEP {maskCEP(order.address.cep)}
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

                {/* Panel footer actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/5 bg-white/[0.02] px-5 py-4 sm:px-6">
                  <Button
                    onClick={() =>
                      navigate("track-order", { code: order.code })
                    }
                    className="rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-4 py-2 text-xs font-bold text-black hover:opacity-90"
                  >
                    <Truck className="h-4 w-4" />
                    Rastrear pedido
                  </Button>
                  <Button
                    onClick={() => openNave()}
                    variant="outline"
                    className="rounded-full border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/10"
                  >
                    <Rocket className="h-4 w-4" />
                    Ver na Nave
                  </Button>
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
  const [exporting, setExporting] = useState<"csv" | "json" | null>(null);

  // Collect every unique product id across all orders so we can fetch
  // their images in a single network round-trip.
  const productIds = orders
    ? Array.from(
        new Set(orders.flatMap((o) => o.items.map((i) => i.productId))),
      )
    : [];
  const joinedIds = productIds.join(",");

  const { data: productsForImages } = useQuery({
    queryKey: ["order-product-images", joinedIds],
    queryFn: () => api.products({ ids: joinedIds }),
    enabled: productIds.length > 0,
  });

  const imageMap: Record<string, string> = {};
  if (productsForImages) {
    for (const p of productsForImages) {
      if (p.images?.[0]) imageMap[p.id] = p.images[0];
    }
  }

  async function handleExport(format: "csv" | "json") {
    try {
      setExporting(format);
      const blob = await api.exportOrders(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pedidos-astrofeet-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Pedidos exportados em ${format.toUpperCase()}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao exportar.");
    } finally {
      setExporting(null);
    }
  }

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {sorted.length} {sorted.length === 1 ? "pedido" : "pedidos"} no total
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleExport("csv")}
            disabled={exporting !== null}
            aria-label="Exportar pedidos em CSV"
            className="glass-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting === "csv" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--neon-cyan)]" />
            ) : (
              <Download className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
            )}
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
          <button
            type="button"
            onClick={() => handleExport("json")}
            disabled={exporting !== null}
            aria-label="Exportar pedidos em JSON"
            className="glass-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting === "json" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--neon-violet)]" />
            ) : (
              <FileJson className="h-3.5 w-3.5 text-[var(--neon-violet)]" />
            )}
            <span className="hidden sm:inline">Exportar JSON</span>
          </button>
        </div>
      </div>
      {sorted.map((order, i) => (
        <OrderCard
          key={order.id}
          order={order}
          index={i}
          imageMap={imageMap}
        />
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

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  function resetPasswordFields() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleChangePassword() {
    if (!currentPassword) {
      toast.error("Informe sua senha atual.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A nova senha precisa ter ao menos 6 caracteres.");
      return;
    }
    if (newPassword === currentPassword) {
      toast.error("A nova senha precisa ser diferente da atual.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setSavingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      toast.success("Senha atualizada com sucesso.");
      resetPasswordFields();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar a senha agora.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-5">
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
            Para trocar seu e-mail, fale com a Nave no canto inferior.
          </p>
        </div>
      </motion.div>

      <Separator className="bg-white/10" />

      {/* Segurança / trocar senha */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="glass rounded-3xl p-6"
      >
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <Lock className="h-4 w-4 text-[var(--neon-lime)]" />
          Segurança
        </h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Mantenha sua conta protegida com uma senha forte.
        </p>
        <div className="mt-4 max-w-md space-y-3">
          <PasswordInputRow
            id="pw-current"
            label="Senha atual"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
          />
          <PasswordInputRow
            id="pw-new"
            label="Nova senha"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
            hint="Ao menos 6 caracteres."
          />
          <PasswordInputRow
            id="pw-confirm"
            label="Confirmar nova senha"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
          />
          <div className="flex justify-end pt-1">
            <Button
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-5 py-2.5 text-sm font-bold text-black hover:opacity-90 disabled:opacity-70"
            >
              {savingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Salvar senha
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ---------- Password input helper ----------

function PasswordInputRow({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  hint?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block text-sm">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 rounded-xl border-white/10 bg-white/5 pr-11 text-sm outline-none transition-colors focus:border-[var(--neon-cyan)] focus-visible:ring-0 focus-visible:ring-offset-0"
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
          aria-label={show ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
        >
          {show ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      {hint && (
        <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

// ---------- Addresses tab ----------

interface AddressFormState {
  label: string;
  recipient: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  isDefault: boolean;
}

const emptyAddressForm: AddressFormState = {
  label: "",
  recipient: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  isDefault: false,
};

function formFromAddress(addr: Address): AddressFormState {
  return {
    label: addr.label ?? "",
    recipient: addr.recipient ?? "",
    cep: addr.cep ?? "",
    street: addr.street ?? "",
    number: addr.number ?? "",
    complement: addr.complement ?? "",
    district: addr.district ?? "",
    city: addr.city ?? "",
    state: addr.state ?? "",
    isDefault: !!addr.isDefault,
  };
}

const addrInputClass =
  "h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-[var(--neon-cyan)] focus-visible:ring-0 focus-visible:ring-offset-0";

function AddressFormModal({
  open,
  onOpenChange,
  address,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: Address | null;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AddressFormState>(emptyAddressForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(address ? formFromAddress(address) : emptyAddressForm);
    }
  }, [open, address]);

  function update<K extends keyof AddressFormState>(
    key: K,
    value: AddressFormState[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): string | null {
    if (!form.label.trim()) return "Informe um apelido para o endereço.";
    if (!form.recipient.trim()) return "Informe quem recebe no endereço.";
    if (form.cep.replace(/\D/g, "").length !== 8)
      return "CEP inválido (8 dígitos).";
    if (!form.street.trim()) return "Informe a rua.";
    if (!form.number.trim()) return "Informe o número.";
    if (!form.city.trim()) return "Informe a cidade.";
    if (form.state.trim().length !== 2) return "UF precisa ter 2 letras.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      const body = {
        label: form.label.trim(),
        recipient: form.recipient.trim(),
        cep: form.cep.replace(/\D/g, ""),
        street: form.street.trim(),
        number: form.number.trim(),
        complement: form.complement.trim() || undefined,
        district: form.district.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
        isDefault: form.isDefault,
      };
      if (address) {
        await api.updateAddress(address.id, body);
        toast.success("Endereço atualizado com sucesso!");
      } else {
        await api.createAddress(body);
        toast.success("Endereço salvo com sucesso!");
      }
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o endereço agora.",
      );
    } finally {
      setSaving(false);
    }
  }

  const isEdit = !!address;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl border-white/10 bg-[var(--card)] p-0">
        <div className="max-h-[88vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <MapPin className="h-5 w-5 text-[var(--neon-magenta)]" />
              {isEdit ? "Editar endereço" : "Novo endereço"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isEdit
                ? "Atualize os dados do endereço salvo."
                : "Preencha os dados do endereço de entrega."}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="mt-4 grid gap-4 sm:grid-cols-6"
          >
            <div className="sm:col-span-3">
              <Label htmlFor="addr-label" className="mb-1.5 block text-sm">
                Apelido
              </Label>
              <Input
                id="addr-label"
                value={form.label}
                onChange={(e) => update("label", e.target.value)}
                placeholder="Casa, Trabalho..."
                className={addrInputClass}
                maxLength={40}
              />
            </div>
            <div className="sm:col-span-3">
              <Label
                htmlFor="addr-recipient"
                className="mb-1.5 block text-sm"
              >
                Quem recebe
              </Label>
              <Input
                id="addr-recipient"
                value={form.recipient}
                onChange={(e) => update("recipient", e.target.value)}
                placeholder="Nome de quem recebe"
                className={addrInputClass}
                maxLength={80}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="addr-cep" className="mb-1.5 block text-sm">
                CEP
              </Label>
              <Input
                id="addr-cep"
                value={form.cep}
                onChange={(e) => update("cep", maskCEP(e.target.value))}
                placeholder="00000-000"
                className={addrInputClass}
                inputMode="numeric"
              />
            </div>
            <div className="sm:col-span-4">
              <Label htmlFor="addr-street" className="mb-1.5 block text-sm">
                Rua
              </Label>
              <Input
                id="addr-street"
                value={form.street}
                onChange={(e) => update("street", e.target.value)}
                placeholder="Av. Via Láctea"
                className={addrInputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="addr-number" className="mb-1.5 block text-sm">
                Número
              </Label>
              <Input
                id="addr-number"
                value={form.number}
                onChange={(e) => update("number", e.target.value)}
                placeholder="42"
                className={addrInputClass}
                inputMode="numeric"
              />
            </div>
            <div className="sm:col-span-4">
              <Label
                htmlFor="addr-complement"
                className="mb-1.5 block text-sm"
              >
                Complemento{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="addr-complement"
                value={form.complement}
                onChange={(e) => update("complement", e.target.value)}
                placeholder="Apto, bloco..."
                className={addrInputClass}
              />
            </div>
            <div className="sm:col-span-3">
              <Label htmlFor="addr-district" className="mb-1.5 block text-sm">
                Bairro{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="addr-district"
                value={form.district}
                onChange={(e) => update("district", e.target.value)}
                placeholder="Galáxia"
                className={addrInputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="addr-city" className="mb-1.5 block text-sm">
                Cidade
              </Label>
              <Input
                id="addr-city"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="São Paulo"
                className={addrInputClass}
              />
            </div>
            <div className="sm:col-span-1">
              <Label htmlFor="addr-state" className="mb-1.5 block text-sm">
                UF
              </Label>
              <Input
                id="addr-state"
                value={form.state}
                onChange={(e) =>
                  update(
                    "state",
                    e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase(),
                  )
                }
                placeholder="SP"
                maxLength={2}
                className={addrInputClass}
              />
            </div>
            <div className="sm:col-span-6 flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
              <div>
                <p className="text-sm font-semibold">Salvar como padrão</p>
                <p className="text-[11px] text-muted-foreground">
                  Endereços padrão aparecem primeiro na hora de finalizar a
                  compra.
                </p>
              </div>
              <Switch
                checked={form.isDefault}
                onCheckedChange={(v) => update("isDefault", v)}
              />
            </div>

            <DialogFooter className="sm:col-span-6 mt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-full border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-5 py-2.5 text-sm font-bold text-black hover:opacity-90 disabled:opacity-70"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isEdit ? "Salvar alterações" : "Salvar endereço"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddressCard({
  address,
  index,
  onEdit,
  onSetDefault,
  onAskDelete,
}: {
  address: Address;
  index: number;
  onEdit: () => void;
  onSetDefault: () => void;
  onAskDelete: () => void;
}) {
  const parts: string[] = [`${address.street}, ${address.number}`];
  if (address.complement) parts.push(address.complement);
  if (address.district) parts.push(address.district);
  parts.push(`${address.city} · ${address.state}`);
  parts.push(`CEP ${address.cep}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.4) }}
      className="glass relative overflow-hidden rounded-3xl p-5"
    >
      <div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-30 blur-2xl"
        style={{ background: "var(--neon-magenta)" }}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--neon-magenta)]/15 text-[var(--neon-magenta)]">
            <MapPin className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-base font-bold leading-tight">
              {address.label}
            </h3>
            <p className="text-xs text-muted-foreground">
              {address.recipient}
            </p>
          </div>
        </div>
        {address.isDefault && (
          <Badge
            variant="outline"
            className="rounded-full border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300"
          >
            <Star className="mr-1 h-3 w-3" />
            Padrão
          </Badge>
        )}
      </div>

      <div className="relative mt-3 space-y-0.5 text-sm text-foreground/85">
        {parts.map((p, i) => (
          <p
            key={i}
            className={
              i === parts.length - 1
                ? "font-mono text-xs text-muted-foreground"
                : ""
            }
          >
            {p}
          </p>
        ))}
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <Button
          onClick={onEdit}
          variant="outline"
          className="rounded-full border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-white/10"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
        {!address.isDefault && (
          <Button
            onClick={onSetDefault}
            variant="outline"
            className="rounded-full border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-white/10"
          >
            <Star className="h-3.5 w-3.5 text-[var(--neon-lime)]" />
            Tornar padrão
          </Button>
        )}
        <Button
          onClick={onAskDelete}
          variant="ghost"
          className="ml-auto rounded-full px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Excluir
        </Button>
      </div>
    </motion.div>
  );
}

function AddressesTab() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const queryClient = useQueryClient();
  const { data: addresses, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => api.listAddresses(),
    enabled: hydrated && !!user,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(addr: Address) {
    setEditing(addr);
    setModalOpen(true);
  }

  async function handleSetDefault(addr: Address) {
    try {
      await api.updateAddress(addr.id, { isDefault: true });
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success(`"${addr.label}" é agora seu endereço padrão.`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível atualizar.",
      );
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteAddress(id);
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Endereço removido.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível remover.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-3xl bg-white/5" />
        ))}
      </div>
    );
  }

  const list = addresses ?? [];

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="glass flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
      >
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
            <MapPin className="h-5 w-5 text-[var(--neon-magenta)]" />
            Meus endereços
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Mantenha seus endereços de entrega salvos para finalizar mais
            rápido.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-5 py-2.5 text-sm font-bold text-black hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Novo endereço
        </Button>
      </motion.div>

      {list.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass mx-auto flex max-w-xl flex-col items-center gap-5 rounded-3xl p-10 text-center sm:p-14"
        >
          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[var(--neon-magenta)]/15 blur-3xl" />
            <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-dashed border-[var(--neon-magenta)]/30" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <MapPin className="h-8 w-8 text-[var(--neon-magenta)]" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold sm:text-2xl">
              Você ainda não tem endereços salvos
            </h3>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Salve seus endereços de entrega favoritos para finalizar suas
              compras em poucos cliques.
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-6 py-3 text-sm font-bold text-black hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Adicionar endereço
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((addr, i) => (
            <AddressCard
              key={addr.id}
              address={addr}
              index={i}
              onEdit={() => openEdit(addr)}
              onSetDefault={() => handleSetDefault(addr)}
              onAskDelete={() => setDeletingId(addr.id)}
            />
          ))}
        </div>
      )}

      <AddressFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        address={editing}
      />

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
      >
        <AlertDialogContent className="rounded-3xl border-white/10 bg-[var(--card)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-400" />
              Remover endereço?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Esta ação não pode ser desfeita. O endereço será removido da sua
              lista, mas seus pedidos anteriores continuam salvos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-full border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-600"
            >
              <Trash2 className="h-4 w-4" />
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

// ---------- Notifications tab ----------

const NOTIFICATION_ICON: Record<NotificationType, { icon: typeof Package; color: string }> = {
  order_created: { icon: Package, color: "var(--neon-cyan)" },
  order_status: { icon: Truck, color: "var(--neon-lime)" },
  coupon_applied: { icon: Ticket, color: "var(--neon-magenta)" },
  welcome: { icon: Sparkles, color: "var(--neon-violet)" },
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  sent: {
    label: "Enviado",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  queued: {
    label: "Na fila",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  failed: {
    label: "Falhou",
    className: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  },
};

function NotificationsTab() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-notifications"],
    queryFn: () => api.listNotifications(30),
    enabled: hydrated && !!user,
  });

  const notifications = data ?? [];
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Minhas notificações</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe os e-mails que enviamos para você.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["my-notifications"] })}
          className="gap-2 rounded-full border-white/10 hover:bg-white/5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="glass-strong rounded-2xl border border-white/10 p-4"
            >
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && notifications.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl border border-dashed border-white/10 p-8 text-center"
        >
          <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-semibold">Você ainda não recebeu nenhuma notificação.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Quando você fizer um pedido ou usar um cupom, os e-mails aparecerão aqui.
          </p>
        </motion.div>
      )}

      {/* List */}
      {!isLoading && notifications.length > 0 && (
        <div className="max-h-[28rem] overflow-y-auto pr-1 custom-scrollbar">
          <ul className="space-y-3">
            {notifications.map((n, index) => {
              const cfg = NOTIFICATION_ICON[n.type] ?? NOTIFICATION_ICON.welcome;
              const Icon = cfg.icon;
              const badge = STATUS_BADGE[n.status] ?? STATUS_BADGE.queued;
              const isOpen = expanded.has(n.id);

              return (
                <motion.li
                  key={n.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                >
                  <Collapsible
                    open={isOpen}
                    onOpenChange={() => toggleExpand(n.id)}
                    className="glass-strong cursor-pointer rounded-2xl border border-white/10 transition-colors hover:border-white/20"
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-start gap-3 p-4">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                          style={{ background: `${cfg.color}18` }}
                        >
                          <Icon
                            className="h-5 w-5"
                            style={{ color: cfg.color }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-tight">
                            {n.subject}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(n.sentAt)}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] px-1.5 py-0", badge.className)}
                            >
                              {badge.label}
                            </Badge>
                          </div>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                            isOpen && "rotate-180",
                          )}
                        />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t border-white/5 px-4 pb-4 pt-3">
                        <pre className="whitespace-pre-wrap break-words rounded-xl bg-black/20 p-3 font-mono text-sm leading-relaxed text-muted-foreground">
                          {n.body}
                        </pre>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </motion.li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Footer counter */}
      {!isLoading && notifications.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Mostrando {notifications.length} notificações
        </p>
      )}
    </div>
  );
}

// ---------- Stock alerts tab ----------

function StockAlertsTab() {
  const navigate = useUIStore((s) => s.navigate);
  const queryClient = useQueryClient();

  // Subscribed product IDs for the signed-in user.
  const { data: subscribedIds, isLoading: alertsLoading } = useQuery({
    queryKey: ["stock-alerts"],
    queryFn: () => api.listStockAlerts(),
  });

  const ids = subscribedIds ?? [];
  const joinedIds = ids.join(",");

  // Fetch the full product data for every subscribed ID at once.
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["alert-products", joinedIds],
    queryFn: () => api.products({ ids: joinedIds }),
    enabled: ids.length > 0,
  });

  const [removingId, setRemovingId] = useState<string | null>(null);
  const isLoading = alertsLoading || (ids.length > 0 && productsLoading);

  async function handleRemove(productId: string) {
    setRemovingId(productId);
    try {
      await api.unsubscribeStockAlert(productId);
      await queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      toast.success("Alerta removido.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível remover o alerta.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold sm:text-2xl">Meus alertas de estoque</h2>
        <p className="text-sm text-muted-foreground">
          Produtos que você quer ser avisado quando voltarem ao estoque.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="glass-strong rounded-2xl border border-white/10 p-4"
            >
              <div className="flex items-start gap-3">
                <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && ids.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl border border-dashed border-white/10 p-8 text-center"
        >
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
            <Bell className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold">Você não tem alertas ativos.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Quando um produto esgotado que você marcou voltar ao estoque, ele
            aparece aqui.
          </p>
          <Button
            type="button"
            onClick={() => navigate("products")}
            className="mt-5 gap-2 rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-5 font-bold text-black hover:opacity-90"
          >
            Explorar drops
          </Button>
        </motion.div>
      )}

      {/* Grid */}
      {!isLoading && ids.length > 0 && products && products.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((p: Product, index: number) => {
            const inStock = p.stock > 0;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                className="glass-strong flex items-start gap-3 rounded-2xl border border-white/10 p-4"
              >
                <button
                  type="button"
                  onClick={() => navigate("product", { id: p.slug })}
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-1 transition hover:border-white/30"
                  aria-label={`Ver ${p.name}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="h-full w-full object-contain"
                  />
                </button>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {p.brand}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("product", { id: p.slug })}
                      className="line-clamp-1 text-left text-sm font-semibold leading-tight transition hover:text-[var(--neon-cyan)]"
                    >
                      {p.name}
                    </button>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      "px-1.5 py-0 text-[10px] font-semibold",
                      inStock
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-400 border-rose-500/30",
                    )}
                  >
                    {inStock ? "Em estoque" : "Esgotado"}
                  </Badge>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {inStock && (
                      <Button
                        size="sm"
                        onClick={() => navigate("product", { id: p.slug })}
                        className="h-8 gap-1.5 rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-3 text-xs font-bold text-black hover:opacity-90"
                      >
                        Ver produto
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemove(p.id)}
                      disabled={removingId === p.id}
                      className="h-8 gap-1.5 rounded-full border-white/10 px-3 text-xs font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    >
                      {removingId === p.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <BellOff className="h-3.5 w-3.5" />
                      )}
                      Remover alerta
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Footer counter */}
      {!isLoading && ids.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {ids.length} {ids.length === 1 ? "alerta ativo" : "alertas ativos"}
        </p>
      )}
    </div>
  );
}

// ---------- Loyalty / Rewards tab ----------

const REDEEM_TIERS = [
  { cost: 100, value: 5, accent: "var(--neon-cyan)" },
  { cost: 250, value: 12.5, accent: "var(--neon-violet)" },
  { cost: 500, value: 25, accent: "var(--neon-magenta)" },
] as const;

function LoyaltyTab() {
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
  const nextTier =
    REDEEM_TIERS.find((t) => t.cost > points)?.cost ?? REDEEM_TIERS[REDEEM_TIERS.length - 1]!.cost;
  const prevTier =
    [...REDEEM_TIERS].reverse().find((t) => t.cost <= points)?.cost ?? 0;
  const span = Math.max(1, nextTier - prevTier);
  const progressPct = Math.min(
    100,
    Math.max(0, ((points - prevTier) / span) * 100),
  );

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
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível resgatar pontos agora.",
      );
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
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full opacity-40 blur-3xl"
          style={{ background: "var(--neon-violet)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--neon-cyan)" }}
        />

        {/* Floating sparkles icon */}
        <Sparkles className="animate-astro-float pointer-events-none absolute right-5 top-5 h-8 w-8 text-[var(--neon-cyan)]/70" />

        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Star className="h-3.5 w-3.5 text-[var(--neon-violet)]" />
            Programa de recompensas estelares
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
                <span className="text-gradient-animated text-5xl font-black leading-none sm:text-6xl">
                  {points.toLocaleString("pt-BR")}
                </span>
                <span className="mb-1 text-sm font-semibold text-muted-foreground">
                  pontos estelares
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-[var(--neon-lime)]">
                Vale {formatPrice(pointsValue)} em descontos
              </p>

              {/* Progress bar */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Progresso até{" "}
                    <span className="font-bold text-foreground">
                      {nextTier.toLocaleString("pt-BR")} pts
                    </span>
                  </span>
                  <span>{Math.round(progressPct)}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-violet)] to-[var(--neon-magenta)]"
                  />
                </div>
                {points < minRedeemPoints ? (
                  <p className="text-[11px] text-muted-foreground">
                    Mínimo de {minRedeemPoints} pts para o primeiro resgate.
                  </p>
                ) : (
                  <p className="text-[11px] text-[var(--neon-lime)]">
                    Você já pode resgatar recompensas! ✦
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Info banner */}
      <div className="glass flex items-start gap-3 rounded-2xl border border-amber-500/20 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
          <Sparkles className="h-4 w-4" />
        </div>
        <p className="text-sm text-foreground/85">
          Ganhe <span className="font-bold text-amber-300">1 ponto</span> para
          cada <span className="font-bold text-amber-300">R$1</span> gasto. Use
          os pontos para resgatar cupons de desconto exclusivos.
        </p>
      </div>

      {/* Redemption section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--neon-violet)]/15 text-[var(--neon-violet)]">
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
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="glass relative flex flex-col gap-3 overflow-hidden rounded-2xl p-5"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-25 blur-2xl"
                  style={{ background: tier.accent }}
                />
                <div className="relative">
                  <p
                    className="text-3xl font-black tracking-tight"
                    style={{ color: tier.accent }}
                  >
                    {tier.cost}
                    <span className="ml-1 text-sm font-semibold text-muted-foreground">
                      pts
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cupom de desconto
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {formatPrice(tier.value)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRedeem(tier.cost)}
                  disabled={!canRedeem || isRedeeming}
                  aria-disabled={!canRedeem}
                  title={
                    canRedeem
                      ? `Resgatar por ${tier.cost} pontos`
                      : "Pontos insuficientes"
                  }
                  className={cn(
                    "relative mt-auto flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all",
                    canRedeem
                      ? "bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] text-black hover:opacity-90"
                      : "cursor-not-allowed border border-white/10 bg-white/[0.03] text-muted-foreground",
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
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--neon-cyan)]/15 text-[var(--neon-cyan)]">
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
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
                <Sparkles className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">
                Você ainda não ganhou pontos.
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Faça um pedido para começar a acumular recompensas estelares!
              </p>
              <Button
                type="button"
                onClick={() => navigate("products")}
                className="mt-1 gap-2 rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-5 font-bold text-black hover:opacity-90"
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
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 transition hover:border-white/15"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--neon-lime)]/15 text-[var(--neon-lime)]">
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
                  <span className="shrink-0 rounded-full bg-[var(--neon-lime)]/15 px-2.5 py-1 text-xs font-bold text-[var(--neon-lime)]">
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
          <TabsTrigger
            value="enderecos"
            className="rounded-full px-4 py-2 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--neon-cyan)] data-[state=active]:to-[var(--neon-violet)] data-[state=active]:text-black data-[state=active]:shadow-none"
          >
            <MapPin className="h-4 w-4" />
            Endereços
          </TabsTrigger>
          <TabsTrigger
            value="notificacoes"
            className="rounded-full px-4 py-2 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--neon-cyan)] data-[state=active]:to-[var(--neon-violet)] data-[state=active]:text-black data-[state=active]:shadow-none"
          >
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger
            value="alertas"
            className="rounded-full px-4 py-2 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--neon-cyan)] data-[state=active]:to-[var(--neon-violet)] data-[state=active]:text-black data-[state=active]:shadow-none"
          >
            <BellOff className="h-4 w-4" />
            Alertas
          </TabsTrigger>
          <TabsTrigger
            value="recompensas"
            className="rounded-full px-4 py-2 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--neon-cyan)] data-[state=active]:to-[var(--neon-violet)] data-[state=active]:text-black data-[state=active]:shadow-none"
          >
            <Star className="h-4 w-4" />
            Recompensas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-6">
          <OrdersTab orders={orders} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="profile" className="mt-6">
          <ProfileTab user={user} />
        </TabsContent>
        <TabsContent value="enderecos" className="mt-6">
          <AddressesTab />
        </TabsContent>
        <TabsContent value="notificacoes" className="mt-6">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="alertas" className="mt-6">
          <StockAlertsTab />
        </TabsContent>
        <TabsContent value="recompensas" className="mt-6">
          <LoyaltyTab />
        </TabsContent>
      </Tabs>

      <HelpFooter />
    </section>
  );
}

export default AccountView;

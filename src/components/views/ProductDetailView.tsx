"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Truck,
  RefreshCw,
  ShieldCheck,
  Check,
  Send,
  Heart,
  Ruler,
  Loader2,
  X,
  Pencil,
  Bell,
  BellOff,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/client";
import { formatPrice, formatShortDate } from "@/lib/format";
import type { Product, Review } from "@/lib/types";
import { useUIStore } from "@/stores/ui";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";
import { useWishlistStore } from "@/stores/wishlist";
import { useRecentStore } from "@/stores/recent";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductCard } from "./ProductCard";

const FREE_SHIPPING_THRESHOLD = 300;

const BADGE_STYLES: Record<string, string> = {
  Novo:
    "bg-[var(--neon-cyan)]/15 text-[var(--neon-cyan)] border-[var(--neon-cyan)]/40",
  "Drop limitado":
    "bg-[var(--neon-magenta)]/15 text-[var(--neon-magenta)] border-[var(--neon-magenta)]/40",
  "Mais vendido":
    "bg-[var(--neon-lime)]/15 text-[var(--neon-lime)] border-[var(--neon-lime)]/40",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Stars({
  value,
  size = 16,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={cn(
            n <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-white/20",
          )}
        />
      ))}
    </div>
  );
}

function TrustRow() {
  const items = [
    { icon: Truck, title: "Entrega 3-7 dias", sub: "Para todo o Brasil" },
    { icon: RefreshCw, title: "Troca em 30 dias", sub: "Sem complicação" },
    { icon: ShieldCheck, title: "Pagamento seguro", sub: "Pix, cartão, boleto" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((it) => (
        <div
          key={it.title}
          className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center"
        >
          <it.icon className="h-5 w-5 text-[var(--neon-cyan)]" />
          <p className="text-xs font-semibold leading-tight">{it.title}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">
            {it.sub}
          </p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stock helpers
// ---------------------------------------------------------------------------

/**
 * A product counts as "out of stock" when every size has 0 units
 * (per `sizeStock`) or, when `sizeStock` is absent, when the global
 * `stock` field is 0.
 */
function isProductOutOfStock(product: Product): boolean {
  const sizeStock = product.sizeStock;
  if (sizeStock && Object.keys(sizeStock).length > 0) {
    return Object.values(sizeStock).every((v) => v <= 0);
  }
  return product.stock <= 0;
}

/**
 * Glass banner shown in the Info panel when a product is fully sold out.
 * Offers a one-tap subscription to the back-in-stock alert.
 */
function StockAlertBanner({ product }: { product: Product }) {
  const user = useAuthStore((s) => s.user);
  const openAuth = useUIStore((s) => s.openAuth);
  const queryClient = useQueryClient();

  const { data: subscribedIds } = useQuery({
    queryKey: ["stock-alerts"],
    queryFn: () => api.listStockAlerts(),
    enabled: !!user,
  });

  const isSubscribed = (subscribedIds ?? []).includes(product.id);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);

  // Prefill email from auth user when logged in.
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      openAuth("login");
      return;
    }
    setSubmitting(true);
    try {
      await api.subscribeStockAlert(product.id);
      await queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      toast.success("Você será avisado quando este sneaker voltar ao estoque!");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível ativar o alerta agora.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnsubscribe() {
    setUnsubscribing(true);
    try {
      await api.unsubscribeStockAlert(product.id);
      await queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      toast.success("Inscrição cancelada.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível cancelar a inscrição.",
      );
    } finally {
      setUnsubscribing(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass relative overflow-hidden rounded-2xl border border-amber-500/30 p-4"
    >
      {/* Amber/violet accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--neon-violet), transparent 70%)",
        }}
      />

      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-inset ring-amber-500/30">
          <Bell className="h-5 w-5 text-amber-400" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-bold text-rose-400">Produto esgotado</p>
            <p className="text-xs text-muted-foreground">
              Avise-me quando voltar ao estoque
            </p>
          </div>

          {isSubscribed ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--neon-lime)]/40 bg-[var(--neon-lime)]/15 px-3 py-1 text-xs font-bold text-[var(--neon-lime)]">
                <Check className="h-3.5 w-3.5" />
                Inscrito
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUnsubscribe}
                disabled={unsubscribing}
                className="h-8 gap-1.5 rounded-full border-white/10 px-3 text-xs font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                {unsubscribing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <BellOff className="h-3.5 w-3.5" />
                )}
                Cancelar inscrição
              </Button>
            </div>
          ) : !user ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="text-xs text-muted-foreground">
                Faça login para ser avisado.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => openAuth("login")}
                className="h-8 gap-1.5 rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-3 text-xs font-bold text-black hover:opacity-90"
              >
                Entrar
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubscribe}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                aria-label="Seu e-mail"
                className="h-9 rounded-full border-white/10 bg-white/[0.03] text-sm"
              />
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="h-9 shrink-0 gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-[var(--neon-violet)] px-5 text-sm font-bold text-black hover:opacity-90"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                Avise-me
              </Button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Tiny inline hint shown under the size selector when the *selected* size
 * has 1-2 units left. Offers a quick subscribe link so shoppers can be
 * notified if it sells out before they checkout.
 */
function LowStockHint({
  product,
  count,
}: {
  product: Product;
  count: number;
}) {
  const user = useAuthStore((s) => s.user);
  const openAuth = useUIStore((s) => s.openAuth);
  const queryClient = useQueryClient();

  const { data: subscribedIds } = useQuery({
    queryKey: ["stock-alerts"],
    queryFn: () => api.listStockAlerts(),
    enabled: !!user,
  });

  const isSubscribed = (subscribedIds ?? []).includes(product.id);
  const [busy, setBusy] = useState(false);

  async function handleSubscribe() {
    if (!user) {
      openAuth("login");
      return;
    }
    setBusy(true);
    try {
      await api.subscribeStockAlert(product.id);
      await queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      toast.success("Você será avisado se este sneaker esgotar antes!");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível ativar o alerta agora.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (isSubscribed) {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--neon-lime)]">
        <Check className="h-3.5 w-3.5" />
        Alerta ativo para este sneaker.
      </p>
    );
  }

  return (
    <p className="inline-flex flex-wrap items-center gap-1.5 text-xs text-amber-300">
      <span>
        Estoque baixo neste tamanho — apenas {count}{" "}
        unidade{count === 1 ? "" : "s"}.
      </span>
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={busy}
        className="inline-flex items-center gap-1 font-semibold underline-offset-2 transition hover:underline disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Bell className="h-3 w-3" />
        )}
        Avise-me se esgotar antes.
      </button>
    </p>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-3xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-20 rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

function Gallery({ product }: { product: Product }) {
  const images = product.images;
  const [currentImage, setCurrentImage] = useState(0);
  const angleLabels = ["Frente", "Lateral", "Detalhe", "Verso", "Solo"];

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent"
      >
        {/* Accent radial glow behind product */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
          style={{ background: product.accent }}
        />
        {/* Subtle ring overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/5" />

        <AnimatePresence mode="wait">
          <motion.img
            key={currentImage}
            src={images[currentImage]}
            alt={`${product.name} — ${angleLabels[currentImage % angleLabels.length]}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="animate-astro-float relative h-full w-full object-contain p-8 hover:scale-105 transition-transform duration-500"
          />
        </AnimatePresence>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.badge && (
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur",
                BADGE_STYLES[product.badge] ??
                  "bg-white/10 text-white border-white/20",
              )}
            >
              {product.badge}
            </span>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-300 backdrop-blur">
              Últimas {product.stock}
            </span>
          )}
        </div>
      </motion.div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setCurrentImage(i)}
              aria-label={`Ver ângulo ${angleLabels[i % angleLabels.length]}`}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white/[0.03] p-1 transition-all duration-200",
                currentImage === i
                  ? "border-[var(--neon-cyan)] shadow-[0_0_14px_var(--neon-cyan)]"
                  : "border-white/10 hover:border-white/30",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${product.name} ângulo ${angleLabels[i % angleLabels.length]}`}
                className="h-full w-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Info panel
// ---------------------------------------------------------------------------

function Info({
  product,
  reviews,
}: {
  product: Product;
  reviews: Review[];
}) {
  const add = useCartStore((s) => s.add);
  const openCart = useCartStore((s) => s.open);
  const navigate = useUIStore((s) => s.navigate);
  const openSizeGuide = useUIStore((s) => s.openSizeGuide);
  const toggleWishlist = useWishlistStore((s) => s.toggleProduct);
  const inWishlist = useWishlistStore((s) => s.has(product.id));
  const [heartBump, setHeartBump] = useState(false);

  const [size, setSize] = useState<number | null>(null);
  const [qty, setQty] = useState(1);

  // Per-size-aware max quantity (fall back to global stock when sizeStock absent).
  const sizeStockMap = product.sizeStock ?? {};
  const selectedSizeStock =
    size !== null ? sizeStockMap[String(size)] : undefined;
  const effectiveMax =
    selectedSizeStock !== undefined ? selectedSizeStock : product.stock;
  const maxQty = Math.max(1, Math.min(effectiveMax, 99));
  const installment = product.price / 10;
  const freeShipping = product.price >= FREE_SHIPPING_THRESHOLD;
  const reviewCount = reviews.length;
  const soldOut = isProductOutOfStock(product);

  // Reset qty if it exceeds the newly-selected size's stock.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (qty > maxQty) setQty(Math.max(1, maxQty));
  }, [maxQty, qty]);

  function selectSize(s: number) {
    setSize(s);
    setQty(1);
  }

  function requireSize(): boolean {
    if (size === null) {
      toast.error("Selecione um tamanho para continuar.");
      return false;
    }
    return true;
  }

  function handleAdd() {
    if (!requireSize()) return;
    add(product, size as number, qty);
    toast.success(`${product.name} adicionado ao carrinho`);
    openCart();
  }

  function handleBuyNow() {
    if (!requireSize()) return;
    add(product, size as number, qty);
    navigate("checkout");
  }

  function handleWishlist() {
    toggleWishlist(product);
    setHeartBump(true);
    setTimeout(() => setHeartBump(false), 450);
    toast.success(
      inWishlist
        ? `${product.name} saiu da sua lista`
        : `${product.name} salvo na lista de desejos`,
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex flex-col gap-5"
    >
      {/* Brand + wishlist */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {product.brand}
        </p>
        <button
          onClick={handleWishlist}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all hover:scale-110",
            inWishlist
              ? "border-[var(--neon-magenta)]/50 bg-[var(--neon-magenta)]/20 text-[var(--neon-magenta)]"
              : "border-white/10 bg-white/5 text-foreground/70 hover:text-foreground",
          )}
          aria-label={
            inWishlist ? "Remover da lista de desejos" : "Salvar na lista de desejos"
          }
          aria-pressed={inWishlist}
        >
          <Heart
            className={cn("h-5 w-5", heartBump && "animate-heartbeat", inWishlist && "fill-current")}
          />
        </button>
      </div>

      {/* Name */}
      <h1 className="text-3xl font-black leading-tight sm:text-4xl">
        {product.name}
      </h1>

      {/* Rating */}
      <div className="flex items-center gap-2 text-sm">
        <Stars value={product.rating} size={16} />
        <span className="font-semibold">{product.rating.toFixed(1)}</span>
        <span className="text-muted-foreground">
          · {reviewCount}{" "}
          {reviewCount === 1 ? "avaliação" : "avaliações"}
        </span>
      </div>

      {/* Price */}
      <div className="space-y-1">
        <p className="text-3xl font-bold">{formatPrice(product.price)}</p>
        <p className="text-sm text-muted-foreground">
          ou 10x de{" "}
          <span className="font-semibold text-foreground">
            {formatPrice(installment)}
          </span>{" "}
          sem juros
        </p>
        <p
          className={cn(
            "text-xs font-medium",
            freeShipping ? "text-[var(--neon-lime)]" : "text-muted-foreground",
          )}
        >
          {freeShipping
            ? "🚀 Frete grátis acima de R$300 — liberado!"
            : "Frete grátis em pedidos acima de R$300"}
        </p>
      </div>

      <Separator className="bg-white/10" />

      {/* Short description */}
      <p className="text-sm leading-relaxed text-muted-foreground">
        {product.description.split("\n")[0]?.slice(0, 220) ??
          "Modelo exclusivo Astrofeet, feito para quem anda entre estrelas."}
      </p>

      {/* Size selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold">Tamanho</label>
          <button
            onClick={openSizeGuide}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--neon-cyan)] transition hover:underline"
          >
            <Ruler className="h-3.5 w-3.5" />
            Guia de medidas
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((s) => {
            const isSelected = size === s;
            // Per-size stock: prefer sizeStock map, fall back to global stock.
            const sizeStockMap = product.sizeStock ?? {};
            const perSize = sizeStockMap[String(s)];
            const effectiveStock =
              perSize !== undefined ? perSize : product.stock;
            const soldOut = effectiveStock <= 0;
            const lowStock = !soldOut && effectiveStock <= 2;
            return (
              <button
                key={s}
                onClick={() => !soldOut && selectSize(s)}
                disabled={soldOut}
                aria-pressed={isSelected}
                title={
                  soldOut
                    ? `Tamanho ${s} esgotado`
                    : lowStock
                      ? `Últimas ${effectiveStock} unidades`
                      : `Tamanho ${s}`
                }
                className={cn(
                  "relative h-12 min-w-14 rounded-xl border px-3 text-sm font-bold transition",
                  soldOut && "cursor-not-allowed opacity-40 line-through",
                  isSelected && !soldOut
                    ? "border-transparent text-black"
                    : lowStock
                      ? "border-amber-500/40 bg-amber-500/5 text-amber-200 hover:border-amber-500/60"
                      : "border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]",
                )}
                style={
                  isSelected && !soldOut
                    ? {
                        background: product.accent,
                        boxShadow: `0 0 18px ${product.accent}66`,
                      }
                    : undefined
                }
              >
                {s}
                {isSelected && !soldOut && (
                  <Check className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-black p-0.5 text-white" />
                )}
                {!isSelected && lowStock && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-500/80 px-1 text-[8px] font-bold text-black">
                    {effectiveStock} rest.
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {isProductOutOfStock(product) && <StockAlertBanner product={product} />}
        {size !== null && (() => {
          const sizeStockMap = product.sizeStock ?? {};
          const perSize = sizeStockMap[String(size)];
          const eff = perSize !== undefined ? perSize : product.stock;
          return eff <= 2 && eff > 0 ? (
            <LowStockHint product={product} count={eff} />
          ) : null;
        })()}
      </div>

      {/* Quantity + Stock */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Diminuir quantidade"
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10 disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-sm font-bold">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            disabled={qty >= maxQty}
            aria-label="Aumentar quantidade"
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {product.stock > 5 ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Em estoque
          </span>
        ) : product.stock > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Últimas {product.stock} unidades
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Esgotado
          </span>
        )}
      </div>

      {/* CTAs */}
      <div className="grid gap-2.5 sm:grid-cols-[1fr_auto]">
        <Button
          onClick={handleAdd}
          disabled={soldOut}
          size="lg"
          className="h-12 rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] text-base font-bold text-black transition hover:opacity-90 disabled:opacity-40"
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          Adicionar ao carrinho
        </Button>
        <Button
          onClick={handleBuyNow}
          disabled={soldOut}
          size="lg"
          variant="outline"
          className="h-12 rounded-full border-white/20 bg-white/[0.03] px-6 text-base font-bold text-white backdrop-blur hover:border-white/40 hover:bg-white/[0.08] disabled:opacity-40"
        >
          Comprar agora
        </Button>
      </div>

      {/* Trust row */}
      <TrustRow />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Reviews summary + form + list
// ---------------------------------------------------------------------------

function InteractiveStars({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="touch-manipulation p-0.5"
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "h-7 w-7 transition-colors",
              n <= display
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-white/20 hover:text-white/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewsSection({
  product,
  reviews,
}: {
  product: Product;
  reviews: Review[];
}) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const openAuth = useUIStore((s) => s.openAuth);

  const [showForm, setShowForm] = useState(false);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Sync author name when user logs in or form opens
  useEffect(() => {
    if (user?.name) setAuthor(user.name);
  }, [user]);

  // Distribution array for the rating-breakdown panel.
  const distribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((stars) => {
        const count = reviews.filter((r) => r.rating === stars).length;
        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
        return { stars, count, pct };
      }),
    [reviews],
  );

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : product.rating;

  function resetForm() {
    setRating(0);
    setHoverRating(0);
    setComment("");
    setAuthor(user?.name ?? "");
    setShowForm(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    // Validation
    if (rating <= 0) {
      toast.error("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }
    if (author.trim().length < 2) {
      toast.error("O nome deve ter pelo menos 2 caracteres.");
      return;
    }
    if (comment.trim().length < 10) {
      toast.error("O comentário deve ter pelo menos 10 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createReview({
        productId: product.id,
        rating,
        comment: comment.trim(),
        authorName: author.trim(),
      });
      await queryClient.invalidateQueries({
        queryKey: ["product", product.slug],
      });
      toast.success("Avaliação enviada!");
      resetForm();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível enviar sua avaliação.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const displayRating = hoverRating || rating;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black sm:text-3xl">Avaliações</h2>
          <Badge
            variant="secondary"
            className="border-white/10 bg-white/5 text-muted-foreground"
          >
            {reviews.length}{" "}
            {reviews.length === 1 ? "comentário" : "comentários"}
          </Badge>
        </div>

        {/* Write review button / login hint */}
        {user ? (
          !showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="gap-2 rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-5 font-bold text-black hover:opacity-90"
            >
              <Pencil className="h-4 w-4" />
              Escrever avaliação
            </Button>
          )
        ) : (
          <p className="text-sm text-muted-foreground">
            Faça{" "}
            <button
              onClick={() => openAuth("login")}
              className="font-semibold text-[var(--neon-cyan)] underline-offset-2 hover:underline"
            >
              login
            </button>{" "}
            para avaliar este produto.
          </p>
        )}
      </div>

      <div className="space-y-6">
        {/* Rating distribution panel — above the review list */}
        {reviews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass rounded-2xl border border-white/10 p-6 text-center sm:p-8"
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
              <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
            </div>
            <p className="font-semibold text-foreground">
              Ainda não há avaliações. Seja o primeiro a avaliar!
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass rounded-2xl border border-white/10 p-4 sm:p-6"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
              {/* Left column — average rating */}
              <div className="flex flex-col items-center justify-center text-center sm:w-44 sm:shrink-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-gradient-animated text-5xl font-black leading-none sm:text-6xl">
                    {avgRating.toFixed(1)}
                  </span>
                  <Star className="h-6 w-6 self-center fill-amber-400 text-amber-400" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {reviews.length}{" "}
                  {reviews.length === 1 ? "avaliação" : "avaliações"}
                </p>
              </div>

              {/* Right column — 5 horizontal bars */}
              <div className="flex-1 space-y-2">
                {distribution.map(({ stars, count, pct }, idx) => (
                  <div
                    key={stars}
                    className="flex items-center gap-3 text-xs"
                  >
                    <div className="flex w-8 shrink-0 items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-foreground">
                        {stars}
                      </span>
                    </div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.08 * idx }}
                      />
                    </div>
                    <span className="w-20 shrink-0 text-right text-muted-foreground">
                      ({count}) · {Math.round(pct)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* List */}
        {reviews.length > 0 && (
          <div className="space-y-4">
            <ScrollArea className="max-h-[480px] rounded-3xl">
              <ul className="space-y-3 pr-3">
                {reviews.map((r) => (
                  <motion.li
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3 }}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-black"
                          style={{ background: product.accent }}
                        >
                          {r.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-tight">
                            {r.authorName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatShortDate(r.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Stars value={r.rating} size={12} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {r.comment}
                    </p>
                  </motion.li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Review form — only when logged in and showForm is true */}
      <AnimatePresence>
        {showForm && user && (
          <motion.form
            key="review-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={submit}
            className="glass overflow-hidden rounded-3xl border border-white/10 p-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Escrever avaliação</h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={resetForm}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Conte o que achou deste sneaker.
            </p>

            {/* Star rating */}
            <div className="mb-5 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Nota
              </label>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="touch-manipulation p-0.5"
                    aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={cn(
                        "h-8 w-8 transition-colors",
                        n <= displayRating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-transparent text-white/20 hover:text-white/40",
                      )}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="text-sm font-medium text-muted-foreground">
                    {rating}/5
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Seu nome
                </label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Como te chamamos?"
                  className="rounded-xl border-white/10 bg-white/[0.03]"
                />
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Comentário
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Conte o que achou deste sneaker..."
                className="resize-none rounded-xl border-white/10 bg-white/[0.03]"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={resetForm}
                className="rounded-full text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="gap-2 rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-6 font-bold text-black hover:opacity-90"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submitting ? "Enviando…" : "Enviar avaliação"}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Related products
// ---------------------------------------------------------------------------

function RelatedSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="min-w-[200px] flex-1 space-y-3">
          <Skeleton className="aspect-square w-full rounded-3xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function Related({ productId }: { productId: string }) {
  const { data: products, isLoading } = useQuery({
    queryKey: ["related", productId],
    queryFn: () => api.relatedProducts(productId),
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="space-y-5"
      >
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6 text-[var(--neon-magenta)]" />
          <h2 className="text-2xl font-black sm:text-3xl">
            Você também pode gostar
          </h2>
        </div>
        <RelatedSkeleton />
      </motion.section>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3">
        <Heart className="h-6 w-6 text-[var(--neon-magenta)]" />
        <h2 className="text-2xl font-black sm:text-3xl">
          Você também pode gostar
        </h2>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
        {products.slice(0, 4).map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="min-w-[220px] flex-1 sm:min-w-[240px]"
          >
            <ProductCard product={p} index={i} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export function ProductDetailView() {
  const params = useUIStore((s) => s.params);
  const navigate = useUIStore((s) => s.navigate);
  const addRecent = useRecentStore((s) => s.add);
  const slug = params.id;

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.product(slug as string),
    enabled: !!slug,
  });

  const product = data?.product;
  const reviews = data?.reviews ?? [];

  // Track recently viewed (client-only, after product loads)
  useEffect(() => {
    if (product) addRecent(product);
  }, [product, addRecent]);

  // ---------- Loading ----------
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <Skeleton className="mb-6 h-5 w-56" />
        <DetailSkeleton />
      </div>
    );
  }

  // ---------- Error / not found ----------
  if (isError || !product) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 pb-20 pt-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
          <Star className="h-9 w-9 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-black">Produto não encontrado</h1>
        <p className="text-sm text-muted-foreground">
          O drop que você procura pode ter sido removido ou nunca existiu nesta
          galáxia.
        </p>
        <Button
          onClick={() => navigate("products")}
          className="mt-2 rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-6 font-bold text-black hover:opacity-90"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar aos drops
        </Button>
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <button
          onClick={() => navigate("products")}
          className="transition hover:text-foreground"
        >
          Drops
        </button>
        <ChevronRight className="h-3 w-3" />
        <button
          onClick={() => navigate("products", { category: product.category })}
          className="transition hover:text-foreground"
        >
          {product.category}
        </button>
        <ChevronRight className="h-3 w-3" />
        <span className="line-clamp-1 font-medium text-foreground">
          {product.name}
        </span>
      </nav>

      {/* Gallery + Info */}
      <div className="grid gap-10 lg:grid-cols-2">
        <Gallery product={product} />
        <Info product={product} reviews={reviews} />
      </div>

      {/* Details / specs */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="mt-16 grid gap-8 lg:grid-cols-[1fr_320px]"
      >
        <div className="space-y-3">
          <h2 className="text-2xl font-black sm:text-3xl">Detalhes do produto</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        </div>

        <aside className="glass h-fit rounded-3xl border border-white/10 p-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Especificações
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Categoria</dt>
              <dd className="font-medium">{product.category}</dd>
            </div>
            <Separator className="bg-white/10" />
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Marca</dt>
              <dd className="font-medium">{product.brand}</dd>
            </div>
            <Separator className="bg-white/10" />
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Tamanhos</dt>
              <dd className="font-medium">{product.sizes.join(" · ")}</dd>
            </div>
            <Separator className="bg-white/10" />
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Disponibilidade</dt>
              <dd className="font-medium">
                {product.stock > 0
                  ? `${product.stock} em estoque`
                  : "Esgotado"}
              </dd>
            </div>
          </dl>
        </aside>
      </motion.section>

      <Separator className="my-16 bg-white/10" />

      {/* Reviews */}
      <ReviewsSection product={product} reviews={reviews} />

      {/* Orbit divider */}
      <div className="orbit-divider my-16" />

      {/* Related */}
      <Related productId={product.id} />
    </div>
  );
}

export default ProductDetailView;

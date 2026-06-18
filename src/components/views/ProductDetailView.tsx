"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/client";
import { formatPrice, formatShortDate } from "@/lib/format";
import type { Product, Review } from "@/lib/types";
import { useUIStore } from "@/stores/ui";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";
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
  // Build a thumbnail list. If only one image, synthesize 3 angle chips using
  // the same image (visually complete).
  const thumbs = useMemo(() => {
    if (product.images.length > 1) return product.images;
    return [product.images[0], product.images[0], product.images[0]];
  }, [product.images]);

  const [active, setActive] = useState(0);
  const angleLabels = ["Frente", "Lateral", "Detalhe"];

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

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbs[active]}
          alt={product.name}
          className="animate-astro-float relative h-full w-full object-contain p-8"
        />

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

      {/* Thumbnails */}
      <div className="flex gap-2">
        {thumbs.map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Ver ângulo ${angleLabels[i % 3]}`}
            className={cn(
              "relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-white/[0.03] p-1.5 transition",
              active === i
                ? "border-[var(--neon-cyan)] ring-2 ring-[var(--neon-cyan)]/40"
                : "border-white/10 hover:border-white/30",
            )}
            style={
              active === i
                ? { boxShadow: `0 0 18px ${product.accent}55` }
                : undefined
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${product.name} ângulo ${angleLabels[i % 3]}`}
              className="h-full w-full object-contain"
            />
          </button>
        ))}
      </div>
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

  const [size, setSize] = useState<number | null>(null);
  const [qty, setQty] = useState(1);

  const maxQty = Math.max(1, Math.min(product.stock, 99));
  const installment = product.price / 10;
  const freeShipping = product.price >= FREE_SHIPPING_THRESHOLD;
  const reviewCount = reviews.length;

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex flex-col gap-5"
    >
      {/* Brand */}
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {product.brand}
      </p>

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
          <span className="text-xs text-muted-foreground">
            Guia de medidas
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((s) => {
            const isSelected = size === s;
            return (
              <button
                key={s}
                onClick={() => setSize(s)}
                aria-pressed={isSelected}
                className={cn(
                  "relative h-12 min-w-14 rounded-xl border px-3 text-sm font-bold transition",
                  isSelected
                    ? "border-transparent text-black"
                    : "border-white/10 bg-white/[0.03] hover:border-white/30",
                )}
                style={
                  isSelected
                    ? {
                        background: product.accent,
                        boxShadow: `0 0 18px ${product.accent}66`,
                      }
                    : undefined
                }
              >
                {s}
                {isSelected && (
                  <Check className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-black p-0.5 text-white" />
                )}
              </button>
            );
          })}
        </div>
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
          disabled={product.stock === 0}
          size="lg"
          className="h-12 rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] text-base font-bold text-black transition hover:opacity-90 disabled:opacity-40"
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          Adicionar ao carrinho
        </Button>
        <Button
          onClick={handleBuyNow}
          disabled={product.stock === 0}
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

function ReviewsSection({
  product,
  reviews,
}: {
  product: Product;
  reviews: Review[];
}) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [author, setAuthor] = useState(user?.name ?? "");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<{
    author?: string;
    comment?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  const dist = useMemo(() => {
    const base: Record<number, number> = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };
    reviews.forEach((r) => {
      const k = Math.max(1, Math.min(5, Math.round(r.rating)));
      base[k] += 1;
    });
    return base;
  }, [reviews]);

  const avg = useMemo(() => {
    if (reviews.length === 0) return 0;
    return (
      reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    );
  }, [reviews]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: { author?: string; comment?: string } = {};
    if (!author.trim()) nextErrors.author = "Informe seu nome.";
    if (!comment.trim()) nextErrors.comment = "Escreva um comentário.";
    if (comment.trim().length < 3)
      nextErrors.comment = "Comentário muito curto.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

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
      toast.success("Avaliação enviada! Obrigado pelo feedback.");
      setComment("");
      setRating(5);
      setErrors({});
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

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
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

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Summary */}
        <div className="glass-strong rounded-3xl border border-white/10 p-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-5xl font-black">{avg.toFixed(1)}</p>
            <Stars value={avg} size={18} />
            <p className="text-xs text-muted-foreground">
              {reviews.length}{" "}
              {reviews.length === 1 ? "avaliação" : "avaliações"}
            </p>
          </div>

          <Separator className="my-5 bg-white/10" />

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = dist[n];
              const pct =
                reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div
                  key={n}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="w-6 text-muted-foreground">{n}★</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-[var(--neon-magenta)]"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
              <Star className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">Sem avaliações ainda</p>
              <p className="text-sm text-muted-foreground">
                Seja o primeiro a avaliar este produto.
              </p>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* Write a review */}
      <form
        onSubmit={submit}
        className="glass rounded-3xl border border-white/10 p-6"
      >
        <h3 className="text-lg font-bold">Deixe sua avaliação</h3>
        <p className="mb-5 text-sm text-muted-foreground">
          Conte para a galera o que achou deste drop.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nome
            </label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Como te chamamos?"
              className="rounded-xl border-white/10 bg-white/[0.03]"
            />
            {errors.author && (
              <p className="text-xs text-rose-400">{errors.author}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nota: <span className="text-foreground">{rating}</span> estrelas
            </label>
            <div className="flex items-center gap-3 pt-1">
              <Slider
                min={1}
                max={5}
                step={1}
                value={[rating]}
                onValueChange={(v) => setRating(v[0] ?? 5)}
                className="flex-1"
              />
              <Stars value={rating} size={16} />
            </div>
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
            placeholder="Conforto, acabamento, tamanho…"
            className="resize-none rounded-xl border-white/10 bg-white/[0.03]"
          />
          {errors.comment && (
            <p className="text-xs text-rose-400">{errors.comment}</p>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-6 font-bold text-black hover:opacity-90"
          >
            <Send className="mr-2 h-4 w-4" />
            {submitting ? "Enviando…" : "Enviar avaliação"}
          </Button>
        </div>
      </form>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Related products
// ---------------------------------------------------------------------------

function Related({ products }: { products: Product[] }) {
  if (!products || products.length === 0) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="space-y-5"
    >
      <h2 className="text-2xl font-black sm:text-3xl">
        Você também vai curtir
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
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

  const { data: related } = useQuery({
    queryKey: ["products", "related", product?.category, product?.id],
    queryFn: () => api.products({ category: product?.category }),
    enabled: !!product,
    select: (list: Product[]) =>
      list.filter((p) => p.id !== product?.id).slice(0, 4),
  });

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

      <Separator className="my-16 bg-white/10" />

      {/* Related */}
      <Related products={related ?? []} />
    </div>
  );
}

export default ProductDetailView;

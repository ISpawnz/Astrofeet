"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ShoppingCart,
  Eye,
  Minus,
  Plus,
  Loader2,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { useUIStore } from "@/stores/ui";
import { useCartStore } from "@/stores/cart";
import { api } from "@/lib/client";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Product } from "@/lib/types";

export function QuickViewModal() {
  const quickViewProductId = useUIStore((s) => s.quickViewProductId);
  const close = useUIStore((s) => s.closeQuickView);
  const open = quickViewProductId !== null;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : close())}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] overflow-hidden border-white/10 bg-[#0a0e1f]/95 p-0 backdrop-blur-xl sm:max-w-3xl"
        aria-describedby="quick-view-desc"
      >
        <DialogTitle className="sr-only">Visualização rápida</DialogTitle>
        <DialogDescription id="quick-view-desc" className="sr-only">
          Pré-visualização do produto com foto, preço, tamanhos e ações de
          compra.
        </DialogDescription>

        {/* Close (X) button top-right */}
        <DialogClose
          aria-label="Fechar visualização"
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/70 backdrop-blur transition hover:bg-black/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--neon-cyan)]/50"
        >
          <span aria-hidden className="text-lg leading-none">
            ✕
          </span>
        </DialogClose>

        <AnimatePresence mode="wait">
          {quickViewProductId ? (
            <QuickViewBody key={quickViewProductId} id={quickViewProductId} />
          ) : null}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function QuickViewBody({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => api.product(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[320px] place-items-center p-10">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--neon-cyan)]" />
          <p className="text-sm">Carregando produto…</p>
        </div>
      </div>
    );
  }

  if (isError || !data?.product) {
    return (
      <div className="grid min-h-[320px] place-items-center p-10 text-center">
        <div className="space-y-3">
          <p className="text-base font-semibold">
            Não foi possível carregar o produto.
          </p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Tente novamente em instantes."}
          </p>
        </div>
      </div>
    );
  }

  return <ProductPreview product={data.product} />;
}

function ProductPreview({ product }: { product: Product }) {
  const navigate = useUIStore((s) => s.navigate);
  const closeQuickView = useUIStore((s) => s.closeQuickView);
  const add = useCartStore((s) => s.add);
  const openCart = useCartStore((s) => s.open);

  const sizes = product.sizes ?? [];
  const [size, setSize] = useState<number | null>(
    sizes.length > 0 ? sizes[Math.floor(sizes.length / 2)] ?? sizes[0]! : null,
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  // Reset internal state when the product changes.
  useEffect(() => {
    const fallback =
      sizes.length > 0 ? sizes[Math.floor(sizes.length / 2)] ?? sizes[0]! : null;
    setSize(fallback);
    setQty(1);
    setAdded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const sizeStockMap = product.sizeStock ?? {};
  const selectedSizeStock =
    size !== null ? sizeStockMap[String(size)] : undefined;
  const effectiveMax =
    selectedSizeStock !== undefined ? selectedSizeStock : product.stock;
  const maxQty = Math.max(1, Math.min(effectiveMax, 99));
  const soldOut = effectiveMax <= 0;

  const installment = product.price / 10;

  function handleAdd() {
    if (size === null) {
      toast.error("Selecione um tamanho para continuar.");
      return;
    }
    add(product, size, qty);
    toast.success(`${product.name} adicionado ao carrinho`);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
    openCart();
  }

  function handleDetails() {
    closeQuickView();
    navigate("product", { id: product.slug });
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="grid max-h-[92vh] overflow-y-auto sm:grid-cols-2"
    >
      {/* Left — image */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-white/5 to-transparent">
        {/* Accent glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
          style={{ background: product.accent }}
          aria-hidden
        />
        {/* Orbit rings (hero-style) */}
        <div className="pointer-events-none absolute inset-6 rounded-full border border-white/5 animate-spin-slow" aria-hidden />
        <div className="pointer-events-none absolute inset-12 rounded-full border border-white/[0.07]" aria-hidden />
        <div className="pointer-events-none absolute inset-20 rounded-full border border-white/[0.04]" aria-hidden />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0]}
          alt={product.name}
          className="animate-astro-float relative h-full w-full object-contain p-8"
        />

        {/* Badge */}
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full border border-[var(--neon-cyan)]/40 bg-[var(--neon-cyan)]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--neon-cyan)] backdrop-blur">
            {product.badge}
          </span>
        )}
        {soldOut && (
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1 text-[11px] font-bold uppercase text-rose-300 backdrop-blur">
            Esgotado
          </span>
        )}
      </div>

      {/* Right — info */}
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {product.brand}
          </p>
          <h2 className="text-xl font-bold leading-tight sm:text-2xl">
            {product.name}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-amber-300">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="font-semibold">{product.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              · {product.reviewCount ?? 0} avaliações
            </span>
          </div>
        </div>

        {/* Price */}
        <div>
          <p className="text-2xl font-black tracking-tight">
            {formatPrice(product.price)}
          </p>
          <p className="text-xs text-muted-foreground">
            ou 10x de {formatPrice(installment)} sem juros
          </p>
        </div>

        {/* Short description */}
        <p className="line-clamp-3 text-sm text-foreground/80">
          {product.description}
        </p>

        {/* Size selector (compact chips) */}
        {sizes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tamanho
              </p>
              {size !== null && (
                <p className="text-[11px] text-muted-foreground">
                  Selecionado: <span className="font-bold text-foreground">{size}</span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sizes.map((s) => {
                const sStock = sizeStockMap[String(s)];
                const out = sStock !== undefined ? sStock <= 0 : false;
                const active = size === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => !out && setSize(s)}
                    disabled={out}
                    aria-pressed={active}
                    aria-label={`Tamanho ${s}`}
                    className={cn(
                      "h-9 min-w-9 rounded-full border px-2.5 text-xs font-bold transition-all",
                      active
                        ? "border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] shadow-[0_0_12px_var(--neon-cyan)]"
                        : "border-white/10 bg-white/[0.03] text-foreground/80 hover:border-white/30 hover:bg-white/[0.06]",
                      out && "cursor-not-allowed opacity-40 line-through",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity selector */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Quantidade
          </p>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Diminuir quantidade"
              className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/70 transition hover:bg-white/10 hover:text-foreground disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-6 text-center text-sm font-bold tabular-nums">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              disabled={qty >= maxQty}
              aria-label="Aumentar quantidade"
              className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/70 transition hover:bg-white/10 hover:text-foreground disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            className="btn-cosmic flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {added ? (
              <>
                <Check className="h-4 w-4" />
                Adicionado!
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Adicionar ao carrinho
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDetails}
            className="flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-foreground backdrop-blur transition hover:bg-white/10"
          >
            <Eye className="h-4 w-4" />
            Ver detalhes
          </button>
        </div>
      </div>
    </motion.div>
  );
}

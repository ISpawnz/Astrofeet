"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Star, Heart, GitCompare } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { useUIStore } from "@/stores/ui";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { useCompareStore } from "@/stores/compare";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const BADGE_STYLES: Record<string, string> = {
  Novo: "bg-[var(--neon-cyan)]/15 text-[var(--neon-cyan)] border-[var(--neon-cyan)]/40",
  "Drop limitado":
    "bg-[var(--neon-magenta)]/15 text-[var(--neon-magenta)] border-[var(--neon-magenta)]/40",
  "Mais vendido":
    "bg-[var(--neon-lime)]/15 text-[var(--neon-lime)] border-[var(--neon-lime)]/40",
};

export function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const navigate = useUIStore((s) => s.navigate);
  const add = useCartStore((s) => s.add);
  const toggleWishlist = useWishlistStore((s) => s.toggleProduct);
  const inWishlist = useWishlistStore((s) => s.has(product.id));
  const toggleCompareId = useCompareStore((s) => s.toggle);
  const inCompare = useCompareStore((s) => s.has(product.id));
  const compareCount = useCompareStore((s) => s.count());
  const [heartBump, setHeartBump] = useState(false);

  function quickAdd(e: React.MouseEvent) {
    e.stopPropagation();
    const size = product.sizes[Math.floor(product.sizes.length / 2)] ?? product.sizes[0];
    if (!size) return;
    add(product, size, 1);
    toast.success(`${product.name} adicionado ao carrinho`);
  }

  function toggleHeart(e: React.MouseEvent) {
    e.stopPropagation();
    toggleWishlist(product);
    setHeartBump(true);
    setTimeout(() => setHeartBump(false), 450);
    toast.success(
      inWishlist
        ? `${product.name} saiu da sua lista`
        : `${product.name} salvo na lista de desejos`,
    );
  }

  function toggleCompare(e: React.MouseEvent) {
    e.stopPropagation();
    if (!inCompare && compareCount >= 4) {
      toast.error("Máximo de 4 produtos para comparar.");
      return;
    }
    toggleCompareId(product.id);
    toast.success(
      inCompare
        ? `${product.name} saiu da comparação`
        : `${product.name} adicionado à comparação`,
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3) }}
      whileHover={{ y: -6 }}
      onClick={() => navigate("product", { id: product.slug })}
      className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-sm transition-colors hover:border-white/20 card-hover-glow tilt-card card-sheen"
    >
      {/* Accent glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30"
        style={{ background: product.accent }}
      />
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-b from-white/5 to-transparent">
        {/* Glow behind product */}
        <div
          className="absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl transition-transform duration-700 group-hover:scale-110"
          style={{ background: product.accent }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0]}
          alt={product.name}
          className="relative h-full w-full object-contain p-4 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3"
          loading="lazy"
        />
        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.badge && (
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur",
                BADGE_STYLES[product.badge] ??
                  "bg-white/10 text-white border-white/20",
              )}
            >
              {product.badge}
            </span>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">
              Últimas {product.stock}
            </span>
          )}
        </div>
        {/* Action buttons (top-right): compare + wishlist, stacked vertically */}
        <div className="absolute right-2 top-2 flex flex-col gap-1.5">
          <button
            onClick={toggleCompare}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition-all duration-200 hover:scale-110",
              inCompare
                ? "border-[var(--neon-lime)]/60 bg-[var(--neon-lime)]/25 text-[var(--neon-lime)] opacity-100 shadow-[0_0_12px_var(--neon-lime)]"
                : "border-white/20 bg-black/50 text-white/70 opacity-90 hover:border-[var(--neon-lime)]/40 hover:text-[var(--neon-lime)]",
            )}
            aria-label={
              inCompare
                ? `Remover ${product.name} da comparação`
                : `Comparar ${product.name}`
            }
            aria-pressed={inCompare}
          >
            <GitCompare className={cn("h-4 w-4", inCompare && "fill-current")} />
          </button>
          <button
            onClick={toggleHeart}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition-all duration-200 hover:scale-110",
              inWishlist
                ? "border-[var(--neon-magenta)]/60 bg-[var(--neon-magenta)]/25 text-[var(--neon-magenta)] opacity-100 shadow-[0_0_12px_var(--neon-magenta)]"
                : "border-white/20 bg-black/50 text-white/90 opacity-100",
            )}
            aria-label={
              inWishlist
                ? `Remover ${product.name} da lista de desejos`
                : `Salvar ${product.name} na lista de desejos`
            }
            aria-pressed={inWishlist}
          >
            <Heart
              className={cn("h-4 w-4", heartBump && "animate-heartbeat", inWishlist && "fill-current")}
            />
          </button>
        </div>
        {/* Quick add */}
        <button
          onClick={quickAdd}
          className="absolute bottom-2 right-2 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-[var(--neon-cyan)] text-black opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-110"
          aria-label={`Adicionar ${product.name} ao carrinho`}
        >
          <ShoppingCart className="h-5 w-5" />
        </button>
      </div>

      {/* Info */}
      <div className="px-2 pb-1 pt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {product.brand}
          </p>
          <div className="flex items-center gap-1 text-xs text-amber-300">
            <Star className="h-3 w-3 fill-current" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        </div>
        <h3 className="mt-1 line-clamp-1 font-semibold">{product.name}</h3>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="text-lg font-bold">{formatPrice(product.price)}</p>
            <p className="text-[11px] text-muted-foreground">
              ou 10x de {formatPrice(product.price / 10)}
            </p>
          </div>
          <span
            className="rounded-full px-2 py-1 text-[10px] font-medium"
            style={{
              color: product.accent,
              background: `${product.accent}1a`,
            }}
          >
            {product.category}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Star, Heart, GitCompare, Eye } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/shared/types";
import { useUIStore } from "@/stores/ui";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { useCompareStore } from "@/stores/compare";
import { formatPrice } from "@/shared/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Selos: rótulo exibido + estilo. Os valores vêm do cadastro do produto.
const BADGES: Record<string, { label: string; className: string }> = {
  Novo: { label: "Novo", className: "bg-white text-foreground" },
  "Drop limitado": { label: "Edição limitada", className: "bg-[var(--hot)] text-white" },
  "Mais vendido": { label: "Mais vendido", className: "bg-foreground text-background" },
};

export function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const navigate = useUIStore((s) => s.navigate);
  const openQuickView = useUIStore((s) => s.openQuickView);
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

  function handleQuickView(e: React.MouseEvent) {
    e.stopPropagation();
    openQuickView(product.id);
  }

  const badge = product.badge
    ? BADGES[product.badge] ?? { label: product.badge, className: "bg-white text-foreground" }
    : null;
  const iconBtn =
    "flex h-9 w-9 items-center justify-center rounded-full bg-white text-foreground shadow-sm transition hover:scale-105";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.25) }}
      onClick={() => navigate("product", { id: product.slug })}
      className="group relative cursor-pointer"
    >
      {/* Foto */}
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-[var(--surface)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          loading="lazy"
        />
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
          {badge && (
            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm", badge.className)}>
              {badge.label}
            </span>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-amber-800 shadow-sm">
              Últimas {product.stock}
            </span>
          )}
        </div>
        <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5">
          <button
            onClick={toggleHeart}
            className={cn(iconBtn, inWishlist && "text-[var(--hot)]")}
            aria-label={
              inWishlist
                ? `Remover ${product.name} da lista de desejos`
                : `Salvar ${product.name} na lista de desejos`
            }
            aria-pressed={inWishlist}
          >
            <Heart className={cn("h-4 w-4", heartBump && "animate-heartbeat", inWishlist && "fill-current")} />
          </button>
          <button
            onClick={toggleCompare}
            className={cn(
              iconBtn,
              "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100",
              inCompare && "bg-foreground text-background sm:opacity-100",
            )}
            aria-label={inCompare ? `Remover ${product.name} da comparação` : `Comparar ${product.name}`}
            aria-pressed={inCompare}
          >
            <GitCompare className="h-4 w-4" />
          </button>
        </div>
        {/* Ações rápidas (desktop: aparecem no hover) */}
        <div className="absolute inset-x-2.5 bottom-2.5 hidden translate-y-2 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 sm:flex">
          <button
            onClick={quickAdd}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-foreground text-sm font-bold text-background transition hover:bg-foreground/85"
            aria-label={`Adicionar ${product.name} ao carrinho`}
          >
            <ShoppingCart className="h-4 w-4" />
            Adicionar
          </button>
          <button
            onClick={handleQuickView}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-sm transition hover:scale-105"
            aria-label={`Visualização rápida de ${product.name}`}
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Informações */}
      <div className="pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold">{product.name}</h3>
          {product.rating > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium">
              <Star className="h-3 w-3 fill-current" aria-hidden />
              {product.rating.toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {[product.category, product.brand].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-1.5 font-bold">{formatPrice(product.price)}</p>
        <p className="text-xs text-muted-foreground">ou 10x de {formatPrice(product.price / 10)}</p>
      </div>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  X,
  Trash2,
  ShoppingBag,
  Sparkles,
  Loader2,
  Compass,
  HeartCrack,
} from "lucide-react";
import { useWishlistStore } from "@/stores/wishlist";
import { useCartStore } from "@/stores/cart";
import { useUIStore } from "@/stores/ui";
import { api } from "@/client/api";
import { formatPrice } from "@/shared/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface WishlistItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  accent: string;
  brand: string;
  addedAt: string;
}

function WishlistCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-3">
      <Skeleton className="aspect-square w-full rounded-2xl bg-white/5" />
      <div className="space-y-2 px-2 pb-1 pt-3">
        <Skeleton className="h-3 w-1/3 rounded bg-white/5" />
        <Skeleton className="h-4 w-3/4 rounded bg-white/5" />
        <Skeleton className="h-5 w-1/2 rounded bg-white/5" />
        <Skeleton className="h-9 w-full rounded-full bg-white/5" />
      </div>
    </div>
  );
}

function EmptyState() {
  const navigate = useUIStore((s) => s.navigate);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass mx-auto flex max-w-xl flex-col items-center gap-5 rounded-3xl p-10 text-center sm:p-14"
    >
      <div className="relative flex h-28 w-28 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[var(--neon-magenta)]/15 blur-3xl" />
        <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-dashed border-[var(--neon-magenta)]/30" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <Heart className="h-10 w-10 text-[var(--neon-magenta)]" />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold sm:text-3xl">Sua lista está vazia</h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Salve seus sneakers favoritos clicando no coração em qualquer produto.
          Eles aparecem aqui para você voltar quando quiser.
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

function WishlistCard({
  item,
  index,
  onRemove,
  onAddToCart,
  loadingId,
}: {
  item: WishlistItem;
  index: number;
  onRemove: (id: string) => void;
  onAddToCart: (item: WishlistItem) => void;
  loadingId: string | null;
}) {
  const navigate = useUIStore((s) => s.navigate);
  const isLoading = loadingId === item.id;
  const installment = formatPrice(item.price / 10);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3) }}
      exit={{ opacity: 0, x: -40, scale: 0.85, transition: { duration: 0.28 } }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-sm transition-colors hover:border-white/20"
    >
      {/* Accent glow halo */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30"
        style={{ background: item.accent }}
      />

      {/* Image */}
      <div
        onClick={() => navigate("product", { id: item.slug })}
        className="relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-b from-white/5 to-transparent"
      >
        <div
          className="absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl transition-transform duration-700 group-hover:scale-110"
          style={{ background: item.accent }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.name}
          className="relative h-full w-full object-contain p-4 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3"
          loading="lazy"
        />

        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-muted-foreground backdrop-blur-md transition hover:border-rose-500/40 hover:bg-rose-500/15 hover:text-rose-300"
          aria-label={`Remover ${item.name} da lista de desejos`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col px-2 pb-1 pt-3">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {item.brand}
        </p>
        <h3
          onClick={() => navigate("product", { id: item.slug })}
          className="mt-1 line-clamp-1 cursor-pointer font-semibold transition-colors hover:text-[var(--neon-cyan)]"
        >
          {item.name}
        </h3>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-bold">{formatPrice(item.price)}</p>
            <p className="text-[11px] text-muted-foreground">
              ou 10x de {installment}
            </p>
          </div>
          <span
            className="rounded-full px-2 py-1 text-[10px] font-medium"
            style={{
              color: item.accent,
              background: `${item.accent}1a`,
            }}
          >
            Salvo
          </span>
        </div>

        <Button
          onClick={() => onAddToCart(item)}
          disabled={isLoading}
          className="mt-3 h-9 w-full rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] text-sm font-bold text-black hover:opacity-90 disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShoppingBag className="h-4 w-4" />
          )}
          {isLoading ? "Adicionando..." : "Adicionar ao carrinho"}
        </Button>
      </div>
    </motion.div>
  );
}

export function WishlistView() {
  const items = useWishlistStore((s) => s.items);
  const hydrated = useWishlistStore((s) => s.hydrated);
  const remove = useWishlistStore((s) => s.remove);
  const clear = useWishlistStore((s) => s.clear);
  const count = useWishlistStore((s) => s.count);
  const add = useCartStore((s) => s.add);
  const navigate = useUIStore((s) => s.navigate);

  const [loadingId, setLoadingId] = useState<string | null>(null);

  function handleRemove(id: string) {
    remove(id);
    toast.success("Removido da sua lista.");
  }

  function handleClear() {
    if (items.length === 0) return;
    toast("Limpar toda a sua lista de desejos?", {
      description: "Essa ação não pode ser desfeita.",
      duration: 7000,
      action: {
        label: "Limpar",
        onClick: () => {
          clear();
          toast.success("Lista limpa com sucesso.");
        },
      },
      cancel: {
        label: "Cancelar",
        onClick: () => {},
      },
    });
  }

  async function handleAddToCart(item: WishlistItem) {
    setLoadingId(item.id);
    try {
      const { product } = await api.product(item.slug);
      const size =
        product.sizes[Math.floor(product.sizes.length / 2)] ??
        product.sizes[0];
      if (!size) {
        throw new Error("Tamanhos indisponíveis no momento.");
      }
      add(product, size, 1);
      toast.success(`${item.name} adicionado ao carrinho.`);
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "Não foi possível adicionar ao carrinho.";
      toast.error(message);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      {/* ---------- Header ---------- */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-[var(--neon-magenta)]">
            <Sparkles className="h-3.5 w-3.5" />
            Sua coleção
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            <span className="text-gradient-neon">Lista de desejos</span>
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Os sneakers que você guardou para orbitar depois.
          </p>
        </div>

        {hydrated && items.length > 0 && (
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold sm:self-auto">
            <Heart className="h-4 w-4 fill-[var(--neon-magenta)] text-[var(--neon-magenta)]" />
            {count()} {count() === 1 ? "item" : "itens"}
          </div>
        )}
      </motion.header>

      <Separator className="my-8 bg-white/10" />

      {/* ---------- Hydration guard ---------- */}
      {!hydrated ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <WishlistCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* ---------- Grid ---------- */}
          <motion.div
            layout
            className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => (
                <WishlistCard
                  key={item.id}
                  item={item}
                  index={i}
                  onRemove={handleRemove}
                  onAddToCart={handleAddToCart}
                  loadingId={loadingId}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* ---------- Footer actions ---------- */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <Button
              onClick={handleClear}
              variant="ghost"
              className="rounded-full px-6 py-3 text-sm font-semibold text-rose-300/90 transition hover:bg-rose-500/10 hover:text-rose-200"
            >
              <Trash2 className="h-4 w-4" />
              Limpar lista
            </Button>
            <Button
              onClick={() => navigate("products")}
              variant="outline"
              className="rounded-full border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/10"
            >
              <Compass className="h-4 w-4" />
              Explorar mais drops
            </Button>
          </motion.div>
        </>
      )}

      {/* ---------- Tiny reassurance footer ---------- */}
      {hydrated && items.length === 0 && (
        <p className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <HeartCrack className="h-3.5 w-3.5" />
          Toque no coração de qualquer produto para salvá-lo aqui.
        </p>
      )}
    </section>
  );
}

export default WishlistView;

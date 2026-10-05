"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useCompareStore } from "@/stores/compare";
import { useUIStore } from "@/stores/ui";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/client/api";
import { formatPrice } from "@/shared/format";
import type { Product } from "@/shared/types";
import {
  GitCompare,
  X,
  Star,
  Trash2,
  Sparkles,
  PackageX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CompareRow {
  key: string;
  label: string;
  /** Height class applied to both the label cell and the product value cell so they align. */
  cellClass: string;
  render: (p: Product) => React.ReactNode;
}

const ROWS: CompareRow[] = [
  {
    key: "image",
    label: "Imagem",
    cellClass: "h-20",
    render: (p) => (
      <div
        className="relative mx-auto flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-white/5"
        style={{ boxShadow: `inset 0 0 20px ${p.accent}30` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.images[0]}
          alt={p.name}
          className="h-full w-full object-contain p-1"
        />
      </div>
    ),
  },
  {
    key: "name",
    label: "Nome",
    cellClass: "min-h-[44px]",
    render: (p) => (
      <p className="line-clamp-2 text-sm font-semibold">{p.name}</p>
    ),
  },
  {
    key: "brand",
    label: "Marca",
    cellClass: "min-h-[28px]",
    render: (p) => (
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {p.brand}
      </p>
    ),
  },
  {
    key: "category",
    label: "Categoria",
    cellClass: "min-h-[28px]",
    render: (p) => (
      <span
        className="inline-block rounded-full px-2 py-0.5 text-[11px] font-medium"
        style={{ color: p.accent, background: `${p.accent}1a` }}
      >
        {p.category}
      </span>
    ),
  },
  {
    key: "price",
    label: "Preço",
    cellClass: "min-h-[44px]",
    render: (p) => (
      <div className="text-center">
        <p className="text-base font-bold text-[var(--neon-lime)]">
          {formatPrice(p.price)}
        </p>
        <p className="text-[10px] text-muted-foreground">
          ou 10x de {formatPrice(p.price / 10)}
        </p>
      </div>
    ),
  },
  {
    key: "rating",
    label: "Avaliação",
    cellClass: "min-h-[28px]",
    render: (p) => (
      <div className="flex items-center justify-center gap-1 text-sm text-amber-300">
        <Star className="h-3.5 w-3.5 fill-current" />
        <span className="font-medium">{p.rating.toFixed(1)}</span>
        {typeof p.reviewCount === "number" && (
          <span className="text-[10px] text-muted-foreground">
            ({p.reviewCount})
          </span>
        )}
      </div>
    ),
  },
  {
    key: "sizes",
    label: "Tamanhos",
    cellClass: "min-h-[28px]",
    render: (p) => (
      <p className="text-xs text-foreground/80">{p.sizes.join(", ")}</p>
    ),
  },
  {
    key: "stock",
    label: "Em estoque",
    cellClass: "min-h-[28px]",
    render: (p) =>
      p.stock > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
          Em estoque
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-[11px] font-medium text-rose-300">
          <PackageX className="h-3 w-3" />
          Esgotado
        </span>
      ),
  },
];

function CompareSkeleton({ count }: { count: number }) {
  return (
    <div className="flex gap-3">
      <div className="w-28 shrink-0" />
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="min-w-[180px] flex-1 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
        >
          <div className="skeleton-cosmic mx-auto h-20 w-20 rounded-xl" />
          {Array.from({ length: 7 }).map((_, j) => (
            <div
              key={j}
              className="skeleton-cosmic h-4 rounded"
              style={{ width: `${60 + ((i + j) % 4) * 10}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CompareDrawer() {
  const ids = useCompareStore((s) => s.ids);
  const open = useCompareStore((s) => s.open);
  const closePanel = useCompareStore((s) => s.closePanel);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);

  const navigate = useUIStore((s) => s.navigate);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["compare-products", ids.join(",")],
    queryFn: () => api.products({ ids: ids.join(",") }),
    enabled: ids.length > 0,
    staleTime: 30_000,
  });

  // Reorder products to match store `ids` order (so the comparison is stable
  // as users add/remove items).
  const products: Product[] = ids
    .map((id) => (data ?? []).find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const showEmpty = ids.length === 0;
  const showLoading = isLoading || (isFetching && products.length === 0);

  function goToProducts() {
    closePanel();
    navigate("products");
  }

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? null : closePanel())}>
      <SheetContent className="flex w-full flex-col border-white/10 bg-[#0a0e1f]/95 p-0 backdrop-blur-xl sm:max-w-2xl">
        {/* Header */}
        <SheetHeader className="border-b border-white/10 px-5 py-4">
          <SheetTitle className="flex items-center gap-3 pr-8 text-lg">
            <GitCompare className="h-5 w-5 text-[var(--neon-lime)]" />
            Comparar produtos
            <span className="animate-pop-in flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--neon-lime)]/15 px-2 text-xs font-bold text-[var(--neon-lime)] border border-[var(--neon-lime)]/30">
              {ids.length}/4
            </span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Compare até 4 produtos lado a lado com atributos detalhados.
          </SheetDescription>
          <p className="text-xs text-muted-foreground">
            Compare até 4 produtos lado a lado.
          </p>
        </SheetHeader>

        {/* Body — comparison table */}
        <div className="relative flex-1 overflow-x-auto overflow-y-hidden">
          <AnimatePresence mode="wait">
            {showEmpty ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
                  <GitCompare className="h-9 w-9 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold">Adicione produtos para comparar</p>
                  <p className="text-sm text-muted-foreground">
                    Use o ícone de comparar nos cards para montar sua seleção.
                  </p>
                </div>
                <button
                  onClick={goToProducts}
                  className="mt-2 rounded-full bg-[var(--neon-lime)] px-5 py-2 text-sm font-semibold text-black hover:opacity-90"
                >
                  Explorar produtos
                </button>
              </motion.div>
            ) : showLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-5 py-4"
              >
                <CompareSkeleton count={Math.max(ids.length, 1)} />
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex h-full items-start gap-3 px-5 py-4"
              >
                {/* Attribute labels column (sticky) */}
                <div className="sticky left-0 z-10 flex w-28 shrink-0 flex-col gap-3 self-start rounded-2xl border border-white/10 bg-[#0a0e1f]/95 p-3 backdrop-blur">
                  {/* Header row (matches remove-button height) */}
                  <div className="flex h-7 items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    Atributo
                  </div>
                  {ROWS.map((row) => (
                    <div
                      key={row.key}
                      className={cn(
                        "flex items-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
                        row.cellClass,
                      )}
                    >
                      {row.label}
                    </div>
                  ))}
                </div>

                {/* Product columns */}
                {products.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                    className="flex min-w-[180px] flex-1 flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    {/* Remove button row (matches label header row height) */}
                    <div className="flex h-7 items-center justify-end">
                      <button
                        onClick={() => remove(product.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/40 text-muted-foreground transition hover:scale-110 hover:border-rose-500/50 hover:text-rose-300"
                        aria-label={`Remover ${product.name} da comparação`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Attribute value rows */}
                    {ROWS.map((row) => (
                      <div
                        key={row.key}
                        className={cn(
                          "flex items-center justify-center text-center",
                          row.cellClass,
                        )}
                      >
                        {row.render(product)}
                      </div>
                    ))}
                  </motion.div>
                ))}

                {/* Empty add-slot column when fewer than 4 products */}
                {products.length > 0 && products.length < 4 && (
                  <button
                    onClick={goToProducts}
                    className="flex min-w-[140px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-center text-muted-foreground transition hover:border-[var(--neon-lime)]/40 hover:bg-[var(--neon-lime)]/[0.04] hover:text-[var(--neon-lime)]"
                  >
                    <Sparkles className="h-6 w-6" />
                    <span className="text-xs font-medium">
                      Adicionar outro
                    </span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!showEmpty && (
          <div className="border-t border-white/10 px-5 py-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={clear}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <Trash2 className="h-4 w-4" />
                Limpar tudo
              </button>
              <button
                onClick={goToProducts}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--neon-lime)] to-[var(--neon-cyan)] py-2.5 text-sm font-bold text-black transition hover:opacity-90"
              >
                <GitCompare className="h-4 w-4" />
                Explorar produtos
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  Sparkles,
  PackageSearch,
  Compass,
} from "lucide-react";
import { api } from "@/client/api";
import { useUIStore } from "@/stores/ui";
import { formatPrice } from "@/shared/format";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44];
const PRICE_MIN = 0;
const PRICE_MAX = 2000;
const PRICE_STEP = 50;

type SortValue = "newest" | "price-asc" | "price-desc" | "rating";

interface Filters {
  category: string;
  brand: string;
  size: number | null;
  min: number | null;
  max: number | null;
}

const DEFAULT_FILTERS: Filters = {
  category: "Todos",
  brand: "Todas",
  size: null,
  min: null,
  max: null,
};

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "newest", label: "Novidades" },
  { value: "price-asc", label: "Menor preço" },
  { value: "price-desc", label: "Maior preço" },
  { value: "rating", label: "Melhor avaliação" },
];

export function ProductsView() {
  const params = useUIStore((s) => s.params);

  // ---- Local UI state (initialized from store params on mount) ----
  const [searchInput, setSearchInput] = useState<string>(params.q ?? "");
  const [q, setQ] = useState<string>(params.q ?? "");
  const [sort, setSort] = useState<SortValue>(
    (params.sort as SortValue) || "newest",
  );
  const [filters, setFilters] = useState<Filters>({
    category: params.category ?? "Todos",
    brand: params.brand ?? "Todas",
    size: params.size ? Number(params.size) : null,
    min: params.min ? Number(params.min) : null,
    max: params.max ? Number(params.max) : null,
  });
  const [priceRange, setPriceRange] = useState<[number, number]>([
    params.min ? Number(params.min) : PRICE_MIN,
    params.max ? Number(params.max) : PRICE_MAX,
  ]);
  const [sheetOpen, setSheetOpen] = useState(false);

  // ---- Debounce search (~300ms) ----
  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ---- Build API params (drives the queryKey) ----
  const apiParams = useMemo(() => {
    const p: Record<string, string | number | boolean> = { sort };
    if (q) p.q = q;
    if (filters.category && filters.category !== "Todos")
      p.category = filters.category;
    if (filters.brand && filters.brand !== "Todas") p.brand = filters.brand;
    if (filters.size) p.size = filters.size;
    if (filters.min != null) p.min = filters.min;
    if (filters.max != null) p.max = filters.max;
    if (params.featured === "true") p.featured = true;
    if (params.bestSeller === "true") p.bestSeller = true;
    return p;
  }, [q, sort, filters, params.featured, params.bestSeller]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["products", "list", apiParams],
    queryFn: () => api.products(apiParams),
  });

  // Facets — fetch all products once (stable) to derive categories & brands
  const { data: allProducts } = useQuery({
    queryKey: ["products", "facets"],
    queryFn: () => api.products({ sort: "newest" }),
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    (allProducts ?? []).forEach((p) => set.add(p.category));
    return ["Todos", ...Array.from(set).sort()];
  }, [allProducts]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    (allProducts ?? []).forEach((p) => set.add(p.brand));
    return ["Todas", ...Array.from(set).sort()];
  }, [allProducts]);

  const products = data ?? [];

  const hasActiveFilters =
    filters.category !== "Todos" ||
    filters.brand !== "Todas" ||
    filters.size != null ||
    filters.min != null ||
    filters.max != null ||
    q !== "";

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setSearchInput("");
    setQ("");
    setPriceRange([PRICE_MIN, PRICE_MAX]);
  }

  function setCategory(v: string) {
    setFilters((f) => ({ ...f, category: v }));
  }
  function setBrand(v: string) {
    setFilters((f) => ({ ...f, brand: v }));
  }
  function toggleSize(v: number) {
    setFilters((f) => ({ ...f, size: f.size === v ? null : v }));
  }
  function commitPrice(v: number[]) {
    const min = v[0] === PRICE_MIN ? null : v[0];
    const max = v[1] === PRICE_MAX ? null : v[1];
    setFilters((f) => ({ ...f, min, max }));
  }

  const FiltersPanel = (
    <div className="flex flex-col gap-7">
      {/* Categoria */}
      <FilterGroup title="Categoria">
        <ChipRow>
          {categories.map((c) => (
            <Chip
              key={c}
              active={filters.category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </Chip>
          ))}
        </ChipRow>
      </FilterGroup>

      {/* Marca */}
      <FilterGroup title="Marca">
        <ChipRow>
          {brands.map((b) => (
            <Chip
              key={b}
              active={filters.brand === b}
              onClick={() => setBrand(b)}
            >
              {b}
            </Chip>
          ))}
        </ChipRow>
      </FilterGroup>

      {/* Tamanho */}
      <FilterGroup title="Tamanho (BR)">
        <div className="grid grid-cols-5 gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSize(s)}
              aria-pressed={filters.size === s}
              className={cn(
                "flex h-10 items-center justify-center rounded-full border px-2 text-sm font-medium transition",
                filters.size === s
                  ? "border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)]"
                  : "border-white/10 bg-white/5 text-foreground/80 hover:border-white/25",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Preço */}
      <FilterGroup title="Preço">
        <Slider
          value={priceRange}
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          onValueChange={(v) => setPriceRange([v[0], v[1]])}
          onValueCommit={commitPrice}
          className="py-2"
        />
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            {formatPrice(priceRange[0])}
          </span>
          <span className="text-foreground/30">—</span>
          <span className="font-medium text-foreground">
            {formatPrice(priceRange[1])}
          </span>
        </div>
      </FilterGroup>

      {/* Reset */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={clearFilters}
          className="h-10 justify-start gap-2 self-start px-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          Limpar filtros
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:pt-16">
      {/* ---------- Header ---------- */}
      <header className="flex flex-col gap-3">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--neon-cyan)]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Catálogo
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-balance text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl"
        >
          Escolha seu <span className="text-gradient-neon">drop</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-xl text-pretty text-sm text-muted-foreground sm:text-base"
        >
          Filtre por categoria, marca, tamanho ou preço e encontre o par perfeito
          para decolar.
        </motion.p>
      </header>

      {/* ---------- Toolbar: search + sort + mobile filter trigger ---------- */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nome, marca ou estilo…"
            aria-label="Buscar modelos"
            className="h-11 rounded-full border-white/10 bg-white/5 pl-11 pr-10 text-sm placeholder:text-muted-foreground/70 focus-visible:border-[var(--neon-cyan)]/50 focus-visible:ring-[var(--neon-cyan)]/20"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => setSort(v as SortValue)}>
            <SelectTrigger
              aria-label="Ordenar por"
              className="h-11 w-full min-w-[180px] rounded-full border-white/10 bg-white/5 px-4 text-sm focus-visible:border-[var(--neon-cyan)]/50 focus-visible:ring-[var(--neon-cyan)]/20 sm:w-auto"
            >
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-white/10 bg-popover/95 backdrop-blur">
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Mobile filters trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="h-11 shrink-0 rounded-full border-white/10 bg-white/5 px-4 text-sm lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-[88vw] max-w-sm flex-col border-white/10 bg-background/95 p-0 backdrop-blur-xl"
            >
              <SheetHeader className="flex flex-row items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <SlidersHorizontal className="h-4 w-4 text-[var(--neon-cyan)]" />
                  Filtros
                </SheetTitle>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-[var(--neon-cyan)] hover:underline"
                  >
                    Limpar
                  </button>
                )}
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-5 py-5">
                {FiltersPanel}
              </div>
              <div className="border-t border-white/10 p-4">
                <SheetClose asChild>
                  <Button className="h-11 w-full rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] text-sm font-bold text-black">
                    Ver {products.length}{" "}
                    {products.length === 1 ? "modelo" : "modelos"}
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* ---------- Body: sidebar + grid ---------- */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Filtros
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-[var(--neon-cyan)] transition hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>
            {FiltersPanel}
          </div>
        </aside>

        {/* Main grid area */}
        <section>
          {/* Results count */}
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isLoading ? (
                <span className="text-foreground/60">Buscando modelos…</span>
              ) : isError ? (
                <span className="text-amber-300">Falha ao carregar.</span>
              ) : (
                <>
                  <span className="font-bold text-foreground">
                    {products.length}
                  </span>{" "}
                  {products.length === 1
                    ? "modelo encontrado"
                    : "modelos encontrados"}
                </>
              )}
            </p>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <EmptyState
              icon={<PackageSearch className="h-7 w-7 text-[var(--neon-cyan)]" />}
              title="Não foi possível carregar os modelos"
              description="Algo deu errado na conexão. Tente novamente."
              actionLabel="Tentar novamente"
              onAction={() => refetch()}
            />
          ) : products.length === 0 ? (
            <EmptyState
              icon={<Compass className="h-7 w-7 text-[var(--neon-cyan)]" />}
              title="Nenhum modelo encontrado"
              description="Ajuste os filtros ou explore todo o catálogo da Astrofeet."
              actionLabel="Explorar tudo"
              onAction={clearFilters}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ---------- Sub-components ----------

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ChipRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition",
        active
          ? "border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)]"
          : "border-white/10 bg-white/5 text-foreground/80 hover:border-white/25",
      )}
    >
      {children}
    </button>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-3">
      <Skeleton className="aspect-square w-full rounded-2xl bg-white/[0.06]" />
      <div className="space-y-2 px-2 pb-1 pt-3">
        <Skeleton className="h-3 w-16 bg-white/[0.06]" />
        <Skeleton className="h-4 w-32 bg-white/[0.06]" />
        <Skeleton className="h-6 w-24 bg-white/[0.06]" />
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <Button
        onClick={onAction}
        className="h-11 rounded-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-violet)] px-6 text-sm font-bold text-black"
      >
        {actionLabel}
      </Button>
    </motion.div>
  );
}

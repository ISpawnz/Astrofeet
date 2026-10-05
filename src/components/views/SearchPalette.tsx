"use client";

import { useEffect, useState, useRef } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useUIStore } from "@/stores/ui";
import { useWishlistStore } from "@/stores/wishlist";
import { useCartStore } from "@/stores/cart";
import { api } from "@/client/api";
import { formatPrice } from "@/shared/format";
import type { Product } from "@/shared/types";
import {
  Search,
  Heart,
  ShoppingBag,
  Package,
  Home,
  Sparkles,
  TrendingUp,
  Loader2,
} from "lucide-react";

export function SearchPalette() {
  const open = useUIStore((s) => s.searchOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const navigate = useUIStore((s) => s.navigate);
  const wishlistCount = useWishlistStore((s) => s.count());
  const cartCount = useCartStore((s) => s.count());

  const [q, setQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(!open);
      }
      if (e.key === "Escape" && open) {
        setSearchOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setSearchOpen]);

  // Debounced search
  useEffect(() => {
    if (!open) {
      setQ("");
      setResults([]);
      return;
    }
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const products = await api.products({ q, sort: "rating" });
        setResults(products.slice(0, 6));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, open]);

  function go(view: Parameters<typeof navigate>[0], params?: Parameters<typeof navigate>[1]) {
    setSearchOpen(false);
    navigate(view, params);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={(o) => setSearchOpen(o)}
      className="border-black/10 bg-background backdrop-blur-xl"
    >
      <CommandInput
        placeholder="Buscar sneakers, marcas, categorias…  (Esc para fechar)"
        value={q}
        onValueChange={setQ}
      />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>
          {loading ? (
            <span className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando…
            </span>
          ) : q.trim() ? (
            <span className="block py-6 text-center text-sm text-muted-foreground">
              Nenhum sneaker encontrado para “{q}”.
            </span>
          ) : (
            <span className="block py-6 text-center text-sm text-muted-foreground">
              Digite para buscar ou escolha uma ação abaixo.
            </span>
          )}
        </CommandEmpty>

        {/* Quick actions */}
        {!q.trim() && (
          <>
            <CommandGroup heading="Ações rápidas">
              <CommandItem
                onSelect={() => go("home")}
                className="cursor-pointer gap-3"
              >
                <Home className="h-4 w-4 text-[var(--brand)]" />
                <span>Início</span>
              </CommandItem>
              <CommandItem
                onSelect={() => go("products")}
                className="cursor-pointer gap-3"
              >
                <Package className="h-4 w-4 text-[var(--brand)]" />
                <span>Ver todos os drops</span>
              </CommandItem>
              <CommandItem
                onSelect={() => go("products", { sort: "newest" })}
                className="cursor-pointer gap-3"
              >
                <Sparkles className="h-4 w-4 text-[var(--ink)]" />
                <span>Novidades</span>
              </CommandItem>
              <CommandItem
                onSelect={() => go("products", { bestSeller: "true" })}
                className="cursor-pointer gap-3"
              >
                <TrendingUp className="h-4 w-4 text-[var(--success)]" />
                <span>Mais vendidos</span>
              </CommandItem>
              <CommandItem
                onSelect={() => go("wishlist")}
                className="cursor-pointer gap-3"
              >
                <Heart className="h-4 w-4 text-[var(--hot)]" />
                <span>Lista de desejos</span>
                {wishlistCount > 0 && (
                  <span className="ml-auto rounded-full bg-[var(--hot)]/15 px-2 py-0.5 text-xs font-bold text-[var(--hot)]">
                    {wishlistCount}
                  </span>
                )}
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setSearchOpen(false);
                  useCartStore.getState().open();
                }}
                className="cursor-pointer gap-3"
              >
                <ShoppingBag className="h-4 w-4 text-[var(--brand)]" />
                <span>Abrir carrinho</span>
                {cartCount > 0 && (
                  <span className="ml-auto rounded-full bg-[var(--brand)]/15 px-2 py-0.5 text-xs font-bold text-[var(--brand)]">
                    {cartCount}
                  </span>
                )}
              </CommandItem>
              <CommandItem
                onSelect={() => go("track-order")}
                className="cursor-pointer gap-3"
              >
                <Search className="h-4 w-4 text-[var(--ink)]" />
                <span>Rastrear pedido</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Atalho">
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Pressione{" "}
                <kbd className="rounded border border-black/15 bg-black/[0.03] px-1.5 py-0.5 font-mono text-[10px]">
                  Ctrl K
                </kbd>{" "}
                a qualquer momento para abrir esta busca.
              </div>
            </CommandGroup>
          </>
        )}

        {/* Search results */}
        {q.trim() && (
          <CommandGroup heading="Sneakers">
            {results.map((p) => (
              <CommandItem
                key={p.id}
                value={`${p.name} ${p.brand} ${p.category}`}
                onSelect={() => go("product", { id: p.slug })}
                className="cursor-pointer items-center gap-3 py-2"
              >
                <span
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                  style={{ background: `${p.accent}1a` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="h-full w-full object-contain p-1"
                  />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.brand} · {p.category}
                  </p>
                </div>
                <span className="text-sm font-bold">
                  {formatPrice(p.price)}
                </span>
              </CommandItem>
            ))}
            {results.length > 0 && (
              <CommandItem
                onSelect={() => go("products", { q })}
                className="cursor-pointer justify-center gap-2 border-t border-black/5 pt-3 text-sm font-semibold text-[var(--brand)]"
              >
                <Search className="h-4 w-4" />
                Ver todos os resultados para “{q}”
              </CommandItem>
            )}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

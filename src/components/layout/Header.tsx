"use client";

import Link from "next/link";
import { useUIStore } from "@/stores/ui";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";
import { ShoppingCart, Search, User, Menu, X, LayoutDashboard, LogOut, Heart, Rocket, Package, UserCircle, GitCompare } from "lucide-react";
import { useState, useEffect } from "react";
import { useWishlistStore } from "@/stores/wishlist";
import { useCompareStore } from "@/stores/compare";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NAV = [
  { label: "Drops", view: "products" as const, params: {} },
  { label: "Novidades", view: "products" as const, params: { sort: "newest" } },
  { label: "Mais vendidos", view: "products" as const, params: { bestSeller: "true" } },
];

export function Header() {
  const navigate = useUIStore((s) => s.navigate);
  const openAuth = useUIStore((s) => s.openAuth);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const cartCount = useCartStore((s) => s.count());
  const openCart = useCartStore((s) => s.open);
  const wishlistCount = useWishlistStore((s) => s.count());
  const compareCount = useCompareStore((s) => s.count());
  const toggleComparePanel = useCompareStore((s) => s.togglePanel);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Gate user-derived UI on mount to avoid SSR/client hydration mismatch
  // (auth state lives in localStorage and is null during SSR).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const showUser = mounted && user;

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass-strong border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Logo */}
          <button
            onClick={() => navigate("home")}
            className="group flex items-center gap-2"
            aria-label="Astrofeet — início"
          >
            <span className="relative inline-flex h-9 w-9 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-[var(--neon-cyan)] opacity-20 blur-md transition group-hover:opacity-40" />
              <svg viewBox="0 0 40 40" className="relative h-9 w-9">
                <defs>
                  <linearGradient id="logoG" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--neon-cyan)" />
                    <stop offset="100%" stopColor="var(--neon-magenta)" />
                  </linearGradient>
                </defs>
                <circle cx="20" cy="20" r="17" fill="none" stroke="url(#logoG)" strokeWidth="2" />
                <ellipse cx="20" cy="20" rx="17" ry="6" fill="none" stroke="url(#logoG)" strokeWidth="1.5" opacity="0.7" />
                <circle cx="20" cy="20" r="4" fill="url(#logoG)" />
              </svg>
            </span>
            <span className="text-gradient-animated text-2xl font-black tracking-tight">
              ASTROFEET
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.view, item.params)}
                className="nav-underline rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition hover:bg-white/5 hover:text-foreground"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="hidden rounded-full text-foreground/80 hover:text-foreground sm:inline-flex"
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar (Ctrl K)"
              title="Buscar (Ctrl K)"
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full text-foreground/80 hover:text-foreground"
              onClick={() => {
                if (compareCount === 0) {
                  toast("Adicione produtos para comparar", {
                    description: "Clique no ícone de comparar nos cards de produto para adicioná-los.",
                  });
                } else {
                  toggleComparePanel();
                }
              }}
              aria-label="Comparar produtos"
              title="Comparar produtos"
            >
              <GitCompare className="h-5 w-5" />
              {mounted && compareCount > 0 && (
                <span className="animate-pop-in absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--neon-lime)] px-1 text-[10px] font-bold text-black shadow-[0_0_12px_var(--neon-lime)]">
                  {compareCount}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full text-foreground/80 hover:text-foreground"
              onClick={() => navigate("wishlist")}
              aria-label="Lista de desejos"
            >
              <Heart className="h-5 w-5" />
              {mounted && wishlistCount > 0 && (
                <span className="animate-pop-in absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--neon-magenta)] px-1 text-[10px] font-bold text-black shadow-[0_0_12px_var(--neon-magenta)]">
                  {wishlistCount}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full text-foreground/80 hover:text-foreground"
              onClick={openCart}
              aria-label="Abrir carrinho"
            >
              <ShoppingCart className="h-5 w-5" />
              {mounted && cartCount > 0 && (
                <span className="animate-pop-in absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--neon-cyan)] px-1 text-[10px] font-bold text-black shadow-[0_0_12px_var(--neon-cyan)]">
                  {cartCount}
                </span>
              )}
            </Button>

            {showUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-foreground/80 hover:text-foreground"
                    aria-label="Minha conta"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate("wishlist")}
                    className="cursor-pointer"
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Lista de desejos
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("track-order")}
                    className="cursor-pointer"
                  >
                    <Rocket className="mr-2 h-4 w-4" />
                    Rastrear pedido
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("account")}
                    className="cursor-pointer"
                  >
                    <UserCircle className="mr-2 h-4 w-4" />
                    Minha conta
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("account")}
                    className="cursor-pointer"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Meus pedidos
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem
                      onClick={() => navigate("admin")}
                      className="cursor-pointer"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Painel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={async () => {
                      await fetch("/api/auth/logout", { method: "POST" });
                      logout();
                      navigate("home");
                    }}
                    className="cursor-pointer text-rose-300 focus:text-rose-200"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => openAuth("login")}
                className="hidden rounded-full bg-[var(--neon-cyan)] text-black hover:bg-[var(--neon-cyan)]/90 sm:inline-flex"
              >
                Entrar
              </Button>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <div
          className={cn(
            "overflow-hidden border-t border-white/5 transition-all md:hidden",
            mobileOpen ? "max-h-96" : "max-h-0",
          )}
        >
          <nav className="flex flex-col gap-1 px-4 py-3">
            {NAV.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.view, item.params);
                  setMobileOpen(false);
                }}
                className="rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground/80 hover:bg-white/5"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => {
                setSearchOpen(true);
                setMobileOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground/80 hover:bg-white/5"
            >
              <Search className="h-4 w-4" /> Buscar
            </button>
            <button
              onClick={() => {
                toggleComparePanel();
                setMobileOpen(false);
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground/80 hover:bg-white/5"
            >
              <span className="flex items-center gap-2">
                <GitCompare className="h-4 w-4" /> Comparar
              </span>
              {compareCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--neon-lime)] px-1 text-[10px] font-bold text-black">
                  {compareCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                navigate("wishlist");
                setMobileOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground/80 hover:bg-white/5"
            >
              <Heart className="h-4 w-4" /> Lista de desejos
            </button>
            <button
              onClick={() => {
                navigate("track-order");
                setMobileOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground/80 hover:bg-white/5"
            >
              <Rocket className="h-4 w-4" /> Rastrear pedido
            </button>
            {showUser && (
              <button
                onClick={() => {
                  navigate("account");
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground/80 hover:bg-white/5"
              >
                <UserCircle className="h-4 w-4" /> Minha conta
              </button>
            )}
            {!showUser && (
              <button
                onClick={() => {
                  openAuth("login");
                  setMobileOpen(false);
                }}
                className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-[var(--neon-cyan)]"
              >
                Entrar / Criar conta
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

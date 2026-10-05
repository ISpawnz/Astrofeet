"use client";

import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { RouterSync } from "@/components/layout/RouterSync";
import { HomeView } from "@/components/views/HomeView";
import { useUIStore } from "@/stores/ui";

// Tudo que não é a home carrega sob demanda: o painel admin (3,5 mil linhas) e
// a conta/checkout não pesam no primeiro acesso de quem só quer ver os tênis.
function ViewSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Carregando"
      className="mx-auto w-full max-w-6xl animate-pulse space-y-4 px-4 py-16"
    >
      <div className="h-8 w-1/3 rounded-lg bg-black/[0.06]" />
      <div className="h-4 w-1/2 rounded bg-black/[0.03]" />
      <div className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-64 rounded-2xl bg-black/[0.03]" />
        ))}
      </div>
    </div>
  );
}
const view = (loader: () => Promise<{ default: React.ComponentType }>) =>
  dynamic(loader, { loading: ViewSkeleton });
const overlay = (loader: () => Promise<{ default: React.ComponentType }>) =>
  dynamic(loader, { ssr: false });

const ProductsView = view(() => import("@/components/views/ProductsView").then((m) => ({ default: m.ProductsView })));
const ProductDetailView = view(() => import("@/components/views/ProductDetailView").then((m) => ({ default: m.ProductDetailView })));
const CheckoutView = view(() => import("@/components/views/CheckoutView").then((m) => ({ default: m.CheckoutView })));
const OrderSuccessView = view(() => import("@/components/views/OrderSuccessView").then((m) => ({ default: m.OrderSuccessView })));
const AdminView = view(() => import("@/components/views/AdminView").then((m) => ({ default: m.AdminView })));
const WishlistView = view(() => import("@/components/views/WishlistView").then((m) => ({ default: m.WishlistView })));
const TrackOrderView = view(() => import("@/components/views/TrackOrderView").then((m) => ({ default: m.TrackOrderView })));
const AccountView = view(() => import("@/components/views/AccountView").then((m) => ({ default: m.AccountView })));
const InfoView = view(() => import("@/components/views/InfoView").then((m) => ({ default: m.InfoView })));

const CartDrawer = overlay(() => import("@/components/views/CartDrawer").then((m) => ({ default: m.CartDrawer })));
const AuthModal = overlay(() => import("@/components/views/AuthModal").then((m) => ({ default: m.AuthModal })));
const SizeGuideModal = overlay(() => import("@/components/views/SizeGuideModal").then((m) => ({ default: m.SizeGuideModal })));
const SearchPalette = overlay(() => import("@/components/views/SearchPalette").then((m) => ({ default: m.SearchPalette })));
const CompareDrawer = overlay(() => import("@/components/views/CompareDrawer").then((m) => ({ default: m.CompareDrawer })));
const QuickViewModal = overlay(() => import("@/components/views/QuickViewModal").then((m) => ({ default: m.QuickViewModal })));
const ShipAssistant = overlay(() => import("@/components/layout/ShipAssistant").then((m) => ({ default: m.ShipAssistant })));

export default function Page() {
  const current = useUIStore((s) => s.view);
  const params = useUIStore((s) => s.params);
  // Chave por rota: voltar/avançar entre filtros ou produtos remonta a tela
  // com os parâmetros certos (as telas leem `params` só na montagem).
  const routeKey = `${current}:${JSON.stringify(params)}`;

  return (
    <div className="relative flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[var(--brand)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Pular para o conteúdo
      </a>
      <RouterSync />
      <ScrollProgress />
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <div key={routeKey}>
          {current === "home" && <HomeView />}
          {current === "products" && <ProductsView />}
          {current === "product" && <ProductDetailView />}
          {current === "checkout" && <CheckoutView />}
          {current === "order-success" && <OrderSuccessView />}
          {current === "admin" && <AdminView />}
          {current === "wishlist" && <WishlistView />}
          {current === "track-order" && <TrackOrderView />}
          {current === "account" && <AccountView />}
          {current === "info" && <InfoView />}
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <AuthModal />
      <SizeGuideModal />
      <SearchPalette />
      <CompareDrawer />
      <QuickViewModal />
      <ShipAssistant />
    </div>
  );
}

"use client";

import { GalaxyBackground } from "@/components/layout/GalaxyBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ShipAssistant } from "@/components/layout/ShipAssistant";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { CartDrawer } from "@/components/views/CartDrawer";
import { AuthModal } from "@/components/views/AuthModal";
import { SizeGuideModal } from "@/components/views/SizeGuideModal";
import { SearchPalette } from "@/components/views/SearchPalette";
import { HomeView } from "@/components/views/HomeView";
import { ProductsView } from "@/components/views/ProductsView";
import { ProductDetailView } from "@/components/views/ProductDetailView";
import { CheckoutView } from "@/components/views/CheckoutView";
import { OrderSuccessView } from "@/components/views/OrderSuccessView";
import { AdminView } from "@/components/views/AdminView";
import { WishlistView } from "@/components/views/WishlistView";
import { TrackOrderView } from "@/components/views/TrackOrderView";
import { AccountView } from "@/components/views/AccountView";
import { useUIStore } from "@/stores/ui";

export default function Page() {
  const view = useUIStore((s) => s.view);

  return (
    <div className="relative flex min-h-screen flex-col">
      <GalaxyBackground />
      <ScrollProgress />
      <Header />
      <main className="flex-1">
        {view === "home" && <HomeView />}
        {view === "products" && <ProductsView />}
        {view === "product" && <ProductDetailView />}
        {view === "checkout" && <CheckoutView />}
        {view === "order-success" && <OrderSuccessView />}
        {view === "admin" && <AdminView />}
        {view === "wishlist" && <WishlistView />}
        {view === "track-order" && <TrackOrderView />}
        {view === "account" && <AccountView />}
      </main>
      <Footer />
      <CartDrawer />
      <AuthModal />
      <SizeGuideModal />
      <SearchPalette />
      <ShipAssistant />
    </div>
  );
}

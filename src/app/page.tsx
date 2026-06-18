"use client";

import { GalaxyBackground } from "@/components/layout/GalaxyBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ShipAssistant } from "@/components/layout/ShipAssistant";
import { CartDrawer } from "@/components/views/CartDrawer";
import { AuthModal } from "@/components/views/AuthModal";
import { HomeView } from "@/components/views/HomeView";
import { ProductsView } from "@/components/views/ProductsView";
import { ProductDetailView } from "@/components/views/ProductDetailView";
import { CheckoutView } from "@/components/views/CheckoutView";
import { OrderSuccessView } from "@/components/views/OrderSuccessView";
import { AdminView } from "@/components/views/AdminView";
import { useUIStore } from "@/stores/ui";

export default function Page() {
  const view = useUIStore((s) => s.view);

  return (
    <div className="relative flex min-h-screen flex-col">
      <GalaxyBackground />
      <Header />
      <main className="flex-1">
        {view === "home" && <HomeView />}
        {view === "products" && <ProductsView />}
        {view === "product" && <ProductDetailView />}
        {view === "checkout" && <CheckoutView />}
        {view === "order-success" && <OrderSuccessView />}
        {view === "admin" && <AdminView />}
      </main>
      <Footer />
      <CartDrawer />
      <AuthModal />
      <ShipAssistant />
    </div>
  );
}

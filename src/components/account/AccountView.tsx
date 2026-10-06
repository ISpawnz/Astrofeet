"use client";

import { useQuery } from "@tanstack/react-query";
import { User, Package, ChevronRight, MapPin, Home, Star, Bell, BellOff } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { api } from "@/client/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AccountHeader } from "./AccountHeader";
import { AddressesTab } from "./AddressesTab";
import { NotificationsTab, StockAlertsTab } from "./AlertsTabs";
import { LoyaltyTab } from "./LoyaltyTab";
import { OrdersTab } from "./OrdersTab";
import { ProfileTab } from "./ProfileTab";
import { HelpFooter, HydrationSkeleton, NotSignedIn } from "./shared";

export function AccountView() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: () => api.listOrders(true),
    enabled: hydrated && !!user,
  });

  if (!hydrated) {
    return <HydrationSkeleton />;
  }

  if (!user) {
    return <NotSignedIn />;
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <button
          onClick={() => useUIStore.getState().navigate("home")}
          className="inline-flex items-center gap-1 transition hover:text-foreground"
        >
          <Home className="h-3.5 w-3.5" />
          Início
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">Minha conta</span>
      </div>

      <AccountHeader user={user} orders={orders} />

      <Tabs defaultValue="orders" className="mt-8">
        <TabsList className="glass h-auto gap-1 rounded-full border border-black/10 p-1">
          <TabsTrigger
            value="orders"
            className="rounded-full px-4 py-2 text-sm font-semibold data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none"
          >
            <Package className="h-4 w-4" />
            Meus pedidos
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="rounded-full px-4 py-2 text-sm font-semibold data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none"
          >
            <User className="h-4 w-4" />
            Meus dados
          </TabsTrigger>
          <TabsTrigger
            value="enderecos"
            className="rounded-full px-4 py-2 text-sm font-semibold data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none"
          >
            <MapPin className="h-4 w-4" />
            Endereços
          </TabsTrigger>
          <TabsTrigger
            value="notificacoes"
            className="rounded-full px-4 py-2 text-sm font-semibold data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none"
          >
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger
            value="alertas"
            className="rounded-full px-4 py-2 text-sm font-semibold data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none"
          >
            <BellOff className="h-4 w-4" />
            Alertas
          </TabsTrigger>
          <TabsTrigger
            value="recompensas"
            className="rounded-full px-4 py-2 text-sm font-semibold data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none"
          >
            <Star className="h-4 w-4" />
            Recompensas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-6">
          <OrdersTab orders={orders} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="profile" className="mt-6">
          <ProfileTab user={user} />
        </TabsContent>
        <TabsContent value="enderecos" className="mt-6">
          <AddressesTab />
        </TabsContent>
        <TabsContent value="notificacoes" className="mt-6">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="alertas" className="mt-6">
          <StockAlertsTab />
        </TabsContent>
        <TabsContent value="recompensas" className="mt-6">
          <LoyaltyTab />
        </TabsContent>
      </Tabs>

      <HelpFooter />
    </section>
  );
}

export default AccountView;

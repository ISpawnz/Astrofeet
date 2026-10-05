"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { ArrowLeft, LogIn, Loader2, ShieldAlert, Ticket, Bell } from "lucide-react";
import { NotificationList } from "@/components/shared/NotificationList";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { fadeUp } from "@/components/shared/motion";
import { CouponsTab } from "./CouponsTab";
import { OrdersTable } from "./OrdersTab";
import { OverviewTab } from "./OverviewTab";
import { ProductsTable } from "./ProductsTab";

export function AdminGuard() {
  const openAuth = useUIStore((s) => s.openAuth);
  const navigate = useUIStore((s) => s.navigate);
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-strong w-full rounded-3xl border border-black/10 p-8"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/30">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold">Acesso restrito ao painel.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área é reservada à equipe da Astrofeet. Faça login com uma conta de administrador para continuar.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => openAuth("login")} className="bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90">
            <LogIn className="h-4 w-4" />
            Fazer login
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("home")}
            className="border-black/10 bg-black/[0.03] hover:bg-black/[0.06]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar à loja
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export function NotificationsTab() {
  return (
    <NotificationList
      title="Central de notificações"
      subtitle="Veja os e-mails enviados automaticamente pela loja (simulação)."
      emptyText="Quando um pedido for criado ou tiver o status alterado, o e-mail aparecerá aqui."
      showRecipient
    />
  );
}

export function AdminView() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const navigate = useUIStore((s) => s.navigate);
  const [tab, setTab] = useState("overview");

  // Guard: wait for hydration, then enforce admin role
  if (!hydrated) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
        <div className="glass flex items-center gap-3 rounded-2xl border border-black/10 px-5 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando painel...
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return <AdminGuard />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.4 }}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs tracking-[0.25em] text-[var(--brand)] uppercase">Astrofeet · Admin</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
            <span className="text-gradient-neon">Painel administrativo</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conectado como <span className="font-medium text-foreground">{user.email}</span>
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("home")}
          className="w-fit border-black/10 bg-black/[0.03] hover:bg-black/[0.06]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à loja
        </Button>
      </motion.div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="gap-5">
        <TabsList className="glass h-auto w-full justify-start gap-1 rounded-xl border border-black/10 p-1 sm:w-auto">
          <TabsTrigger
            value="overview"
            className="rounded-lg px-4 py-2 data-[state=active]:bg-[var(--brand)]/15 data-[state=active]:text-[var(--brand)]"
          >
            Visão geral
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="rounded-lg px-4 py-2 data-[state=active]:bg-[var(--brand)]/15 data-[state=active]:text-[var(--brand)]"
          >
            Pedidos
          </TabsTrigger>
          <TabsTrigger
            value="products"
            className="rounded-lg px-4 py-2 data-[state=active]:bg-[var(--brand)]/15 data-[state=active]:text-[var(--brand)]"
          >
            Produtos
          </TabsTrigger>
          <TabsTrigger
            value="cupons"
            className="rounded-lg px-4 py-2 data-[state=active]:bg-[var(--brand)]/15 data-[state=active]:text-[var(--brand)]"
          >
            <Ticket className="h-4 w-4" />
            Cupons
          </TabsTrigger>
          <TabsTrigger
            value="notificacoes"
            className="rounded-lg px-4 py-2 data-[state=active]:bg-[var(--brand)]/15 data-[state=active]:text-[var(--brand)]"
          >
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersTable />
        </TabsContent>
        <TabsContent value="products">
          <ProductsTable />
        </TabsContent>
        <TabsContent value="cupons">
          <CouponsTab />
        </TabsContent>
        <TabsContent value="notificacoes">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminView;

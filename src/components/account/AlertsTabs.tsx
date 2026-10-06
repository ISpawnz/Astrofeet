"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, BellOff } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { api } from "@/client/api";
import { NotificationList } from "@/components/shared/NotificationList";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useStockAlerts } from "@/hooks/use-stock-alerts";
import { EmptyState } from "@/components/shared/EmptyState";

export function NotificationsTab() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  return (
    <NotificationList
      title="Minhas notificações"
      subtitle="Acompanhe os e-mails que enviamos para você."
      emptyText="Quando você fizer um pedido ou usar um cupom, os e-mails aparecerão aqui."
      limit={30}
      enabled={hydrated && !!user}
    />
  );
}

export function StockAlertsTab() {
  const navigate = useUIStore((s) => s.navigate);
  const alerts = useStockAlerts();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["alert-products", alerts.ids.join(",")],
    queryFn: () => api.products({ ids: alerts.ids.join(",") }),
    enabled: alerts.ids.length > 0,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Meus alertas de estoque</h2>
        <p className="text-sm text-muted-foreground">Produtos que você quer ser avisado quando voltarem ao estoque.</p>
      </div>
      {alerts.isLoading || (alerts.ids.length > 0 && isLoading) ? (
        <Skeleton className="h-24 w-full rounded-2xl" />
      ) : alerts.ids.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nenhum alerta ativo"
          action={
            <Button onClick={() => navigate("products")} className="rounded-full">
              Ver todos os tênis
            </Button>
          }
        >
          Marque "Avise-me" em um produto esgotado e ele aparece aqui.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl border p-3">
              <button
                onClick={() => navigate("product", { id: p.slug })}
                className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--surface)]"
              >
                <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className={cn("text-xs font-medium", p.stock > 0 ? "text-emerald-700" : "text-rose-700")}>
                  {p.stock > 0 ? "Em estoque" : "Esgotado"}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={alerts.busy}
                onClick={() => alerts.set(p.id, false)}
                className="rounded-full"
              >
                <BellOff className="h-3.5 w-3.5" /> Remover
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/client/api";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";

/** Inscrições "avise-me quando voltar ao estoque" do usuário logado. */
export function useStockAlerts() {
  const user = useAuthStore((s) => s.user);
  const openAuth = useUIStore((s) => s.openAuth);
  const qc = useQueryClient();
  const { data: ids = [], isLoading } = useQuery({
    queryKey: ["stock-alerts"],
    queryFn: api.listStockAlerts,
    enabled: !!user,
  });
  const mutation = useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) =>
      on ? api.subscribeStockAlert(id) : api.unsubscribeStockAlert(id),
    onSuccess: (_, { on }) => {
      qc.invalidateQueries({ queryKey: ["stock-alerts"] });
      toast.success(on ? "Você será avisado quando este tênis voltar ao estoque!" : "Alerta removido.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível atualizar o alerta."),
  });
  return {
    ids,
    isLoading,
    busy: mutation.isPending,
    has: (id: string) => ids.includes(id),
    /** Liga/desliga; sem login, abre o modal de entrada. */
    set: (id: string, on: boolean) => (user ? mutation.mutate({ id, on }) : openAuth("login")),
  };
}

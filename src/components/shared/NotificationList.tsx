"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, ChevronDown, Clock, Mail, Package, RefreshCw, Sparkles, Ticket, Truck } from "lucide-react";
import { api } from "@/client/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate } from "@/shared/format";
import type { Notification, NotificationType } from "@/shared/types";
import { stagger } from "./motion";

const TYPE_META: Record<NotificationType, { Icon: typeof Package; color: string }> = {
  order_created: { Icon: Package, color: "var(--brand)" },
  order_status: { Icon: Truck, color: "var(--success)" },
  coupon_applied: { Icon: Ticket, color: "var(--hot)" },
  welcome: { Icon: Sparkles, color: "var(--ink)" },
};

const STATUS: Record<Notification["status"], { label: string; className: string }> = {
  sent: { label: "Enviado", className: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700" },
  queued: { label: "Na fila", className: "border-amber-500/30 bg-amber-500/15 text-amber-700" },
  failed: { label: "Falhou", className: "border-rose-500/30 bg-rose-500/15 text-rose-700" },
};

/** Lista de e-mails simulados. Admin vê todos (com destinatário); cliente, só os seus. */
export function NotificationList({
  title,
  subtitle,
  emptyText,
  limit = 50,
  showRecipient = false,
  enabled = true,
}: {
  title: string;
  subtitle: string;
  emptyText: string;
  limit?: number;
  showRecipient?: boolean;
  enabled?: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const {
    data = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["notifications", limit],
    queryFn: () => api.listNotifications(limit),
    enabled,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2 rounded-full"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
      ) : data.length === 0 ? (
        <div className="rounded-3xl border border-dashed p-10 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">{emptyText}</p>
        </div>
      ) : (
        <>
          <ul className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
            {data.map((n, i) => {
              const { Icon, color } = TYPE_META[n.type] ?? TYPE_META.order_created;
              const status = STATUS[n.status] ?? STATUS.sent;
              const isOpen = open === n.id;
              return (
                <motion.li key={n.id} {...stagger(i, 0.04)}>
                  <Collapsible
                    open={isOpen}
                    onOpenChange={(o) => setOpen(o ? n.id : null)}
                    className="rounded-2xl border"
                  >
                    <CollapsibleTrigger className="flex w-full items-start gap-3 p-4 text-left">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ color, background: `color-mix(in oklab, ${color} 12%, transparent)` }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block leading-tight font-medium">{n.subject}</span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {showRecipient && (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {n.to}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {formatDate(n.sentAt)}
                          </span>
                          <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px]", status.className)}>
                            {status.label}
                          </Badge>
                        </span>
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                          isOpen && "rotate-180",
                        )}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <pre className="mx-4 mb-4 rounded-xl bg-[var(--surface)] p-3 font-mono text-sm leading-relaxed break-words whitespace-pre-wrap">
                        {n.body}
                      </pre>
                    </CollapsibleContent>
                  </Collapsible>
                </motion.li>
              );
            })}
          </ul>
          <p className="text-center text-xs text-muted-foreground">
            Mostrando {data.length} {data.length === 1 ? "notificação" : "notificações"}
          </p>
        </>
      )}
    </div>
  );
}

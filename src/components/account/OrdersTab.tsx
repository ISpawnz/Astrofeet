"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  MapPin,
  CalendarDays,
  Sparkles,
  Hash,
  Layers,
  Loader2,
  Truck,
  Ticket,
  Download,
  FileJson,
} from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { api } from "@/client/api";
import { formatPrice, formatDate, orderStatusLabel, orderStatusColor, maskCEP } from "@/shared/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Order } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

import { PaymentInfo, isCancelled, itemCount, itemsSummary, paymentMethodInfo } from "./shared";
import { EmptyState } from "@/components/shared/EmptyState";

export function OrderCard({
  order,
  index,
  imageMap = {},
}: {
  order: Order;
  index: number;
  imageMap?: Record<string, string>;
}) {
  const navigate = useUIStore((s) => s.navigate);
  const openNave = useUIStore((s) => s.openNave);
  const [open, setOpen] = useState(false);

  const pay = paymentMethodInfo(order.payment.method);
  const payment = order.payment as PaymentInfo;
  const couponCode = payment.couponCode;
  const discount = payment.discount ?? 0;
  const cancelled = isCancelled(order.status);
  const items = order.items;
  const total = itemCount(order);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.4) }}
      className={cn("glass overflow-hidden rounded-3xl transition", cancelled && "opacity-90")}
    >
      {/* Top row */}
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-black/[0.03]">
              <Package className="h-5 w-5 text-[var(--brand)]" />
            </div>
            <div>
              <p className="neon-text font-mono text-sm font-black tracking-wider text-[var(--brand)] sm:text-base">
                {order.code}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn("h-8 gap-1.5 rounded-full px-3 text-xs font-semibold", orderStatusColor(order.status))}
          >
            {orderStatusLabel(order.status)}
          </Badge>
        </div>

        {/* Items summary */}
        <div className="mt-4 rounded-2xl border border-black/5 bg-black/[0.02] p-3.5">
          <p className="line-clamp-2 text-sm text-foreground/90">{itemsSummary(order)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {total} {total === 1 ? "item" : "itens"}
            </span>
            <span className="flex items-center gap-1">
              {pay.icon}
              {pay.label}
              {order.payment.method === "card" && order.payment.cardLast4 && (
                <span className="font-mono text-foreground/70">· final {order.payment.cardLast4}</span>
              )}
            </span>
            {couponCode && discount > 0 && (
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                Cupom {couponCode} · -{formatPrice(discount)}
              </span>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Total</p>
            <p
              className={cn(
                "text-lg font-black tracking-tight sm:text-xl",
                cancelled ? "text-muted-foreground line-through" : "text-gradient-neon",
              )}
            >
              {formatPrice(order.total)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => navigate("track-order", { code: order.code })}
              className="rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-bold text-white hover:opacity-90"
            >
              <Truck className="h-4 w-4" />
              Rastrear
            </Button>
            <Collapsible open={open} onOpenChange={setOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full border-black/15 bg-black/[0.03] px-4 py-2 text-xs font-semibold backdrop-blur transition hover:bg-black/[0.06]"
                >
                  {open ? (
                    <>
                      Ocultar detalhes
                      <ChevronDown className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Ver detalhes
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleContent className="CollapsibleContent">
          <AnimatePresence>
            {open && (
              <motion.div
                key="details"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden border-t border-black/10"
              >
                {/* Panel header — order code + status + date */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 bg-black/[0.02] px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-black/[0.03]">
                      <Hash className="h-4 w-4 text-[var(--brand)]" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-black tracking-wider text-[var(--brand)] sm:text-base">
                        {order.code}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-7 gap-1.5 rounded-full px-3 text-xs font-semibold",
                      orderStatusColor(order.status),
                    )}
                  >
                    {orderStatusLabel(order.status)}
                  </Badge>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                  {/* Items list */}
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                      <Package className="h-4 w-4 text-[var(--brand)]" />
                      Itens do pedido
                    </h3>
                    <ul className="space-y-2.5">
                      {items.map((item, i) => {
                        const img = imageMap[item.productId];
                        return (
                          <li
                            key={`${item.productId}-${item.size}-${i}`}
                            className="flex items-start gap-3 rounded-2xl border border-black/5 bg-black/[0.02] p-3"
                          >
                            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-black/[0.03]">
                              {img ? (
                                <img src={img} alt={item.name} className="h-full w-full object-contain" />
                              ) : (
                                <Package className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex flex-1 flex-col">
                              <p className="line-clamp-1 text-sm font-semibold">{item.name}</p>
                              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Hash className="h-3 w-3" />
                                  Tam. {item.size}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Layers className="h-3 w-3" />
                                  Qtd. {item.quantity}
                                </span>
                                <span>{formatPrice(item.unitPrice)} / un.</span>
                              </p>
                            </div>
                            <p className="self-center text-sm font-bold">{formatPrice(item.subtotal)}</p>
                          </li>
                        );
                      })}
                    </ul>

                    {/* Totals breakdown */}
                    <div className="mt-2 space-y-1.5 rounded-2xl border border-black/5 bg-black/[0.02] p-3 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-medium text-foreground">{formatPrice(order.subtotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex items-center justify-between text-emerald-700">
                          <span className="flex items-center gap-1.5">
                            <Ticket className="h-3.5 w-3.5" />
                            Desconto
                            {couponCode && (
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase">
                                {couponCode}
                              </span>
                            )}
                          </span>
                          <span className="font-medium">-{formatPrice(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-muted-foreground">
                        <span>Frete</span>
                        <span className="font-medium text-foreground">
                          {order.shipping === 0 ? "Grátis" : formatPrice(order.shipping)}
                        </span>
                      </div>
                      <Separator className="my-1 bg-black/[0.06]" />
                      <div className="flex justify-between text-base font-bold">
                        <span>Total</span>
                        <span className="text-gradient-neon">{formatPrice(order.total)}</span>
                      </div>
                    </div>

                    {/* Coupon badge */}
                    {couponCode && discount > 0 && (
                      <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-2">
                        <Sparkles className="h-4 w-4 shrink-0 text-emerald-700" />
                        <p className="text-xs text-emerald-700">
                          Cupom <span className="font-mono font-bold tracking-wider uppercase">{couponCode}</span>{" "}
                          aplicado · você economizou <span className="font-bold">{formatPrice(discount)}</span>.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Side: address + payment */}
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-4">
                      <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        <MapPin className="h-4 w-4 text-[var(--hot)]" />
                        Endereço de entrega
                      </h3>
                      <div className="mt-2 space-y-0.5 text-sm text-foreground/90">
                        <p className="font-semibold">{order.customer.name}</p>
                        <p className="text-muted-foreground">
                          {order.address.street}, {order.address.number}
                          {order.address.complement ? ` — ${order.address.complement}` : ""}
                        </p>
                        <p className="text-muted-foreground">{order.address.district}</p>
                        <p className="text-muted-foreground">
                          {order.address.city} · {order.address.state}
                        </p>
                        <p className="text-muted-foreground">CEP {maskCEP(order.address.cep)}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-4">
                      <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        {pay.icon}
                        Pagamento
                      </h3>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="font-semibold text-foreground/90">
                          {pay.label}
                          {order.payment.method === "card" && order.payment.cardLast4 && (
                            <span className="ml-1 font-mono text-muted-foreground">
                              · final {order.payment.cardLast4}
                            </span>
                          )}
                        </p>
                        <p className="text-muted-foreground">Status: {orderStatusLabel(order.status)}</p>
                        {couponCode && discount > 0 && (
                          <p className="flex items-center gap-1 text-emerald-700">
                            <Sparkles className="h-3.5 w-3.5" />
                            Cupom {couponCode} aplicado · {formatPrice(discount)} de desconto
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel footer actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-black/5 bg-black/[0.02] px-5 py-4 sm:px-6">
                  <Button
                    onClick={() => navigate("track-order", { code: order.code })}
                    className="rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-bold text-white hover:opacity-90"
                  >
                    <Truck className="h-4 w-4" />
                    Rastrear pedido
                  </Button>
                  <Button
                    onClick={() => openNave()}
                    variant="outline"
                    className="rounded-full border-black/15 bg-black/[0.03] px-4 py-2 text-xs font-semibold backdrop-blur transition hover:bg-black/[0.06]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Abrir assistente
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

export function OrdersTab({ orders, isLoading }: { orders: Order[] | undefined; isLoading: boolean }) {
  const navigate = useUIStore((s) => s.navigate);
  const [exporting, setExporting] = useState<"csv" | "json" | null>(null);

  // Collect every unique product id across all orders so we can fetch
  // their images in a single network round-trip.
  const productIds = orders ? Array.from(new Set(orders.flatMap((o) => o.items.map((i) => i.productId)))) : [];
  const joinedIds = productIds.join(",");

  const { data: productsForImages } = useQuery({
    queryKey: ["order-product-images", joinedIds],
    queryFn: () => api.products({ ids: joinedIds }),
    enabled: productIds.length > 0,
  });

  const imageMap: Record<string, string> = {};
  if (productsForImages) {
    for (const p of productsForImages) {
      if (p.images?.[0]) imageMap[p.id] = p.images[0];
    }
  }

  async function handleExport(format: "csv" | "json") {
    try {
      setExporting(format);
      const blob = await api.exportOrders(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pedidos-astrofeet-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Pedidos exportados em ${format.toUpperCase()}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao exportar.");
    } finally {
      setExporting(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-3xl bg-black/[0.03]" />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Você ainda não fez nenhum pedido"
        action={
          <Button onClick={() => navigate("products")} className="rounded-full">
            Ver todos os tênis
          </Button>
        }
      >
        Quando você finalizar sua primeira compra, ela aparece aqui com todos os detalhes da entrega.
      </EmptyState>
    );
  }

  // Most recent first
  const sorted = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {sorted.length} {sorted.length === 1 ? "pedido" : "pedidos"} no total
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleExport("csv")}
            disabled={exporting !== null}
            aria-label="Exportar pedidos em CSV"
            className="glass-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting === "csv" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--brand)]" />
            ) : (
              <Download className="h-3.5 w-3.5 text-[var(--brand)]" />
            )}
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
          <button
            type="button"
            onClick={() => handleExport("json")}
            disabled={exporting !== null}
            aria-label="Exportar pedidos em JSON"
            className="glass-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting === "json" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--ink)]" />
            ) : (
              <FileJson className="h-3.5 w-3.5 text-[var(--ink)]" />
            )}
            <span className="hidden sm:inline">Exportar JSON</span>
          </button>
        </div>
      </div>
      {sorted.map((order, i) => (
        <OrderCard key={order.id} order={order} index={i} imageMap={imageMap} />
      ))}
    </div>
  );
}

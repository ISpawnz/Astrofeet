"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { Search, Loader2, Inbox, Check, Clock, X } from "lucide-react";
import { api } from "@/client/api";
import type { Order, OrderStatus } from "@/shared/types";
import { formatPrice, formatDate, orderStatusLabel } from "@/shared/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

import { Checkbox } from "@/components/ui/checkbox";
import { ORDER_STATUSES } from "@/shared/rules";
import { StatusBadge, itemsCount } from "./shared";

export function OrdersTable() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("paid");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Date range filter state (YYYY-MM-DD strings from <input type="date">)
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: () => api.listOrders(),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
    return data.filter((o) => {
      if (q) {
        const matches = o.code.toLowerCase().includes(q) || o.customer.name.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (fromTime !== null || toTime !== null) {
        const t = new Date(o.createdAt).getTime();
        if (fromTime !== null && t < fromTime) return false;
        if (toTime !== null && t > toTime) return false;
      }
      return true;
    });
  }, [data, query, dateFrom, dateTo]);

  const dateFilterActive = Boolean(dateFrom || dateTo);

  // Keep selection in sync with the visible list (drop ids that no longer match)
  useEffect(() => {
    if (selectedIds.length === 0) return;
    const visibleIds = new Set(filtered.map((o) => o.id));
    setSelectedIds((prev) => prev.filter((id) => visibleIds.has(id)));
  }, [filtered]);

  const visibleIds = filtered.map((o) => o.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.includes(id)) && !allVisibleSelected;

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  function toggleAll(checked: boolean) {
    if (checked) {
      const next = new Set(selectedIds);
      for (const id of visibleIds) next.add(id);
      setSelectedIds([...next]);
    } else {
      const visible = new Set(visibleIds);
      setSelectedIds((prev) => prev.filter((id) => !visible.has(id)));
    }
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function clearDateFilter() {
    setDateFrom("");
    setDateTo("");
  }

  async function onBulkUpdate() {
    if (selectedIds.length === 0 || bulkSubmitting) return;
    setBulkSubmitting(true);
    try {
      const result = await api.bulkUpdateStatus(selectedIds, bulkStatus);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-metrics"] }),
      ]);
      toast.success(
        `${result.updated} pedido${result.updated === 1 ? "" : "s"} atualizado${
          result.updated === 1 ? "" : "s"
        } para "${orderStatusLabel(bulkStatus)}".`,
      );
      clearSelection();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar os pedidos.");
    } finally {
      setBulkSubmitting(false);
    }
  }

  async function onStatusChange(order: Order, status: string) {
    setUpdating(order.id);
    try {
      await api.updateOrderStatus(order.id, status);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-metrics"] }),
      ]);
      toast.success(`Pedido ${order.code} atualizado para "${orderStatusLabel(status)}".`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar o status.");
    } finally {
      setUpdating(null);
    }
  }

  if (isError) {
    return (
      <div className="glass rounded-2xl border border-black/10 p-8 text-center text-sm text-muted-foreground">
        Não foi possível carregar os pedidos. Tente novamente em instantes.
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <div className="glass rounded-2xl border border-black/10 p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Todos os pedidos</h3>
            <p className="text-xs text-muted-foreground">Atualize o status de cada pedido em tempo real.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por código ou cliente"
              className="border-black/10 bg-black/[0.03] pl-9"
            />
          </div>
        </div>

        {/* Date range filter */}
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-black/5 bg-black/[0.02] p-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs tracking-wider text-muted-foreground uppercase">
              <Clock className="h-3 w-3" />
              De
            </Label>
            <Input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border-black/10 bg-black/[0.03] text-sm [color-scheme:dark]"
            />
          </div>
          <div className="flex-1">
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs tracking-wider text-muted-foreground uppercase">
              <Clock className="h-3 w-3" />
              Até
            </Label>
            <Input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="border-black/10 bg-black/[0.03] text-sm [color-scheme:dark]"
            />
          </div>
          {dateFilterActive && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearDateFilter}
              className="h-9 shrink-0 border border-black/10 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Limpar filtro
            </Button>
          )}
          <div className="hidden shrink-0 items-center text-xs text-muted-foreground sm:flex">
            {filtered.length} pedido{filtered.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="max-h-[28rem] overflow-y-auto rounded-xl border border-black/5">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-[var(--card)] backdrop-blur">
              <TableRow className="border-black/10 hover:bg-transparent">
                <TableHead className="w-10 px-3">
                  <Checkbox
                    checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                    onCheckedChange={(v) => toggleAll(v === true)}
                    aria-label="Selecionar todos os pedidos visíveis"
                    className="border-black/15 data-[state=checked]:border-[var(--brand)] data-[state=checked]:bg-[var(--brand)] data-[state=checked]:text-white"
                  />
                </TableHead>
                <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Código</TableHead>
                <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Cliente</TableHead>
                <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Itens</TableHead>
                <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Total</TableHead>
                <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Status</TableHead>
                <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-black/5">
                    <TableCell colSpan={7}>
                      <Skeleton className="h-7 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow className="border-black/5">
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                      <Inbox className="h-8 w-8 opacity-50" />
                      {query || dateFilterActive
                        ? "Nenhum pedido encontrado para esses filtros."
                        : "Ainda não há pedidos registrados."}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o) => {
                  const checked = selectedIds.includes(o.id);
                  return (
                    <TableRow
                      key={o.id}
                      className={cn("border-black/5 transition-colors", checked && "bg-[var(--brand)]/[0.06]")}
                    >
                      <TableCell className="px-3">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => toggleRow(o.id, v === true)}
                          aria-label={`Selecionar pedido ${o.code}`}
                          className="border-black/15 data-[state=checked]:border-[var(--brand)] data-[state=checked]:bg-[var(--brand)] data-[state=checked]:text-white"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-[var(--brand)]">{o.code}</TableCell>
                      <TableCell>
                        <div className="font-medium">{o.customer.name}</div>
                        <div className="text-xs text-muted-foreground">{o.customer.email}</div>
                      </TableCell>
                      <TableCell className="text-sm">{itemsCount(o)}</TableCell>
                      <TableCell className="font-semibold">{formatPrice(o.total)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={o.status} />
                          <Select
                            value={o.status}
                            disabled={updating === o.id}
                            onValueChange={(v) => onStatusChange(o, v)}
                          >
                            <SelectTrigger
                              size="sm"
                              className="h-8 w-9 justify-center border-black/10 bg-black/[0.03] px-0"
                              aria-label="Alterar status"
                            >
                              {updating === o.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                              ) : (
                                <span className="text-xs text-muted-foreground">···</span>
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {ORDER_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {orderStatusLabel(s)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Floating bulk action bar */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25 }}
          className="sticky bottom-4 z-30"
        >
          <div className="glass-strong flex flex-col gap-3 rounded-2xl border border-[var(--brand)]/30 p-3 shadow-lg sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 items-center rounded-full bg-[var(--brand)]/15 px-3 text-sm font-bold text-[var(--brand)]">
                {selectedIds.length}
              </div>
              <span className="text-sm font-medium">
                {selectedIds.length === 1 ? "1 selecionado" : `${selectedIds.length} selecionados`}
              </span>
              <button
                type="button"
                onClick={clearSelection}
                className="hidden items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground sm:inline-flex"
              >
                <X className="h-3.5 w-3.5" />
                Limpar seleção
              </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                value={bulkStatus}
                onValueChange={(v) => setBulkStatus(v as OrderStatus)}
                disabled={bulkSubmitting}
              >
                <SelectTrigger className="h-9 w-full border-black/15 bg-black/[0.03] text-sm sm:w-44">
                  <SelectValue placeholder="Novo status" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {orderStatusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                onClick={onBulkUpdate}
                disabled={bulkSubmitting}
                className="btn-cosmic h-9 gap-2 rounded-full bg-[var(--brand)] px-5 text-sm font-bold text-white hover:opacity-90"
              >
                {bulkSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Atualizar {selectedIds.length} {selectedIds.length === 1 ? "pedido" : "pedidos"}
              </Button>

              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex h-9 items-center justify-center gap-1 rounded-full px-3 text-xs font-medium text-muted-foreground transition hover:bg-black/[0.03] hover:text-foreground sm:hidden"
              >
                <X className="h-3.5 w-3.5" />
                Limpar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

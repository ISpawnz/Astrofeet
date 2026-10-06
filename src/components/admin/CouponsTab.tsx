"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { TrendingUp, Receipt, Plus, Pencil, Trash2, Loader2, Ticket, Power, Copy, Check } from "lucide-react";
import { api } from "@/client/api";
import type { Coupon } from "@/shared/types";
import { formatPrice, formatDate } from "@/shared/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { fadeUp } from "@/components/shared/motion";
import { MiniStat } from "./shared";

export interface CouponFormState {
  code: string;
  type: "percent" | "fixed";
  value: string;
  minSubtotal: string;
  description: string;
  expiresAt: string; // YYYY-MM-DD or ""
  active: boolean;
}

export function emptyCouponForm(): CouponFormState {
  return {
    code: "",
    type: "percent",
    value: "",
    minSubtotal: "0",
    description: "",
    expiresAt: "",
    active: true,
  };
}

export function formFromCoupon(c: Coupon): CouponFormState {
  let expiresAt = "";
  if (c.expiresAt) {
    try {
      expiresAt = new Date(c.expiresAt).toISOString().slice(0, 10);
    } catch {
      expiresAt = "";
    }
  }
  return {
    code: c.code,
    type: c.type,
    value: String(c.value),
    minSubtotal: String(c.minSubtotal ?? 0),
    description: c.description ?? "",
    expiresAt,
    active: c.active,
  };
}

export const COUPON_CODE_RE = /^[A-Z0-9]{3,20}$/;

export function CouponFormModal({
  open,
  editing,
  onOpenChange,
}: {
  open: boolean;
  editing: Coupon | null;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CouponFormState>(emptyCouponForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Sync form whenever modal opens or editing target changes
  useEffect(() => {
    if (open) {
      setForm(editing ? formFromCoupon(editing) : emptyCouponForm());
      setErrors({});
    }
  }, [open, editing]);

  function update<K extends keyof CouponFormState>(key: K, value: CouponFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  function onCodeChange(v: string) {
    const upper = v
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 20);
    update("code", upper);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const code = form.code.trim();
    const valueNum = Number(form.value);
    const minSubtotalNum = Number(form.minSubtotal) || 0;
    const description = form.description.trim();

    const nextErrors: Record<string, string> = {};
    if (!COUPON_CODE_RE.test(code)) nextErrors.code = "Use 3 a 20 caracteres entre A-Z e 0-9.";
    if (!Number.isFinite(valueNum) || valueNum <= 0) nextErrors.value = "Informe um valor maior que zero.";
    if (form.type === "percent" && valueNum > 100) nextErrors.value = "O percentual não pode passar de 100.";
    if (!description) nextErrors.description = "Descreva o cupom em poucas palavras.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Verifique os campos destacados.");
      return;
    }

    const expiresAt = form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null;

    setSaving(true);
    try {
      if (editing) {
        await api.updateCoupon(editing.id, {
          code,
          value: valueNum,
          minSubtotal: minSubtotalNum,
          description,
          active: form.active,
          expiresAt,
        });
        toast.success(`Cupom ${code} atualizado com sucesso.`);
      } else {
        await api.createCoupon({
          code,
          type: form.type,
          value: valueNum,
          minSubtotal: minSubtotalNum,
          description,
          active: form.active,
          expiresAt,
        });
        toast.success(`Cupom ${code} criado com sucesso.`);
      }
      await queryClient.invalidateQueries({ queryKey: ["coupons"] });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o cupom.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-h-[90vh] overflow-y-auto border-black/10 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-gradient-neon text-xl font-black">
            {editing ? "Editar cupom" : "Novo cupom"}
          </DialogTitle>
          <DialogDescription>
            {editing ? "Ajuste as regras e a validade deste cupom." : "Crie um cupom de desconto para a loja."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Code + Type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-code">Código</Label>
              <Input
                id="c-code"
                value={form.code}
                onChange={(e) => onCodeChange(e.target.value)}
                placeholder="ASTRO10"
                className={cn(
                  "border-black/10 bg-black/[0.03] font-mono tracking-wider uppercase",
                  errors.code && "border-rose-500/60 focus-visible:ring-rose-500/40",
                )}
              />
              <p className="text-xs text-muted-foreground">3 a 20 caracteres entre A-Z e 0-9.</p>
              {errors.code && <p className="text-xs text-rose-700">{errors.code}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-type">Tipo de desconto</Label>
              <Select value={form.type} onValueChange={(v) => update("type", v as "percent" | "fixed")}>
                <SelectTrigger id="c-type" className="w-full border-black/10 bg-black/[0.03]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentual</SelectItem>
                  <SelectItem value="fixed">Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Value + min subtotal */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-value">{form.type === "percent" ? "Valor (%)" : "Valor (R$)"}</Label>
              <div className="relative">
                {form.type === "fixed" && (
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                    R$
                  </span>
                )}
                <Input
                  id="c-value"
                  type="number"
                  min={0}
                  step={form.type === "percent" ? "1" : "0.01"}
                  value={form.value}
                  onChange={(e) => update("value", e.target.value)}
                  placeholder={form.type === "percent" ? "10" : "50.00"}
                  className={cn(
                    "border-black/10 bg-black/[0.03]",
                    form.type === "fixed" && "pl-10",
                    form.type === "percent" && "pr-9",
                    errors.value && "border-rose-500/60 focus-visible:ring-rose-500/40",
                  )}
                />
                {form.type === "percent" && (
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                )}
              </div>
              {errors.value && <p className="text-xs text-rose-700">{errors.value}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-min">Subtotal mínimo (R$)</Label>
              <Input
                id="c-min"
                type="number"
                min={0}
                step="0.01"
                value={form.minSubtotal}
                onChange={(e) => update("minSubtotal", e.target.value)}
                placeholder="0"
                className="border-black/10 bg-black/[0.03]"
              />
              <p className="text-xs text-muted-foreground">Use 0 para liberar em qualquer compra.</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="c-desc">Descrição</Label>
            <Input
              id="c-desc"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="10% off no carrinho inteiro"
              className={cn(
                "border-black/10 bg-black/[0.03]",
                errors.description && "border-rose-500/60 focus-visible:ring-rose-500/40",
              )}
            />
            {errors.description && <p className="text-xs text-rose-700">{errors.description}</p>}
          </div>

          {/* Validade + active */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-expires">Validade (opcional)</Label>
              <Input
                id="c-expires"
                type="date"
                value={form.expiresAt}
                onChange={(e) => update("expiresAt", e.target.value)}
                className="border-black/10 bg-black/[0.03]"
              />
              <p className="text-xs text-muted-foreground">Sem data = válido por tempo indeterminado.</p>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-black/10 bg-black/[0.03] p-3">
              <div>
                <p className="text-sm font-medium">Ativo</p>
                <p className="text-xs text-muted-foreground">Cupons inativos não aparecem no checkout.</p>
              </div>
              <Switch checked={form.active} onCheckedChange={(v) => update("active", v)} />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="border-black/10 bg-black/[0.03] hover:bg-black/[0.06]">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving} className="bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CouponsTab() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["coupons"],
    queryFn: () => api.listCoupons(),
  });

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(c: Coupon) {
    setEditing(c);
    setModalOpen(true);
  }

  async function onToggle(c: Coupon) {
    setTogglingId(c.id);
    try {
      await api.updateCoupon(c.id, { active: !c.active });
      await queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success(`Cupom ${c.code} ${c.active ? "desativado" : "ativado"}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar o cupom.");
    } finally {
      setTogglingId(null);
    }
  }

  async function onCopy(c: Coupon) {
    try {
      await navigator.clipboard.writeText(c.code);
      toast.success(`Cupom ${c.code} copiado.`);
    } catch {
      toast.error("Não foi possível copiar o código.");
    }
  }

  async function onConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteCoupon(deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success(`Cupom ${deleteTarget.code} removido.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover o cupom.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">Cupons de desconto</h3>
          <p className="text-xs text-muted-foreground">Crie e gerencie os cupons da loja.</p>
        </div>
        <Button onClick={openCreate} className="bg-[var(--brand)] text-white hover:opacity-90">
          <Plus className="h-4 w-4" />
          Novo cupom
        </Button>
      </div>

      {data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniStat
            icon={<Ticket className="h-4 w-4" />}
            label="Cupons ativos"
            value={String(data.filter((c) => c.active).length)}
            accent="#cc3d0a"
          />
          <MiniStat
            icon={<Receipt className="h-4 w-4" />}
            label="Total de usos"
            value={String(data.reduce((acc, c) => acc + (c.usageCount ?? 0), 0))}
            accent="#c8102e"
          />
          <MiniStat
            icon={<TrendingUp className="h-4 w-4" />}
            label="Desconto gerado"
            value={formatPrice(data.reduce((acc, c) => acc + (c.totalDiscount ?? 0), 0))}
            accent="#15803d"
          />
        </div>
      )}

      {isError ? (
        <div className="glass rounded-2xl border border-black/10 p-8 text-center text-sm text-muted-foreground">
          <p className="mb-4">Não foi possível carregar os cupons. Tente novamente em instantes.</p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="border-black/10 bg-black/[0.03] hover:bg-black/[0.06]"
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-black/10 p-3 sm:p-4">
          <div className="max-h-[28rem] max-w-full overflow-x-auto overflow-y-auto rounded-xl border border-black/5">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-[var(--card)] backdrop-blur">
                <TableRow className="border-black/10 hover:bg-transparent">
                  <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Código</TableHead>
                  <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Descrição</TableHead>
                  <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Tipo</TableHead>
                  <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Valor</TableHead>
                  <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">
                    Subtotal mín.
                  </TableHead>
                  <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Status</TableHead>
                  <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Usos</TableHead>
                  <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">
                    Desconto gerado
                  </TableHead>
                  <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Validade</TableHead>
                  <TableHead className="text-right text-xs tracking-wider text-muted-foreground uppercase">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i} className="border-black/5">
                      <TableCell colSpan={10}>
                        <Skeleton className="h-9 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : !data || data.length === 0 ? (
                  <TableRow className="border-black/5">
                    <TableCell colSpan={10} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.03] ring-1 ring-black/10">
                          <Ticket className="h-6 w-6 opacity-60" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Nenhum cupom criado ainda</p>
                          <p className="text-xs">Crie o primeiro cupom de desconto da Astrofeet.</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={openCreate}
                          className="bg-[var(--brand)] text-white hover:opacity-90"
                        >
                          <Plus className="h-4 w-4" />
                          Criar primeiro cupom
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      {...fadeUp}
                      transition={{
                        duration: 0.3,
                        delay: Math.min(i * 0.04, 0.3),
                      }}
                      className="border-b border-black/5 transition-colors hover:bg-black/[0.02]"
                    >
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => onCopy(c)}
                          className="group inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-[var(--brand)] transition-colors hover:text-[var(--brand)]/80"
                          title="Copiar código"
                          aria-label={`Copiar cupom ${c.code}`}
                        >
                          {c.code}
                          <Copy className="h-3 w-3 opacity-50 transition-opacity group-hover:opacity-100" />
                        </button>
                      </TableCell>
                      <TableCell className="max-w-[18rem]">
                        <p className="line-clamp-1 text-sm text-foreground">{c.description || "—"}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {c.type === "percent" ? "Percentual" : "Fixo"}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {c.type === "percent" ? `${c.value}%` : formatPrice(c.value)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.minSubtotal > 0 ? formatPrice(c.minSubtotal) : "Sem mínimo"}
                      </TableCell>
                      <TableCell>
                        {c.active ? (
                          <Badge
                            variant="outline"
                            className="rounded-full border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                          >
                            Ativo
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="rounded-full border-black/10 bg-black/[0.03] px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
                          >
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {(c.usageCount ?? 0) > 0 ? (
                          <Badge
                            variant="outline"
                            className="rounded-full border-cyan-500/30 bg-cyan-500/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-700"
                          >
                            {c.usageCount}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(c.totalDiscount ?? 0) > 0 ? (
                          <span className="text-sm font-semibold text-emerald-700">
                            {formatPrice(c.totalDiscount ?? 0)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.expiresAt ? formatDate(c.expiresAt) : "Sem prazo"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                              "h-8 w-8 hover:bg-black/[0.06]",
                              c.active ? "text-emerald-700" : "text-muted-foreground",
                            )}
                            onClick={() => onToggle(c)}
                            disabled={togglingId === c.id}
                            aria-label={c.active ? `Desativar ${c.code}` : `Ativar ${c.code}`}
                            title={c.active ? "Desativar" : "Ativar"}
                          >
                            {togglingId === c.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 hover:bg-black/[0.06]"
                            onClick={() => openEdit(c)}
                            aria-label={`Editar ${c.code}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-rose-700 hover:bg-rose-500/10"
                            onClick={() => setDeleteTarget(c)}
                            aria-label={`Remover ${c.code}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <CouponFormModal open={modalOpen} editing={editing} onOpenChange={setModalOpen} />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="glass-strong border-black/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover cupom?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Esta ação vai remover o cupom "${deleteTarget.code}" da loja. Não dá pra desfazer.`
                : "Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-black/10 bg-black/[0.03] hover:bg-black/[0.06]" disabled={deleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              disabled={deleting}
              className="bg-rose-500 text-white hover:bg-rose-500/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

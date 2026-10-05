"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Plus, Pencil, Trash2, Search, Loader2, Star, PackageSearch, Bell, X, Filter } from "lucide-react";
import { api } from "@/client/api";
import type { Product } from "@/shared/types";
import { formatPrice } from "@/shared/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

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
import { CATEGORIES } from "@/shared/rules";
import { ProductFormModal } from "./ProductForm";

export function ProductsTable() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.products(),
  });

  // ---- Search + filters (client-side) ----
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const brandOptions = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const p of data) set.add(p.brand);
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = debouncedSearch.trim().toLowerCase();
    return data.filter((p) => {
      if (q) {
        const matches = p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (brandFilter !== "all" && p.brand !== brandFilter) return false;
      return true;
    });
  }, [data, debouncedSearch, categoryFilter, brandFilter]);

  const filtersActive = searchQuery.trim() !== "" || categoryFilter !== "all" || brandFilter !== "all";

  function clearFilters() {
    setSearchQuery("");
    setCategoryFilter("all");
    setBrandFilter("all");
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setModalOpen(true);
  }

  async function onConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteProduct(deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      toast.success(`${deleteTarget.name} removido do catálogo.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover o produto.");
    } finally {
      setDeleting(false);
    }
  }

  if (isError) {
    return (
      <div className="glass rounded-2xl border border-black/10 p-8 text-center text-sm text-muted-foreground">
        Não foi possível carregar o catálogo. Tente novamente em instantes.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">Catálogo</h3>
          <p className="text-xs text-muted-foreground">Gerencie os drops disponíveis na loja.</p>
        </div>
        <Button onClick={openCreate} className="bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90">
          <Plus className="h-4 w-4" />
          Novo produto
        </Button>
      </div>

      {/* Search + filters */}
      <div className="glass rounded-2xl border border-black/10 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome ou marca..."
              className="glass rounded-full border-black/10 bg-black/[0.03] pr-4 pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="glass h-9 w-[150px] rounded-full border-black/10 bg-black/[0.03] text-sm">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="glass h-9 w-[160px] rounded-full border-black/10 bg-black/[0.03] text-sm">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {brandOptions.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filtersActive && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 shrink-0 rounded-full border border-black/10 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Limpar filtros
              </Button>
            )}
            <div className="ml-1 hidden items-center gap-1 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs text-muted-foreground sm:flex">
              <Filter className="h-3 w-3" />
              {filtered.length} produto{filtered.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-end text-xs text-muted-foreground sm:hidden">
          {filtered.length} produto{filtered.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="glass rounded-2xl border border-black/10 p-3 sm:p-4">
        <div className="max-h-[28rem] overflow-y-auto rounded-xl border border-black/5">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-[var(--card)] backdrop-blur">
              <TableRow className="border-black/10 hover:bg-transparent">
                <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Produto</TableHead>
                <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Categoria</TableHead>
                <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Preço</TableHead>
                <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Estoque</TableHead>
                <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Selo</TableHead>
                <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">Flags</TableHead>
                <TableHead className="text-right text-xs tracking-wider text-muted-foreground uppercase">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-black/5">
                    <TableCell colSpan={7}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !data || data.length === 0 ? (
                <TableRow className="border-black/5">
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                      <PackageSearch className="h-10 w-10 opacity-50" />
                      <div>
                        <p className="font-medium text-foreground">Catálogo vazio</p>
                        <p className="text-xs">Adicione o primeiro drop da Astrofeet.</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={openCreate}
                        className="bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90"
                      >
                        <Plus className="h-4 w-4" />
                        Novo produto
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow className="border-black/5">
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                      <PackageSearch className="h-10 w-10 opacity-50" />
                      <div>
                        <p className="font-medium text-foreground">Nenhum produto encontrado</p>
                        <p className="text-xs">Ajuste a busca ou os filtros para ver mais resultados.</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={clearFilters}
                        className="border-black/10 bg-black/[0.03] hover:bg-black/[0.06]"
                      >
                        <X className="h-4 w-4" />
                        Limpar filtros
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id} className="border-black/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-black/[0.03]"
                          style={{
                            boxShadow: `inset 0 0 18px ${p.accent}33`,
                          }}
                        >
                          {}
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="h-full w-full object-contain p-1"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.brand}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          color: p.accent,
                          background: `${p.accent}1a`,
                        }}
                      >
                        {p.category}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">{formatPrice(p.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "text-sm",
                            p.stock === 0 ? "text-rose-700" : p.stock <= 5 ? "text-amber-700" : "text-foreground",
                          )}
                        >
                          {p.stock}
                        </span>
                        {p.stock === 0 && (
                          <span
                            title="Produto esgotado — clientes podem estar inscritos para alerta"
                            aria-label="Produto esgotado — clientes podem estar inscritos para alerta"
                            className="relative flex h-5 w-5 items-center justify-center rounded-full bg-[var(--hot)]/15 text-[var(--hot)]"
                          >
                            <Bell className="h-3 w-3" />
                            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--hot)] opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--hot)]" />
                            </span>
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.badge ? (
                        <Badge variant="outline" className="rounded-full border-black/15 bg-black/[0.03] text-[10px]">
                          {p.badge}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.featured && (
                          <span className="rounded-md bg-[var(--brand)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--brand)]">
                            Destaque
                          </span>
                        )}
                        {p.bestSeller && (
                          <span className="rounded-md bg-[var(--success)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--success)]">
                            Top
                          </span>
                        )}
                        <span className="flex items-center gap-0.5 text-[11px] text-amber-700">
                          <Star className="h-3 w-3 fill-current" />
                          {p.rating.toFixed(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-black/[0.06]"
                          onClick={() => openEdit(p)}
                          aria-label={`Editar ${p.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-rose-700 hover:bg-rose-500/10"
                          onClick={() => setDeleteTarget(p)}
                          aria-label={`Remover ${p.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ProductFormModal open={modalOpen} editing={editing} onOpenChange={setModalOpen} />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="glass-strong border-black/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover produto?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Esta ação vai remover "${deleteTarget.name}" do catálogo. Não dá pra desfazer.`
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
    </div>
  );
}

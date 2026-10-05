"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { Plus, Loader2, Bell, Upload, X, Image as ImageIcon } from "lucide-react";
import { api } from "@/client/api";
import type { Product } from "@/shared/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { TextField } from "@/components/shared/TextField";
import { CATEGORIES } from "@/shared/rules";
import { slugify } from "@/shared/format";
import { ACCENT_PRESETS, ALL_SIZES, BADGE_OPTIONS } from "./shared";

export interface ProductFormState {
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: string;
  stock: string;
  rating: string;
  accent: string;
  badge: string;
  description: string;
  sizes: number[];
  sizeStock: Record<string, string>;
  images: string[];
  featured: boolean;
  bestSeller: boolean;
}

// Image upload limits (shared by upload zone + URL add).
const MAX_PRODUCT_IMAGES = 5;

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

export function emptyForm(): ProductFormState {
  return {
    name: "",
    slug: "",
    brand: "",
    category: CATEGORIES[0],
    price: "",
    stock: "0",
    rating: "5",
    accent: ACCENT_PRESETS[0].value,
    badge: "",
    description: "",
    sizes: [...ALL_SIZES],
    sizeStock: {},
    images: [],
    featured: false,
    bestSeller: false,
  };
}

export function formFromProduct(p: Product): ProductFormState {
  const ss = p.sizeStock ?? {};
  const sizeStock: Record<string, string> = {};
  for (const s of p.sizes) {
    const v = ss[String(s)];
    sizeStock[String(s)] = v !== undefined ? String(v) : "";
  }
  return {
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    category: p.category,
    price: String(p.price),
    stock: String(p.stock),
    rating: String(p.rating),
    accent: p.accent,
    badge: p.badge ?? "",
    description: p.description,
    sizes: [...p.sizes].sort((a, b) => a - b),
    sizeStock,
    images: [...p.images],
    featured: p.featured,
    bestSeller: p.bestSeller,
  };
}

export function ProductFormModal({
  open,
  editing,
  onOpenChange,
}: {
  open: boolean;
  editing: Product | null;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProductFormState>(emptyForm());
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form whenever modal opens or editing target changes
  useEffect(() => {
    if (open) {
      setForm(editing ? formFromProduct(editing) : emptyForm());
      setSlugEdited(Boolean(editing));
      setUrlInput("");
    }
  }, [open, editing]);

  function update<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateName(v: string) {
    setForm((f) => {
      const next = { ...f, name: v };
      if (!slugEdited) next.slug = slugify(v);
      return next;
    });
  }

  function toggleSize(s: number) {
    setForm((f) => {
      const has = f.sizes.includes(s);
      const sizes = has ? f.sizes.filter((x) => x !== s) : [...f.sizes, s].sort((a, b) => a - b);
      // Clean up sizeStock for removed sizes.
      const sizeStock = { ...f.sizeStock };
      if (has) delete sizeStock[String(s)];
      return { ...f, sizes, sizeStock };
    });
  }

  function setSizeStock(s: number, value: string) {
    setForm((f) => ({
      ...f,
      sizeStock: { ...f.sizeStock, [String(s)]: value },
    }));
  }

  // ----- Image management (upload + URL add + remove) -----

  function handleFiles(files: File[]) {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("Selecione apenas arquivos de imagem.");
      return;
    }
    const availableSlots = MAX_PRODUCT_IMAGES - form.images.length;
    if (availableSlots <= 0) {
      toast.error("Você já atingiu o limite de 5 imagens.");
      return;
    }
    const toRead = imageFiles.slice(0, availableSlots);
    if (imageFiles.length > toRead.length) {
      toast.warning(`Apenas ${availableSlots} imagem(ns) adicionada(s) — limite de 5.`);
    }
    for (const file of toRead) {
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`"${file.name}" excede 2 MB.`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        if (!result) return;
        setForm((f) => {
          if (f.images.length >= MAX_PRODUCT_IMAGES) return f;
          return { ...f, images: [...f.images, result] };
        });
      };
      reader.onerror = () => {
        toast.error(`Não foi possível ler "${file.name}".`);
      };
      reader.readAsDataURL(file);
    }
  }

  function addUrls() {
    const urls = urlInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (urls.length === 0) return;
    const availableSlots = MAX_PRODUCT_IMAGES - form.images.length;
    if (availableSlots <= 0) {
      toast.error("Você já atingiu o limite de 5 imagens.");
      return;
    }
    const toAdd = urls.slice(0, availableSlots);
    if (urls.length > toAdd.length) {
      toast.warning(`Apenas ${availableSlots} URL(s) adicionada(s) — limite de 5.`);
    }
    setForm((f) => ({ ...f, images: [...f.images, ...toAdd] }));
    setUrlInput("");
  }

  function removeImage(index: number) {
    setForm((f) => ({
      ...f,
      images: f.images.filter((_, i) => i !== index),
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const name = form.name.trim();
    const brand = form.brand.trim();
    const category = form.category.trim();
    const priceNum = Number(form.price);
    const stockNum = parseInt(form.stock || "0", 10);
    const ratingNum = Math.min(5, Math.max(0, Number(form.rating) || 0));

    if (!name) return toast.error("Dê um nome ao produto.");
    if (!brand) return toast.error("Informe a marca.");
    if (!category) return toast.error("Informe a categoria.");
    if (!Number.isFinite(priceNum) || priceNum < 0) return toast.error("Informe um preço válido.");
    if (form.sizes.length === 0) return toast.error("Selecione ao menos um tamanho.");

    const slug = (form.slug.trim() || slugify(name)).toLowerCase();
    const images = form.images.length > 0 ? form.images : [`/products/${slug}.png`];

    // Build per-size stock map (only for selected sizes; parse ints).
    const sizeStockMap: Record<string, number> = {};
    for (const s of form.sizes) {
      const raw = form.sizeStock[String(s)];
      const v = raw === "" ? undefined : parseInt(raw || "0", 10);
      if (v !== undefined && Number.isFinite(v) && v >= 0) sizeStockMap[String(s)] = v;
    }

    const body: Partial<Product> = {
      name,
      slug,
      brand,
      category,
      price: priceNum,
      stock: Number.isFinite(stockNum) ? stockNum : 0,
      rating: ratingNum,
      accent: form.accent,
      badge: form.badge ? form.badge : null,
      description: form.description.trim(),
      sizes: form.sizes,
      images,
      featured: form.featured,
      bestSeller: form.bestSeller,
    };
    // Always send sizeStock so the backend can sync it with the selected sizes.
    (body as Record<string, unknown>).sizeStock = sizeStockMap;

    setSaving(true);
    try {
      if (editing) {
        await api.updateProduct(editing.id, body);
        toast.success(`${name} atualizado com sucesso.`);
        // Restock automation: if the product was out of stock and now has
        // stock, the backend queues notifications to subscribed explorers.
        if (editing.stock === 0 && stockNum > 0) {
          toast.success("Produto reabastecido! Os clientes inscritos serão avisados.", {
            icon: <Bell className="h-4 w-4 text-[var(--brand)]" />,
            duration: 6000,
          });
        }
      } else {
        await api.createProduct(body);
        toast.success(`${name} adicionado ao catálogo.`);
      }
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o produto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-h-[90vh] overflow-y-auto border-black/10 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gradient-neon text-xl font-black">
            {editing ? "Editar produto" : "Novo produto"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Ajuste as informações do item no catálogo."
              : "Preencha as informações para adicionar um novo drop."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Identity */}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="p-name"
              label="Nome"
              value={form.name}
              onChange={(e) => updateName(e.target.value)}
              placeholder="Orion Runner"
            />
            <TextField
              id="p-slug"
              label="Slug"
              value={form.slug}
              onChange={(e) => {
                setSlugEdited(true);
                update("slug", e.target.value);
              }}
              placeholder="orion-runner"
              inputClassName="border-black/10 bg-black/[0.03] font-mono text-sm"
            />
            <TextField
              id="p-brand"
              label="Marca"
              value={form.brand}
              onChange={(e) => update("brand", e.target.value)}
              placeholder="Astrofeet"
            />
            <div className="space-y-1.5">
              <Label htmlFor="p-category">Categoria</Label>
              <Select value={form.category} onValueChange={(v) => update("category", v)}>
                <SelectTrigger id="p-category" className="w-full border-black/10 bg-black/[0.03]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Numbers */}
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              id="p-price"
              label="Preço (R$)"
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              placeholder="699.90"
            />
            <TextField
              id="p-stock"
              label="Estoque"
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => update("stock", e.target.value)}
            />
            <TextField
              id="p-rating"
              label="Avaliação (0–5)"
              type="number"
              min={0}
              max={5}
              step="0.1"
              value={form.rating}
              onChange={(e) => update("rating", e.target.value)}
            />
          </div>

          {/* Accent + Badge */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Cor de destaque</Label>
              <div className="flex flex-wrap items-center gap-2">
                {ACCENT_PRESETS.map((a) => {
                  const active = form.accent.toLowerCase() === a.value.toLowerCase();
                  return (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => update("accent", a.value)}
                      title={a.name}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 transition-transform",
                        active ? "scale-110 border-white" : "border-black/15 hover:scale-105",
                      )}
                      style={{ background: a.value }}
                    />
                  );
                })}
                <label className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full border-2 border-black/15">
                  <span className="block h-full w-full" style={{ background: form.accent }} />
                  <input
                    type="color"
                    value={form.accent}
                    onChange={(e) => update("accent", e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label="Cor personalizada"
                  />
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Selo</Label>
              <Select value={form.badge} onValueChange={(v) => update("badge", v)}>
                <SelectTrigger className="w-full border-black/10 bg-black/[0.03]">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  {BADGE_OPTIONS.map((b) => (
                    <SelectItem key={b.value || "none"} value={b.value || "__none__"}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Tamanhos disponíveis</Label>
              {form.sizes.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    // Distribute global stock evenly across selected sizes.
                    const total = parseInt(form.stock || "0", 10) || 0;
                    const per = Math.floor(total / form.sizes.length);
                    const rem = total - per * form.sizes.length;
                    const next: Record<string, string> = {};
                    form.sizes.forEach((s, i) => {
                      next[String(s)] = String(per + (i < rem ? 1 : 0));
                    });
                    setForm((f) => ({ ...f, sizeStock: next }));
                  }}
                  className="text-[11px] font-medium text-[var(--brand)] transition hover:underline"
                >
                  Distribuir estoque
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_SIZES.map((s) => {
                const active = form.sizes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(s)}
                    className={cn(
                      "h-9 w-11 rounded-lg border text-sm font-medium transition-colors",
                      active
                        ? "border-[var(--brand)] bg-[var(--brand)]/15 text-[var(--brand)]"
                        : "border-black/10 bg-black/[0.03] text-muted-foreground hover:bg-black/[0.06]",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Per-size stock editor */}
          {form.sizes.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-black/10 bg-black/[0.02] p-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs tracking-wider text-muted-foreground uppercase">Estoque por tamanho</Label>
                <span className="text-[11px] text-muted-foreground">
                  Total:{" "}
                  <span className="font-semibold text-foreground">
                    {form.sizes.reduce((acc, s) => acc + (parseInt(form.sizeStock[String(s)] || "0", 10) || 0), 0)}
                  </span>{" "}
                  / Estoque global: {form.stock || "0"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {form.sizes.map((s) => {
                  const val = form.sizeStock[String(s)] ?? "";
                  const num = parseInt(val || "0", 10) || 0;
                  return (
                    <div
                      key={s}
                      className="flex flex-col items-center gap-1 rounded-xl border border-black/5 bg-black/[0.02] p-2"
                    >
                      <span className="text-xs font-bold text-muted-foreground">Tam {s}</span>
                      <input
                        type="number"
                        min={0}
                        value={val}
                        onChange={(e) => setSizeStock(s, e.target.value)}
                        className={cn(
                          "h-9 w-full rounded-lg border bg-black/[0.03] px-2 text-center text-sm font-semibold transition outline-none focus:border-[var(--brand)]",
                          num === 0
                            ? "border-rose-500/40 text-rose-700"
                            : num <= 2
                              ? "border-amber-500/40 text-amber-700"
                              : "border-black/10 text-foreground",
                        )}
                        placeholder="0"
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Deixe vazio para usar o estoque global. Tamanhos com 0 ficam indisponíveis na loja.
              </p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Descrição</Label>
            <Textarea
              id="p-desc"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Conte a história do drop, materiais e tecnologia..."
              className="min-h-24 border-black/10 bg-black/[0.03]"
            />
          </div>

          {/* Images */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-[var(--brand)]" />
                Imagens do produto
              </Label>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  form.images.length >= MAX_PRODUCT_IMAGES
                    ? "bg-[var(--hot)]/15 text-[var(--hot)]"
                    : "bg-black/[0.03] text-muted-foreground",
                )}
              >
                {form.images.length}/{MAX_PRODUCT_IMAGES}
              </span>
            </div>

            {/* Drop zone */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!dragging) setDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragging(false);
                if (e.dataTransfer.files?.length) {
                  handleFiles(Array.from(e.dataTransfer.files));
                }
              }}
              className={cn(
                "group flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition",
                dragging
                  ? "border-[var(--brand)] bg-[var(--brand)]/10"
                  : "border-black/15 bg-black/[0.02] hover:border-[var(--brand)]/50 hover:bg-black/[0.024]",
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)] transition group-hover:scale-110">
                <Upload className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium">Arraste imagens aqui ou clique para selecionar</span>
              <span className="text-[11px] text-muted-foreground">
                PNG, JPG ou WEBP · até 2 MB cada · máx. {MAX_PRODUCT_IMAGES} imagens
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    handleFiles(Array.from(e.target.files));
                  }
                  e.target.value = "";
                }}
              />
            </button>

            {/* Thumbnails */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {form.images.map((src, i) => (
                  <motion.div
                    key={`${src.slice(0, 24)}-${i}`}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.18, delay: i * 0.02 }}
                    className="group relative aspect-square overflow-hidden rounded-xl border-2 border-black/10 bg-black/[0.03]"
                  >
                    {}
                    <img src={src} alt={`Imagem ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      aria-label={`Remover imagem ${i + 1}`}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/80"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* URL input */}
            <div className="space-y-1.5">
              <Label htmlFor="p-images" className="text-xs tracking-wider text-muted-foreground uppercase">
                Ou cole URLs (separadas por vírgula)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="p-images"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addUrls();
                    }
                  }}
                  placeholder={`/products/${form.slug || "slug"}.png, https://...`}
                  className="border-black/10 bg-black/[0.03] font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addUrls}
                  className="shrink-0 border-black/10 bg-black/[0.03] hover:bg-black/[0.06]"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Adicionar</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Se nenhuma imagem for enviada, usaremos <code>/products/&lt;slug&gt;.png</code>.
              </p>
            </div>
          </div>

          <Separator className="bg-black/[0.03]" />

          {/* Toggles */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-black/10 bg-black/[0.03] p-3">
              <div>
                <p className="text-sm font-medium">Destaque</p>
                <p className="text-xs text-muted-foreground">Aparece em "Novidades"</p>
              </div>
              <Switch checked={form.featured} onCheckedChange={(v) => update("featured", v)} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-black/10 bg-black/[0.03] p-3">
              <div>
                <p className="text-sm font-medium">Mais vendido</p>
                <p className="text-xs text-muted-foreground">Aparece em "Mais vendidos"</p>
              </div>
              <Switch checked={form.bestSeller} onCheckedChange={(v) => update("bestSeller", v)} />
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
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

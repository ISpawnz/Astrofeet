"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, Eye, Loader2, ShoppingCart, Star, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/client/api";
import { QuantityStepper, SizePicker } from "@/components/shared/ProductControls";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useCartStore } from "@/stores/cart";
import { useUIStore } from "@/stores/ui";
import { formatPrice } from "@/shared/format";
import { stockFor } from "@/shared/rules";
import type { Product } from "@/shared/types";

export function QuickViewModal() {
  const id = useUIStore((s) => s.quickViewProductId);
  const close = useUIStore((s) => s.closeQuickView);

  return (
    <Dialog open={id !== null} onOpenChange={(o) => !o && close()}>
      <DialogContent showCloseButton={false} className="max-h-[92vh] overflow-hidden p-0 sm:max-w-3xl">
        <DialogTitle className="sr-only">Visualização rápida</DialogTitle>
        <DialogDescription className="sr-only">Foto, preço, tamanhos e ações de compra do produto.</DialogDescription>
        <DialogClose
          aria-label="Fechar visualização"
          className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm transition hover:bg-[var(--surface)]"
        >
          <X className="h-4 w-4" />
        </DialogClose>
        {id && <QuickViewBody key={id} id={id} />}
      </DialogContent>
    </Dialog>
  );
}

function QuickViewBody({ id }: { id: string }) {
  const { data, isLoading, error } = useQuery({ queryKey: ["product", id], queryFn: () => api.product(id) });
  if (data?.product) return <ProductPreview product={data.product} />;
  return (
    <div className="grid min-h-80 place-items-center p-10 text-center text-sm text-muted-foreground">
      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin" />
      ) : (
        <p>{error instanceof Error ? error.message : "Não foi possível carregar o produto."}</p>
      )}
    </div>
  );
}

function ProductPreview({ product }: { product: Product }) {
  const navigate = useUIStore((s) => s.navigate);
  const closeQuickView = useUIStore((s) => s.closeQuickView);
  const { add, open: openCart } = useCartStore();
  const [size, setSize] = useState<number | null>(product.sizes[Math.floor(product.sizes.length / 2)] ?? null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const stock = size === null ? product.stock : stockFor(product, size);

  function handleAdd() {
    if (size === null) return toast.error("Selecione um tamanho para continuar.");
    add(product, size, qty);
    toast.success(`${product.name} adicionado ao carrinho`);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
    openCart();
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="grid max-h-[92vh] overflow-y-auto sm:grid-cols-2"
    >
      <div className="relative aspect-square bg-[var(--surface)]">
        <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
        {product.badge && (
          <span className="absolute top-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-bold shadow-sm">
            {product.badge}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 p-6">
        <div>
          <p className="text-xs text-muted-foreground">{[product.category, product.brand].join(" · ")}</p>
          <h2 className="text-2xl font-bold">{product.name}</h2>
          <p className="mt-1 flex items-center gap-1 text-xs">
            <Star className="h-3.5 w-3.5 fill-current" /> {product.rating.toFixed(1)}
            <span className="text-muted-foreground">· {product.reviewCount ?? 0} avaliações</span>
          </p>
        </div>
        <div>
          <p className="text-2xl font-black">{formatPrice(product.price)}</p>
          <p className="text-xs text-muted-foreground">ou 10x de {formatPrice(product.price / 10)} sem juros</p>
        </div>
        <p className="line-clamp-3 text-sm text-muted-foreground">{product.description}</p>
        <SizePicker product={product} value={size} onChange={setSize} compact />
        <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, Math.min(stock, 99))} compact />
        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <button
            onClick={handleAdd}
            disabled={stock <= 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--brand)]/90 disabled:opacity-50"
          >
            {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            {stock <= 0 ? "Esgotado" : added ? "Adicionado!" : "Adicionar ao carrinho"}
          </button>
          <button
            onClick={() => {
              closeQuickView();
              navigate("product", { id: product.slug });
            }}
            className="flex items-center justify-center gap-2 rounded-full border border-foreground px-5 py-3 text-sm font-bold transition hover:bg-foreground hover:text-background"
          >
            <Eye className="h-4 w-4" /> Ver detalhes
          </button>
        </div>
      </div>
    </motion.div>
  );
}

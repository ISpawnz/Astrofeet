"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/stores/ui";
import { useWishlistStore } from "@/stores/wishlist";
import { ProductCard, cardProduct } from "./ProductCard";

export function WishlistView() {
  const { items, hydrated, clear } = useWishlistStore();
  const navigate = useUIStore((s) => s.navigate);

  function confirmClear() {
    toast("Limpar toda a sua lista de desejos?", {
      description: "Essa ação não pode ser desfeita.",
      action: { label: "Limpar", onClick: () => (clear(), toast.success("Lista limpa.")) },
      cancel: { label: "Cancelar", onClick: () => {} },
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">Lista de desejos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Os tênis que você salvou para depois.</p>
        </div>
        {hydrated && items.length > 0 && (
          <Button variant="ghost" onClick={confirmClear} className="rounded-full text-rose-700 hover:bg-rose-500/10">
            <Trash2 className="h-4 w-4" /> Limpar lista
          </Button>
        )}
      </header>

      {!hydrated ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Sua lista está vazia"
          action={
            <Button onClick={() => navigate("products")} className="rounded-full">
              Ver todos os tênis
            </Button>
          }
        >
          Toque no coração de qualquer produto para salvá-lo aqui.
        </EmptyState>
      ) : (
        <motion.div layout className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {items.map((item, i) => (
              <motion.div key={item.id} layout exit={{ opacity: 0, scale: 0.9 }}>
                <ProductCard product={cardProduct(item)} index={i} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}

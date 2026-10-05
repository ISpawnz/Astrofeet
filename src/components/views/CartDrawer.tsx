"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useCartStore } from "@/stores/cart";
import { useUIStore } from "@/stores/ui";
import { formatPrice } from "@/shared/format";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FREE_SHIPPING = 300;
const BASE_SHIPPING = 29.9;

export function CartDrawer() {
  const { items, isOpen, close, setQuantity, remove, subtotal } = useCartStore();
  const navigate = useUIStore((s) => s.navigate);

  const sub = subtotal();
  const shipping = sub === 0 || sub >= FREE_SHIPPING ? 0 : BASE_SHIPPING;
  const total = sub + shipping;
  const remaining = Math.max(0, FREE_SHIPPING - sub);
  const progress = Math.min(100, (sub / FREE_SHIPPING) * 100);

  function goCheckout() {
    close();
    navigate("checkout");
  }

  return (
    <Sheet open={isOpen} onOpenChange={(o) => (o ? null : close())}>
      <SheetContent className="flex w-full flex-col border-black/10 bg-background p-0 backdrop-blur-xl sm:max-w-md">
        <SheetHeader className="border-b border-black/10 px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="h-5 w-5 text-[var(--brand)]" />
            Seu carrinho
          </SheetTitle>
          <SheetDescription className="sr-only">
            Seu carrinho de compras com itens, quantidades e total.
          </SheetDescription>
          <p className="text-xs text-muted-foreground">
            {items.reduce((n, i) => n + i.quantity, 0)}{" "}
            {items.reduce((n, i) => n + i.quantity, 0) === 1
              ? "item"
              : "itens"}
          </p>
        </SheetHeader>

        {/* Free shipping progress */}
        {items.length > 0 && (
          <div className="border-b border-black/10 px-5 py-3">
            {remaining > 0 ? (
              <p className="mb-2 text-xs text-muted-foreground">
                Faltam{" "}
                <span className="font-semibold text-[var(--brand)]">
                  {formatPrice(remaining)}
                </span>{" "}
                para o frete grátis
              </p>
            ) : (
              <p className="mb-2 text-xs font-medium text-[var(--success)]">
                Frete grátis liberado!
              </p>
            )}
            <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
              <motion.div
                className="h-full rounded-full bg-[var(--brand)]"
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/[0.03]">
                <ShoppingBag className="h-9 w-9 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">Seu carrinho está vazio</p>
                <p className="text-sm text-muted-foreground">
                  Explore os drops e encontre seu próximo par.
                </p>
              </div>
              <button
                onClick={() => {
                  close();
                  navigate("products");
                }}
                className="mt-2 rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Explorar drops
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.li
                    key={`${item.productId}-${item.size}`}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40, height: 0 }}
                    className="flex gap-3 rounded-2xl border border-black/5 bg-black/[0.02] p-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <div
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-black/[0.03]"
                      style={{ boxShadow: `inset 0 0 20px ${item.accent}30` }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-contain p-1"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="line-clamp-1 text-sm font-semibold">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Tamanho {item.size}
                          </p>
                        </div>
                        <button
                          onClick={() => remove(item.productId, item.size)}
                          className="text-muted-foreground transition hover:text-rose-700"
                          aria-label="Remover item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-1 rounded-full border border-black/10 bg-black/[0.03]">
                          <button
                            onClick={() =>
                              setQuantity(
                                item.productId,
                                item.size,
                                item.quantity - 1,
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/[0.06]"
                            aria-label="Diminuir"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              setQuantity(
                                item.productId,
                                item.size,
                                item.quantity + 1,
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/[0.06]"
                            aria-label="Aumentar"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-bold">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-black/10 px-5 py-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(sub)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Frete</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-[var(--success)]">Grátis</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </span>
              </div>
              <div className="flex justify-between pt-2 text-base font-bold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <button
              onClick={goCheckout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand)] py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Finalizar compra
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

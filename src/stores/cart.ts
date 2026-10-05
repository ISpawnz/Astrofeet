"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, Product } from "@/shared/types";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  add: (product: Product, size: number, quantity?: number) => void;
  remove: (productId: string, size: number) => void;
  setQuantity: (productId: string, size: number, quantity: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      add: (product, size, quantity = 1) => {
        set((s) => {
          const idx = s.items.findIndex(
            (i) => i.productId === product.id && i.size === size,
          );
          if (idx >= 0) {
            const items = [...s.items];
            items[idx] = {
              ...items[idx],
              quantity: Math.min(
                items[idx].quantity + quantity,
                Math.max(product.stock, 1) || 99,
              ),
            };
            return { items, isOpen: true };
          }
          const item: CartItem = {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: product.images[0] ?? "",
            size,
            quantity,
            accent: product.accent,
          };
          return { items: [...s.items, item], isOpen: true };
        });
      },
      remove: (productId, size) =>
        set((s) => ({
          items: s.items.filter(
            (i) => !(i.productId === productId && i.size === size),
          ),
        })),
      setQuantity: (productId, size, quantity) =>
        set((s) => ({
          items: s.items
            .map((i) =>
              i.productId === productId && i.size === size
                ? { ...i, quantity: Math.max(1, Math.min(99, quantity)) }
                : i,
            )
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, i) => n + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "astrofeet-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product } from "@/lib/types";

interface WishlistItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  accent: string;
  brand: string;
  addedAt: string;
}

interface WishlistState {
  items: WishlistItem[];
  isOpen: boolean;
  hydrated: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  toggleProduct: (product: Product) => void;
  has: (id: string) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  count: () => number;
  setHydrated: (v: boolean) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      hydrated: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      toggleProduct: (product) => {
        set((s) => {
          const exists = s.items.find((i) => i.id === product.id);
          if (exists) {
            return { items: s.items.filter((i) => i.id !== product.id) };
          }
          return {
            items: [
              {
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                image: product.images[0] ?? "",
                accent: product.accent,
                brand: product.brand,
                addedAt: new Date().toISOString(),
              },
              ...s.items,
            ],
          };
        });
      },
      has: (id) => !!get().items.find((i) => i.id === id),
      remove: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
      count: () => get().items.length,
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: "astrofeet-wishlist",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

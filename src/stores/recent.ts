"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product } from "@/shared/types";

interface RecentItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  accent: string;
  brand: string;
  viewedAt: string;
}

interface RecentState {
  items: RecentItem[];
  hydrated: boolean;
  add: (product: Product) => void;
  clear: () => void;
  setHydrated: (v: boolean) => void;
}

const MAX_RECENT = 8;

export const useRecentStore = create<RecentState>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      add: (product) => {
        set((s) => {
          const without = s.items.filter((i) => i.id !== product.id);
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
                viewedAt: new Date().toISOString(),
              },
              ...without,
            ].slice(0, MAX_RECENT),
          };
        });
      },
      clear: () => set({ items: [] }),
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: "astrofeet-recent",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

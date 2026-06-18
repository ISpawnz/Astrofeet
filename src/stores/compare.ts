"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface CompareState {
  ids: string[];
  open: boolean;
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  count: () => number;
}

const MAX_COMPARE = 4;

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      open: false,
      add: (id) =>
        set((s) => {
          if (s.ids.includes(id)) return s;
          if (s.ids.length >= MAX_COMPARE) return s;
          return { ids: [...s.ids, id], open: true };
        }),
      remove: (id) =>
        set((s) => ({
          ids: s.ids.filter((x) => x !== id),
          open: s.ids.filter((x) => x !== id).length === 0 ? false : s.open,
        })),
      clear: () => set({ ids: [], open: false }),
      toggle: (id) =>
        set((s) => {
          if (s.ids.includes(id)) {
            const newIds = s.ids.filter((x) => x !== id);
            return { ids: newIds, open: newIds.length === 0 ? false : s.open };
          }
          if (s.ids.length >= MAX_COMPARE) return s;
          return { ids: [...s.ids, id], open: true };
        }),
      has: (id) => get().ids.includes(id),
      openPanel: () => {
        if (get().ids.length > 0) set({ open: true });
      },
      closePanel: () => set({ open: false }),
      togglePanel: () =>
        set((s) => ({ open: s.ids.length > 0 ? !s.open : false })),
      count: () => get().ids.length,
    }),
    {
      name: "astrofeet-compare",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ ids: s.ids }),
    },
  ),
);

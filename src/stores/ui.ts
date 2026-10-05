"use client";

import { create } from "zustand";
import type { ViewName, ViewParams } from "@/shared/types";
import { fromHash, toHash } from "@/client/router";

interface UIState {
  view: ViewName;
  params: ViewParams;
  authModalOpen: boolean;
  authMode: "login" | "register";
  searchOpen: boolean;
  sizeGuideOpen: boolean;
  naveOpen: boolean;
  /** Product id (or slug) currently shown in the Quick View modal, or null. */
  quickViewProductId: string | null;
  /** Último destino foi via navegação interna (true) ou carga inicial (false). */
  navigated: boolean;
  navigate: (view: ViewName, params?: ViewParams) => void;
  /** Aplica o hash atual da URL ao estado (carga inicial e botão voltar). */
  syncFromLocation: () => void;
  openAuth: (mode?: "login" | "register") => void;
  closeAuth: () => void;
  setSearchOpen: (v: boolean) => void;
  openSizeGuide: () => void;
  closeSizeGuide: () => void;
  openNave: () => void;
  closeNave: () => void;
  openQuickView: (id: string) => void;
  closeQuickView: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  view: "home",
  params: {},
  authModalOpen: false,
  authMode: "login",
  searchOpen: false,
  sizeGuideOpen: false,
  naveOpen: false,
  quickViewProductId: null,
  navigated: false,
  navigate: (view, params = {}) => {
    set({ view, params, navigated: true });
    if (typeof window !== "undefined") {
      const hash = toHash(view, params);
      // pushState (não location.hash=) para não disparar hashchange e duplicar a navegação.
      if (window.location.hash !== hash) window.history.pushState(null, "", hash);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },
  syncFromLocation: () => {
    if (typeof window === "undefined") return;
    const { view, params } = fromHash(window.location.hash);
    set({ view, params, searchOpen: false, quickViewProductId: null });
  },
  openAuth: (mode = "login") => set({ authModalOpen: true, authMode: mode }),
  closeAuth: () => set({ authModalOpen: false }),
  setSearchOpen: (v) => set({ searchOpen: v }),
  openSizeGuide: () => set({ sizeGuideOpen: true }),
  closeSizeGuide: () => set({ sizeGuideOpen: false }),
  openNave: () => set({ naveOpen: true }),
  closeNave: () => set({ naveOpen: false }),
  openQuickView: (id) => set({ quickViewProductId: id }),
  closeQuickView: () => set({ quickViewProductId: null }),
}));

"use client";

import { create } from "zustand";
import type { ViewName, ViewParams } from "@/lib/types";

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
  navigate: (view: ViewName, params?: ViewParams) => void;
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
  navigate: (view, params = {}) => {
    set({ view, params });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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

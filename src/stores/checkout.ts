"use client";

import { create } from "zustand";
import type { Order } from "@/lib/types";

interface CheckoutState {
  lastOrder: Order | null;
  setLastOrder: (o: Order) => void;
  clear: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  lastOrder: null,
  setLastOrder: (o) => set({ lastOrder: o }),
  clear: () => set({ lastOrder: null }),
}));

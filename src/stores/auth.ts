"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PublicUser } from "@/lib/types";

interface AuthState {
  user: PublicUser | null;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  setUser: (user: PublicUser | null) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
      isAdmin: () => {
        const u = useAuthStore.getState().user;
        return u?.role === "admin";
      },
    }),
    {
      name: "astrofeet-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

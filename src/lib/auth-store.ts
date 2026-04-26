"use client";

import { create } from "zustand";

type AuthState = {
  apiKey: string | null;
};
type AuthActions = {
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  apiKey: null,
  setApiKey: (key) => set({ apiKey: key }),
  clearApiKey: () => set({ apiKey: null }),
}));

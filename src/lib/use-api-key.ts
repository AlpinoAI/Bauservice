"use client";

import { useEffect } from "react";
import { useAuthStore } from "./auth-store";

/**
 * Returns the backend API key from the auth store.
 * On first call (e.g. after page refresh), fetches it from /api/auth/session.
 * Multiple components share the same Zustand atom — only one fetch fires.
 */
export function useApiKey(): string | null {
  const apiKey = useAuthStore((s) => s.apiKey);
  const setApiKey = useAuthStore((s) => s.setApiKey);

  useEffect(() => {
    if (apiKey !== null) return;
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { apiKey: string } | null) => {
        if (data?.apiKey) setApiKey(data.apiKey);
      })
      .catch(() => {});
  }, [apiKey, setApiKey]);

  return apiKey;
}

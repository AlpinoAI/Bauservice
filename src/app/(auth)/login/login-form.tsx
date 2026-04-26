"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const data = (await res.json()) as { ok: true; apiKey: string };
      useAuthStore.getState().setApiKey(data.apiKey);
      router.replace(from);
      router.refresh();
    } else {
      setError("Passwort falsch.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <h1 className="text-lg font-semibold">Bauservice Email-Automation</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Zugang nur für Bauservice-Mitarbeiter.
      </p>

      <label className="mt-6 block">
        <span className="text-sm font-medium">Passwort</span>
        <input
          type="password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </label>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || password.length === 0}
        className="mt-4 w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Anmelden…" : "Anmelden"}
      </button>
    </form>
  );
}

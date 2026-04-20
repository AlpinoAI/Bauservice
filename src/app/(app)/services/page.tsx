"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchFilterBar, type FilterSpec } from "@/components/search-filter-bar";
import { Badge } from "@/components/ui/badge";
import { useDebounced } from "@/lib/use-debounced";
import { bezirke, serviceLabels, servicesOrder } from "@/lib/filter-options";
import type { Example, Service } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatCurrency(value?: number): string | null {
  if (typeof value !== "number") return null;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function betragOf(it: Example): number | undefined {
  if ("betrag" in it) return it.betrag;
  return undefined;
}

export default function ServicesPage() {
  const [service, setService] = useState<Service>("ausschreibungen");
  const [query, setQuery] = useState("");
  const [bezirk, setBezirk] = useState("");
  const [items, setItems] = useState<Example[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounced(query, 200);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      const params = new URLSearchParams({ service });
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (bezirk) params.set("bezirk", bezirk);
      params.set("limit", "100");
      try {
        const res = await fetch(`/api/dummy/sql/items?${params}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items: Example[] };
        setItems(data.items);
      } catch {
        // abort
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [service, debouncedQuery, bezirk]);

  const filters: FilterSpec[] = useMemo(
    () => [
      {
        name: "bezirk",
        label: "Bezirk",
        value: bezirk,
        onChange: setBezirk,
        options: bezirke.map((b) => ({ value: b, label: b })),
      },
    ],
    [bezirk]
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Services</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Read-only Listing aller vier Service-Quellen. Service oben wählen,
          dann filtern und durchsuchen.
        </p>
      </header>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-1">
        {servicesOrder.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setService(s)}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition",
              service === s
                ? "bg-blue-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            )}
            aria-pressed={service === s}
          >
            {serviceLabels[s]}
          </button>
        ))}
      </div>

      <SearchFilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder={`In ${serviceLabels[service]} suchen…`}
        filters={filters}
        totalCount={items.length}
        totalLabel="Einträge"
      />

      <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-100 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2 text-left">Datum</th>
              <th className="px-4 py-2 text-left">Bezirk</th>
              <th className="px-4 py-2 text-left">Gewerk</th>
              <th className="px-4 py-2 text-left">Beschreibung</th>
              <th className="px-4 py-2 text-right">Betrag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  Lade …
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  Keine Einträge gefunden.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="transition hover:bg-zinc-50">
                  <td className="px-4 py-2.5 text-xs text-zinc-500 align-top whitespace-nowrap">
                    {it.datum ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 align-top whitespace-nowrap">
                    {it.bezirk ? (
                      <Badge variant="neutral">{it.bezirk}</Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2.5 align-top whitespace-nowrap">
                    {it.gewerk ? <Badge variant="blue">{it.gewerk}</Badge> : "—"}
                  </td>
                  <td className="px-4 py-2.5 align-top text-zinc-800">
                    {it.beschreibungDe}
                  </td>
                  <td className="px-4 py-2.5 text-right align-top font-medium whitespace-nowrap">
                    {formatCurrency(betragOf(it)) ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchFilterBar, type FilterSpec } from "./search-filter-bar";
import { useDebounced } from "@/lib/use-debounced";
import type { Example, Service } from "@/lib/types";
import { bezirke, serviceLabels, servicesOrder } from "@/lib/filter-options";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Selection = { service: Service; itemId: number };

type Props = {
  selected?: Selection | null;
  onSelectionChange?: (selection: Selection | null) => void;
};

export function ItemPicker({ selected = null, onSelectionChange }: Props) {
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
      try {
        const res = await fetch(`/api/dummy/sql/items?${params}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items: Example[] };
        setItems(data.items);
      } catch {
        // aborted
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
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-1">
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

      <div className="rounded-lg border border-zinc-200 bg-white">
        {loading && items.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            Lade…
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            Keine Einträge gefunden.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {items.map((it) => {
              const isSelected =
                selected?.service === service && selected?.itemId === it.id;
              return (
                <li
                  key={it.id}
                  className={cn(
                    "cursor-pointer px-4 py-3 text-sm transition",
                    isSelected ? "bg-blue-50" : "hover:bg-zinc-50"
                  )}
                  onClick={() =>
                    onSelectionChange?.(
                      isSelected ? null : { service, itemId: it.id }
                    )
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {it.datum && (
                          <span className="text-xs text-zinc-500">{it.datum}</span>
                        )}
                        {it.bezirk && <Badge variant="neutral">{it.bezirk}</Badge>}
                        {it.gewerk && <Badge variant="blue">{it.gewerk}</Badge>}
                      </div>
                      <p className="mt-1 text-zinc-900">{it.beschreibungDe}</p>
                    </div>
                    {isSelected && (
                      <Badge variant="green" className="shrink-0">
                        ausgewählt
                      </Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

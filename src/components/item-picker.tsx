"use client";

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { SearchFilterBar, type FilterSpec } from "./search-filter-bar";
import { useDebounced } from "@/lib/use-debounced";
import type { Example, Service } from "@/lib/types";
import {
  bezirke,
  gewerke,
  serviceLabels,
  servicesOrder,
} from "@/lib/filter-options";
import { Badge } from "@/components/ui/badge";
import {
  betragOf,
  formatCurrency,
  issuerFor,
  refNumberFor,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type Selection = { service: Service; itemId: number };

type Props = {
  selected?: Selection | null;
  onSelectionChange?: (selection: Selection | null) => void;
};

const gridCols =
  "grid-cols-[28px_minmax(80px,100px)_minmax(80px,110px)_minmax(70px,90px)_minmax(110px,140px)_minmax(140px,180px)_minmax(90px,110px)_minmax(260px,1fr)]";

export function ItemPicker({ selected = null, onSelectionChange }: Props) {
  const [service, setService] = useState<Service>("ausschreibungen");
  const [query, setQuery] = useState("");
  const [bezirk, setBezirk] = useState("");
  const [gewerk, setGewerk] = useState("");
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
      if (gewerk) params.set("gewerk", gewerk);
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
  }, [service, debouncedQuery, bezirk, gewerk]);

  const filters: FilterSpec[] = useMemo(
    () => [
      {
        name: "bezirk",
        label: "Bezirk",
        value: bezirk,
        onChange: setBezirk,
        options: bezirke.map((b) => ({ value: b, label: b })),
      },
      {
        name: "gewerk",
        label: "Gewerk",
        value: gewerk,
        onChange: setGewerk,
        options: gewerke.map((g) => ({ value: g, label: g })),
      },
    ],
    [bezirk, gewerk]
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

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <div
          className={cn(
            "grid items-center gap-3 border-b border-zinc-100 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500",
            gridCols
          )}
        >
          <div />
          <div>Datum</div>
          <div>Nummer</div>
          <div>Bezirk</div>
          <div>Gewerk</div>
          <div>Auftraggeber</div>
          <div>Betrag</div>
          <div>Beschreibung</div>
        </div>

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
              const issuer = issuerFor(it);
              const ref = refNumberFor(it);
              const betrag = formatCurrency(betragOf(it));
              return (
                <li
                  key={it.id}
                  className={cn(
                    "grid cursor-pointer items-center gap-3 px-4 py-3 text-sm transition",
                    gridCols,
                    isSelected ? "bg-blue-50" : "hover:bg-zinc-50"
                  )}
                  onClick={() =>
                    onSelectionChange?.(
                      isSelected ? null : { service, itemId: it.id }
                    )
                  }
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border transition",
                      isSelected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-zinc-300 bg-white"
                    )}
                    aria-hidden
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {it.datum ?? "—"}
                  </span>
                  <span className="text-xs font-medium text-zinc-700">
                    {ref ?? "—"}
                  </span>
                  <span className="truncate text-xs text-zinc-700">
                    {it.bezirk ?? "—"}
                  </span>
                  <span>
                    {it.gewerk ? (
                      <Badge variant="blue">{it.gewerk}</Badge>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </span>
                  <span className="truncate text-xs text-zinc-600" title={issuer}>
                    {issuer ?? "—"}
                  </span>
                  <span className="text-xs font-medium tabular-nums text-zinc-700">
                    {betrag ?? "—"}
                  </span>
                  <span className="truncate text-zinc-900" title={it.beschreibungDe}>
                    {it.beschreibungDe}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

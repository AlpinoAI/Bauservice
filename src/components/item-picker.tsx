"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchFilterBar, type FilterSpec } from "./search-filter-bar";
import {
  AusschreibungenTable,
  BeschluesseTable,
  ErgebnisseTable,
  KonzessionenTable,
} from "@/components/services/service-tables";
import { useDebounced } from "@/lib/use-debounced";
import type {
  AusschreibungExample,
  BeschlussExample,
  ErgebnisExample,
  Example,
  KonzessionExample,
  Service,
} from "@/lib/types";
import {
  bezirke,
  gewerke,
  serviceLabels,
  servicesOrder,
} from "@/lib/filter-options";
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
  const [gewerk, setGewerk] = useState("");
  const [jahr, setJahr] = useState("");
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
      if (jahr) params.set("jahr", jahr);
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
  }, [service, debouncedQuery, bezirk, gewerk, jahr]);

  const jahrOptions = useMemo(() => {
    const years = new Set<string>();
    for (const it of items) {
      const y = it.datum?.slice(0, 4);
      if (y && /^\d{4}$/.test(y)) years.add(y);
    }
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [items]);

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
      ...(jahrOptions.length > 0
        ? [
            {
              name: "jahr",
              label: "Jahr",
              value: jahr,
              onChange: setJahr,
              options: jahrOptions.map((y) => ({ value: y, label: y })),
            },
          ]
        : []),
    ],
    [bezirk, gewerk, jahr, jahrOptions]
  );

  const selectedId =
    selected?.service === service ? selected.itemId : null;

  function onSelect(it: Example) {
    onSelectionChange?.(
      selectedId === it.id ? null : { service, itemId: it.id }
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-1">
        {servicesOrder.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setService(s);
              setGewerk("");
              setJahr("");
            }}
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
        {service === "ausschreibungen" && (
          <AusschreibungenTable
            items={items as AusschreibungExample[]}
            loading={loading}
            selectable
            selectedId={selectedId}
            onSelect={onSelect}
          />
        )}
        {service === "ergebnisse" && (
          <ErgebnisseTable
            items={items as ErgebnisExample[]}
            loading={loading}
            selectable
            selectedId={selectedId}
            onSelect={onSelect}
          />
        )}
        {service === "beschluesse" && (
          <BeschluesseTable
            items={items as BeschlussExample[]}
            loading={loading}
            selectable
            selectedId={selectedId}
            onSelect={onSelect}
          />
        )}
        {service === "baukonzessionen" && (
          <KonzessionenTable
            items={items as KonzessionExample[]}
            loading={loading}
            selectable
            selectedId={selectedId}
            onSelect={onSelect}
          />
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
import { useApiKey } from "@/lib/use-api-key";
import {
  searchTenders,
  searchResults,
  searchProjects,
  searchConcessions,
} from "@/lib/items-client";
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
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounced(query, 200);
  const apiKey = useApiKey();

  const PAGE_SIZE = 10;

  // Reset to first page whenever filters or service change
  useEffect(() => {
    setPage(0);
  }, [service, debouncedQuery, bezirk, gewerk, jahr]);

  useEffect(() => {
    if (!apiKey) return;
    const ctrl = new AbortController();
    const params = { q: debouncedQuery || undefined, bezirk: bezirk || undefined, gewerk: gewerk || undefined, jahr: jahr || undefined, page, limit: PAGE_SIZE };
    (async () => {
      setLoading(true);
      try {
        const fn =
          service === "ausschreibungen" ? searchTenders :
          service === "ergebnisse" ? searchResults :
          service === "beschluesse" ? searchProjects :
          searchConcessions;
        const data = await fn(params, apiKey, ctrl.signal);
        setItems(data.items);
        setTotal(data.total);
      } catch {
        // aborted
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [service, debouncedQuery, bezirk, gewerk, jahr, page, apiKey]);

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
        totalCount={total}
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
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600">
          <span>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} von {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0 || loading}
              className="rounded p-1 transition hover:bg-zinc-100 disabled:opacity-40"
              aria-label="Vorherige Seite"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[60px] text-center text-xs">
              Seite {page + 1} / {Math.ceil(total / PAGE_SIZE)}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= total || loading}
              className="rounded p-1 transition hover:bg-zinc-100 disabled:opacity-40"
              aria-label="Nächste Seite"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

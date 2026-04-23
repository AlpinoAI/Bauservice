"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchFilterBar, type FilterSpec } from "@/components/search-filter-bar";
import { ServiceDetailSheet } from "@/components/services/service-detail-sheet";
import {
  AusschreibungenTable,
  BeschluesseTable,
  ErgebnisseTable,
  KonzessionenTable,
} from "@/components/services/service-tables";
import { useDebounced } from "@/lib/use-debounced";
import {
  bezirke,
  gewerke,
  serviceLabels,
  servicesOrder,
} from "@/lib/filter-options";
import { useStartCampaign } from "@/lib/use-start-campaign";
import type {
  AusschreibungExample,
  BeschlussExample,
  ErgebnisExample,
  Example,
  KonzessionExample,
  Service,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ServicesPage() {
  const [service, setService] = useState<Service>("ausschreibungen");
  const [query, setQuery] = useState("");
  const [bezirk, setBezirk] = useState("");
  const [gewerk, setGewerk] = useState("");
  const [jahr, setJahr] = useState("");
  const [items, setItems] = useState<Example[]>([]);
  const [loading, setLoading] = useState(false);
  const { start, startingId } = useStartCampaign();
  const starting = typeof startingId === "number" ? startingId : null;
  const [detailItem, setDetailItem] = useState<Example | null>(null);
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

  function startCampaign(it: Example) {
    void start(it.id, {
      name: `${serviceLabels[service]} · ${it.datum ?? ""} · ID ${it.id}`,
      origin: "item",
      itemRef: { service, itemId: it.id },
    });
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-8 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Services</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Alle vier Service-Quellen in einer Tabelle. Pro Zeile kannst du eine
          Kampagne auf Basis des Eintrags starten — Empfänger kommen
          automatisch aus dem Matching.
        </p>
      </header>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-1">
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

      <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        {service === "ausschreibungen" && (
          <AusschreibungenTable
            items={items as AusschreibungExample[]}
            loading={loading}
            starting={starting}
            onStart={startCampaign}
            onDetail={setDetailItem}
          />
        )}
        {service === "ergebnisse" && (
          <ErgebnisseTable
            items={items as ErgebnisExample[]}
            loading={loading}
            starting={starting}
            onStart={startCampaign}
            onDetail={setDetailItem}
          />
        )}
        {service === "beschluesse" && (
          <BeschluesseTable
            items={items as BeschlussExample[]}
            loading={loading}
            starting={starting}
            onStart={startCampaign}
            onDetail={setDetailItem}
          />
        )}
        {service === "baukonzessionen" && (
          <KonzessionenTable
            items={items as KonzessionExample[]}
            loading={loading}
            starting={starting}
            onStart={startCampaign}
            onDetail={setDetailItem}
          />
        )}
      </div>

      <ServiceDetailSheet
        open={detailItem !== null}
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onStartCampaign={(it) => {
          setDetailItem(null);
          startCampaign(it);
        }}
        starting={starting !== null}
      />
    </main>
  );
}

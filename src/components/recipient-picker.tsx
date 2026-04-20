"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { SearchFilterBar, type FilterSpec } from "./search-filter-bar";
import { useDebounced } from "@/lib/use-debounced";
import type { Recipient, RecipientSegment } from "@/lib/types";
import { bezirke, rollenOptions } from "@/lib/filter-options";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  mode?: "select" | "browse";
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
};

export function RecipientPicker({
  mode = "select",
  selectedIds = [],
  onSelectionChange,
}: Props) {
  const [query, setQuery] = useState("");
  const [bezirk, setBezirk] = useState("");
  const [rolle, setRolle] = useState("");
  const [segment, setSegment] = useState<RecipientSegment>("alle");
  const [items, setItems] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounced(query, 200);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (bezirk) params.set("bezirk", bezirk);
      if (rolle) params.set("rolle", rolle);
      params.set("segment", segment);
      try {
        const res = await fetch(`/api/dummy/sql/recipients?${params}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items: Recipient[] };
        setItems(data.items);
      } catch {
        // AbortError ignorieren
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [debouncedQuery, bezirk, rolle, segment]);

  function toggle(id: number) {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  }

  const filters: FilterSpec[] = [
    {
      name: "bezirk",
      label: "Bezirk",
      value: bezirk,
      onChange: setBezirk,
      options: bezirke.map((b) => ({ value: b, label: b })),
    },
    {
      name: "rolle",
      label: "Rolle",
      value: rolle,
      onChange: setRolle,
      options: rollenOptions.map((r) => ({ value: r.value, label: r.label })),
    },
  ];

  return (
    <div className="space-y-4">
      <SearchFilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Name, Firma oder Email suchen…"
        filters={filters}
        totalCount={items.length}
        totalLabel="Empfänger"
        leading={<SegmentToggle value={segment} onChange={setSegment} />}
      />

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 border-b border-zinc-100 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          {mode === "select" && <div className="w-5" />}
          <div>Name</div>
          <div>Bezirk</div>
          <div>Sprache</div>
          <div>Rolle</div>
        </div>

        {loading && items.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            Lade…
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            Keine Empfänger gefunden. Prüfe Filter oder Suchbegriff.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {items.map((r) => {
              const selected = selectedIds.includes(r.id);
              return (
                <li
                  key={r.id}
                  className={cn(
                    "grid cursor-pointer grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-3 text-sm transition",
                    selected ? "bg-blue-50" : "hover:bg-zinc-50"
                  )}
                  onClick={() => mode === "select" && toggle(r.id)}
                >
                  {mode === "select" && (
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border transition",
                        selected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-zinc-300 bg-white"
                      )}
                      aria-hidden
                    >
                      {selected && <Check size={14} strokeWidth={3} />}
                    </span>
                  )}
                  <div>
                    <div className="font-medium text-zinc-900">
                      {r.sprache === "it" ? r.nameIt : r.nameDe}
                    </div>
                    <div className="text-xs text-zinc-500">{r.email}</div>
                  </div>
                  <div className="text-zinc-700">{r.bezirkDe ?? "—"}</div>
                  <div className="uppercase text-zinc-500">{r.sprache}</div>
                  <div className="flex gap-1">
                    {r.rollen.anbieter && <Badge variant="blue">Anbieter</Badge>}
                    {r.rollen.kunde && <Badge variant="green">Kunde</Badge>}
                    {r.rollen.ausschreiber && (
                      <Badge variant="amber">Ausscheiber</Badge>
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

function SegmentToggle({
  value,
  onChange,
}: {
  value: RecipientSegment;
  onChange: (v: RecipientSegment) => void;
}) {
  const options: { value: RecipientSegment; label: string }[] = [
    { value: "alle", label: "Alle" },
    { value: "neu", label: "Neu" },
    { value: "bestand", label: "Bestand" },
  ];
  return (
    <div
      className="inline-flex rounded-md border border-zinc-200 p-0.5"
      role="tablist"
      aria-label="Empfänger-Segment"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded px-3 py-1.5 text-xs font-medium transition",
            value === o.value
              ? "bg-blue-600 text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

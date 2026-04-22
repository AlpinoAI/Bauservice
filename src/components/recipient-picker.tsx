"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { SearchFilterBar, type FilterSpec } from "./search-filter-bar";
import { RecipientDetailSheet } from "./recipient-detail-sheet";
import { RollenBadges } from "./rollen-badges";
import { useDebounced } from "@/lib/use-debounced";
import type { Recipient, RecipientSegment } from "@/lib/types";
import { bezirke, rollenOptions } from "@/lib/filter-options";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  mode?: "select" | "browse";
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
  onStartCampaign?: (recipient: Recipient) => void | Promise<void>;
  startingId?: number | null;
};

export function RecipientPicker({
  mode = "select",
  selectedIds = [],
  onSelectionChange,
  onStartCampaign,
  startingId = null,
}: Props) {
  const [query, setQuery] = useState("");
  const [bezirk, setBezirk] = useState("");
  const [rolle, setRolle] = useState("");
  const [segment, setSegment] = useState<RecipientSegment>("alle");
  const [items, setItems] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailRecipient, setDetailRecipient] = useState<Recipient | null>(null);

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

  // Feste Spaltenbreiten statt `auto`, damit leere Zellen (kein Bezirk, keine
  // Gewerke) die Ausrichtung nicht verschieben.
  const gridCols =
    mode === "select"
      ? "grid-cols-[auto_minmax(0,1fr)_180px_170px_48px_200px]"
      : onStartCampaign
        ? "grid-cols-[minmax(0,1fr)_180px_170px_48px_200px_auto]"
        : "grid-cols-[minmax(0,1fr)_180px_170px_48px_200px]";

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

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <div
          className={cn(
            "grid items-center gap-4 border-b border-zinc-100 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500",
            gridCols
          )}
        >
          {mode === "select" && <div className="w-5" />}
          <div>Name</div>
          <div>Gemeinde / Bezirk</div>
          <div>Gewerke</div>
          <div className="text-center">Sprache</div>
          <div>Rollen</div>
          {mode === "browse" && onStartCampaign && <div />}
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
              const displayName = r.sprache === "it" ? r.nameIt : r.nameDe;
              const ap = r.ansprechpartner;
              const apLine = ap
                ? [ap.titel, ap.vorname, ap.nachname].filter(Boolean).join(" ")
                : null;
              const locationLine = r.gemeindeDe ?? r.bezirkDe ?? null;
              const bezirkBelow =
                r.gemeindeDe && r.bezirkDe ? r.bezirkDe : null;
              const gewerke = r.gewerke ?? [];

              return (
                <li
                  key={r.id}
                  className={cn(
                    "grid items-center gap-4 px-4 py-3 text-sm transition",
                    gridCols,
                    selected ? "bg-blue-50" : "hover:bg-zinc-50",
                    mode === "select" && "cursor-pointer"
                  )}
                  onClick={() => {
                    if (mode === "select") {
                      toggle(r.id);
                    } else {
                      setDetailRecipient(r);
                    }
                  }}
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
                  <div className="min-w-0">
                    <div className="truncate font-medium text-zinc-900">
                      {displayName}
                    </div>
                    {apLine ? (
                      <div className="truncate text-xs text-zinc-600">
                        {apLine}
                      </div>
                    ) : (
                      <div className="truncate text-xs text-zinc-400">
                        {r.email}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 text-zinc-700">
                    {locationLine ? (
                      <>
                        <div className="truncate">{locationLine}</div>
                        {bezirkBelow && (
                          <div className="truncate text-xs text-zinc-500">
                            {bezirkBelow}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {gewerke.length === 0 ? (
                      <span className="text-zinc-400">—</span>
                    ) : (
                      <>
                        {gewerke.slice(0, 2).map((g) => (
                          <Badge key={g} variant="neutral">
                            {g}
                          </Badge>
                        ))}
                        {gewerke.length > 2 && (
                          <Badge variant="gray">+{gewerke.length - 2}</Badge>
                        )}
                      </>
                    )}
                  </div>
                  <div className="text-center uppercase text-zinc-500">
                    {r.sprache}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <RollenBadges rollen={r.rollen} />
                  </div>
                  {mode === "browse" && onStartCampaign && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void onStartCampaign(r);
                      }}
                      disabled={startingId !== null}
                      className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {startingId === r.id
                        ? "Lege an …"
                        : "Kampagne starten"}
                      {startingId !== r.id && <ArrowRight size={12} />}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {mode === "browse" && (
        <RecipientDetailSheet
          open={detailRecipient !== null}
          recipient={detailRecipient}
          onClose={() => setDetailRecipient(null)}
          onStartCampaign={
            onStartCampaign
              ? (r) => {
                  setDetailRecipient(null);
                  void onStartCampaign(r);
                }
              : undefined
          }
          starting={startingId === detailRecipient?.id}
        />
      )}
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

"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { SearchFilterBar, type FilterSpec } from "./search-filter-bar";
import { RecipientDetailSheet } from "./recipient-detail-sheet";
import { RollenBadges } from "./rollen-badges";
import { useDebounced } from "@/lib/use-debounced";
import type { Recipient, RecipientSegment } from "@/lib/types";
import { bezirke, gewerke, rollenOptions } from "@/lib/filter-options";
import { Badge } from "@/components/ui/badge";
import { ansprechpartnerLabel, isBestandskunde } from "@/lib/format";
import { cn } from "@/lib/utils";
import { searchContacts } from "@/lib/contacts-client";
import { useApiKey } from "@/lib/use-api-key";

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
  const [gewerk, setGewerk] = useState("");
  const [segment, setSegment] = useState<RecipientSegment>("alle");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<Recipient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detailRecipient, setDetailRecipient] = useState<Recipient | null>(null);

  const PAGE_SIZE = 10;
  const debouncedQuery = useDebounced(query, 200);
  const apiKey = useApiKey();

  // Reset page when debouncedQuery changes (ref avoids firing on first mount)
  const prevDebouncedQuery = useRef(debouncedQuery);
  useEffect(() => {
    if (debouncedQuery !== prevDebouncedQuery.current) {
      prevDebouncedQuery.current = debouncedQuery;
      setPage(0);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    if (!apiKey) return;
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const data = await searchContacts(
          { q: debouncedQuery || undefined, bezirk: bezirk || undefined, rolle: rolle || undefined, gewerk: gewerk || undefined, segment, page, limit: PAGE_SIZE },
          apiKey,
          ctrl.signal
        );
        setItems(data.items);
        setTotal(data.total);
        setLoading(false);
      } catch (err) {
        if (!(err instanceof Error && err.name === "AbortError")) {
          setLoading(false);
        }
        // AbortError: new request already in flight, leave loading state as-is
      }
    })();
    return () => ctrl.abort();
  }, [apiKey, debouncedQuery, bezirk, rolle, gewerk, segment, page]);

  // Im Kampagnen-Flow (select) nur potenzielle Empfänger von Werbe-Emails —
  // reine Ausschreiber (Gemeinden/öffentliche Stellen ohne Anbieter- oder
  // Kunden-Rolle) sind keine Zielgruppe und werden hier ausgeblendet.
  const visibleItems =
    mode === "select"
      ? items.filter((r) => r.rollen.anbieter || r.rollen.kunde)
      : items;

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
      onChange: (v) => { setBezirk(v); setPage(0); },
      options: bezirke.map((b) => ({ value: b, label: b })),
    },
    {
      name: "gewerk",
      label: "Gewerk",
      value: gewerk,
      onChange: (v) => { setGewerk(v); setPage(0); },
      options: gewerke.map((g) => ({ value: g, label: g })),
    },
    ...(mode === "browse"
      ? [
          {
            name: "rolle",
            label: "Rolle",
            value: rolle,
            onChange: (v: string) => { setRolle(v); setPage(0); },
            options: rollenOptions.map((r) => ({
              value: r.value,
              label: r.label,
            })),
          },
        ]
      : []),
  ];

  const colCount =
    5 +
    (mode === "select" ? 1 : 0) +
    (mode === "browse" && onStartCampaign ? 1 : 0);

  return (
    <div className="space-y-4">
      <SearchFilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Name, Firma oder Email suchen…"
        filters={filters}
        totalCount={total}
        totalLabel="Empfänger"
        leading={<SegmentToggle value={segment} onChange={(v) => { setSegment(v); setPage(0); }} />}
      />

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full table-fixed text-sm">
          <thead className="border-b border-zinc-100 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            <tr>
              {mode === "select" && <th className="w-10 px-3 py-2" />}
              <th className="px-3 py-2 text-left">Name / Ansprechpartner</th>
              <th className="w-[76px] px-3 py-2 text-left">Typ</th>
              <th className="w-[150px] px-3 py-2 text-left">
                Gemeinde / Bezirk
              </th>
              <th className="w-[140px] px-3 py-2 text-left">Gewerke</th>
              <th className="w-[110px] px-3 py-2 text-left">Rollen</th>
              {mode === "browse" && onStartCampaign && (
                <th className="w-[110px] px-3 py-2" />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading && visibleItems.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-4 py-10 text-center text-sm text-zinc-500"
                >
                  Lade…
                </td>
              </tr>
            ) : visibleItems.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-4 py-10 text-center text-sm text-zinc-500"
                >
                  Keine Empfänger gefunden. Prüfe Filter oder Suchbegriff.
                </td>
              </tr>
            ) : (
              visibleItems.map((r) => {
                const selected = selectedIds.includes(r.id);
                const displayName = r.sprache === "it" ? r.nameIt : r.nameDe;
                const apLine = ansprechpartnerLabel(r.ansprechpartner);
                const bestand = isBestandskunde(r);
                const locationLine = r.gemeindeDe ?? r.bezirkDe ?? null;
                const bezirkBelow =
                  r.gemeindeDe && r.bezirkDe ? r.bezirkDe : null;
                const rGewerke = r.gewerke ?? [];

                return (
                  <tr
                    key={r.id}
                    className={cn(
                      "align-top transition",
                      selected ? "bg-blue-50" : "hover:bg-zinc-50",
                      (mode === "select" || mode === "browse") &&
                        "cursor-pointer"
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
                      <td className="px-3 py-3">
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
                      </td>
                    )}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium text-zinc-900">
                          {displayName}
                        </span>
                        <span className="shrink-0 rounded bg-zinc-100 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
                          {r.sprache}
                        </span>
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
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={bestand ? "green" : "blue"}>
                        {bestand ? "Bestand" : "Neu"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-zinc-700">
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
                    </td>
                    <td className="px-3 py-3">
                      {rGewerke.length === 0 ? (
                        <span className="text-zinc-400">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {rGewerke.slice(0, 2).map((g) => (
                            <Badge key={g} variant="neutral">
                              {g}
                            </Badge>
                          ))}
                          {rGewerke.length > 2 && (
                            <Badge variant="gray">
                              +{rGewerke.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        <RollenBadges rollen={r.rollen} variant="compact" />
                      </div>
                    </td>
                    {mode === "browse" && onStartCampaign && (
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void onStartCampaign(r);
                          }}
                          disabled={startingId !== null}
                          title="Kampagne starten"
                          className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                        >
                          {startingId === r.id ? "Lege an…" : "Starten"}
                          {startingId !== r.id && <ArrowRight size={12} />}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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

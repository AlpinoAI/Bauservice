"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import type {
  Campaign,
  Recipient,
  WithScore,
} from "@/lib/types";
import { useCampaignStore } from "@/lib/campaign-store";
import { buildDraftForRecipient } from "@/lib/build-draft-for-recipient";
import { serviceLabels } from "@/lib/filter-options";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBar } from "@/components/ui/score-bar";
import { useDebounced } from "@/lib/use-debounced";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  campaign: Campaign;
  onClose: () => void;
};

export function RecipientSwapSheet({ open, campaign, onClose }: Props) {
  const existingDrafts = useCampaignStore((s) => s.drafts);
  const [matches, setMatches] = useState<WithScore<Recipient>[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const debouncedSearch = useDebounced(search, 200);

  useEffect(() => {
    if (!open || campaign.origin !== "item" || !campaign.itemRef) return;
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/dummy/matching/recipients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service: campaign.itemRef!.service,
            itemId: campaign.itemRef!.itemId,
            n: 40,
          }),
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items: WithScore<Recipient>[] };
        setMatches(data.items);
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [open, campaign]);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    (async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      params.set("limit", "30");
      try {
        const res = await fetch(`/api/dummy/sql/recipients?${params}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items: Recipient[] };
        setSearchResults(data.items);
      } catch {
        // ignore
      }
    })();
    return () => ctrl.abort();
  }, [open, debouncedSearch]);

  const existingIds = useMemo(
    () => new Set(Object.keys(existingDrafts).map((n) => Number(n))),
    [existingDrafts]
  );

  const matchesFiltered = useMemo(() => {
    if (!debouncedSearch) return matches;
    const q = debouncedSearch.toLowerCase();
    return matches.filter(
      (r) =>
        r.nameDe.toLowerCase().includes(q) ||
        r.nameIt.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
    );
  }, [matches, debouncedSearch]);

  const searchOnly = useMemo(() => {
    const matchIds = new Set(matches.map((m) => m.id));
    return searchResults.filter((r) => !matchIds.has(r.id));
  }, [matches, searchResults]);

  async function addRecipient(r: Recipient) {
    if (existingIds.has(r.id)) return;
    setAddingId(r.id);
    try {
      const pinnedItem = campaign.itemRef
        ? useCampaignStore
            .getState()
            .examplesByService[campaign.itemRef.service].find(
              (e) => e.id === campaign.itemRef!.itemId
            )
        : undefined;
      const { draft, matching } = await buildDraftForRecipient(
        r,
        campaign.itemRef,
        pinnedItem
      );
      const api = useCampaignStore.getState();
      for (const { service, items } of matching) {
        api.addToPool(service, items);
      }
      api.addDraft(draft);
    } finally {
      setAddingId(null);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex" aria-modal role="dialog">
      <div
        className="flex-1 bg-zinc-900/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside className="flex h-full w-full max-w-xl flex-col bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold">Empfänger suchen & hinzufügen</h2>
            <p className="text-xs text-zinc-500">
              {campaign.origin === "item" && campaign.itemRef
                ? `Matching-Vorschläge für ${serviceLabels[campaign.itemRef.service]}, plus freie Suche`
                : "Freie Kontaktsuche"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100"
          >
            <X size={18} />
          </button>
        </header>

        <div className="border-b border-zinc-100 px-5 py-3">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, Firma oder Email suchen…"
              className="w-full rounded-md border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {campaign.origin === "item" && (
            <section className="mb-5">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Matching-Vorschläge
              </h3>
              {loading && matchesFiltered.length === 0 ? (
                <div className="rounded-md border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-500">
                  Lade Vorschläge…
                </div>
              ) : matchesFiltered.length === 0 ? (
                <div className="rounded-md border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-500">
                  Keine passenden Vorschläge.
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {matchesFiltered.map((r) => (
                    <RecipientRow
                      key={r.id}
                      recipient={r}
                      score={r.score}
                      reason={r.reason}
                      added={existingIds.has(r.id)}
                      adding={addingId === r.id}
                      onAdd={() => addRecipient(r)}
                    />
                  ))}
                </ul>
              )}
            </section>
          )}

          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              {campaign.origin === "item"
                ? "Weitere Kontakte (freie Suche)"
                : "Kontakte"}
            </h3>
            {searchOnly.length === 0 ? (
              <div className="rounded-md border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-500">
                {debouncedSearch
                  ? "Kein weiterer Treffer."
                  : "Tippe einen Namen, eine Firma oder eine Email."}
              </div>
            ) : (
              <ul className="space-y-1.5">
                {searchOnly.map((r) => (
                  <RecipientRow
                    key={r.id}
                    recipient={r}
                    added={existingIds.has(r.id)}
                    adding={addingId === r.id}
                    onAdd={() => addRecipient(r)}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>

        <footer className="border-t border-zinc-100 px-5 py-3">
          <Button variant="secondary" onClick={onClose} className="w-full">
            Fertig
          </Button>
        </footer>
      </aside>
    </div>
  );
}

type RowProps = {
  recipient: Recipient;
  score?: number;
  reason?: string;
  added: boolean;
  adding: boolean;
  onAdd: () => void;
};

function RecipientRow({ recipient, score, reason, added, adding, onAdd }: RowProps) {
  const name =
    recipient.sprache === "it" ? recipient.nameIt : recipient.nameDe;
  return (
    <li>
      <div
        className={cn(
          "flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm transition",
          added
            ? "border-emerald-200 bg-emerald-50/50"
            : "border-zinc-200 bg-white hover:border-blue-400"
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate font-medium text-zinc-900">{name}</div>
            <Badge variant="neutral" className="uppercase">
              {recipient.sprache}
            </Badge>
          </div>
          <div className="truncate text-xs text-zinc-500">
            {recipient.email}
            {recipient.bezirkDe ? ` · ${recipient.bezirkDe}` : ""}
          </div>
          {typeof score === "number" && (
            <div className="mt-1.5 flex items-center gap-2">
              <ScoreBar value={score} />
              {reason && (
                <span className="text-[11px] text-zinc-500 truncate">
                  {reason}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="shrink-0">
          {added ? (
            <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-emerald-700">
              <Check size={12} /> hinzugefügt
            </span>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              disabled={adding}
              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {adding ? "Füge hinzu…" : "Hinzufügen"}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

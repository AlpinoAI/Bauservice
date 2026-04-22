"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, ThumbsDown, ThumbsUp, UserPlus, X } from "lucide-react";
import type {
  Campaign,
  Recipient,
  WithScore,
} from "@/lib/types";
import { useCampaignStore } from "@/lib/campaign-store";
import { buildDraftForRecipient } from "@/lib/build-draft-for-recipient";
import { ansprechpartnerLabel, isBestandskunde } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/ui/score-bar";
import { useDebounced } from "@/lib/use-debounced";
import { cn } from "@/lib/utils";

type Props = {
  campaign: Campaign;
};

type MatchInfo = { score: number; reason?: string };

const headerGrid =
  "grid-cols-[minmax(220px,1fr)_minmax(90px,100px)_minmax(110px,140px)_minmax(140px,180px)_minmax(180px,220px)_minmax(150px,auto)]";

function useItemMatching(campaign: Campaign): Map<number, MatchInfo> {
  const service = campaign.itemRef?.service;
  const itemId = campaign.itemRef?.itemId;
  const [map, setMap] = useState<Map<number, MatchInfo>>(() => new Map());

  useEffect(() => {
    if (campaign.origin !== "item" || !service || itemId == null) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/dummy/matching/recipients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ service, itemId, n: 80 }),
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          items: Array<{ id: number; score: number; reason?: string }>;
        };
        const next = new Map<number, MatchInfo>();
        for (const it of data.items) next.set(it.id, { score: it.score, reason: it.reason });
        setMap(next);
      } catch {
        // ignore
      }
    })();
    return () => ctrl.abort();
  }, [campaign.origin, service, itemId]);

  return map;
}

export function ItemContactsTable({ campaign }: Props) {
  const drafts = useCampaignStore((s) => s.drafts);
  const activeId = useCampaignStore((s) => s.activeRecipientId);
  const setActive = useCampaignStore((s) => s.setActiveRecipient);
  const toggleSkip = useCampaignStore((s) => s.toggleSkip);
  const [addOpen, setAddOpen] = useState(false);
  const matching = useItemMatching(campaign);

  const list = Object.values(drafts);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Kontakte</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Matching-Vorschläge zum Ursprungs-Item. Klick eine Zeile für die
            Vorschau. „Passt nicht" schließt den Kontakt aus dem Versand aus.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-blue-500 hover:text-blue-700"
        >
          <UserPlus size={12} /> Weitere hinzufügen
        </button>
      </header>

      <div className="overflow-x-auto">
        <div
          className={cn(
            "grid items-center gap-3 border-b border-zinc-100 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500",
            headerGrid
          )}
        >
          <div>Name / Ansprechpartner</div>
          <div>Typ</div>
          <div>Bezirk</div>
          <div>Gewerke</div>
          <div>Matching</div>
          <div className="text-right">Feedback</div>
        </div>

        {list.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            Keine Kontakte in der Kampagne.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {list.map((d) => {
              const r = d.recipient;
              const active = d.recipientId === activeId;
              const bestand = isBestandskunde(r);
              const name = r.sprache === "it" ? r.nameIt : r.nameDe;
              const apLabel = ansprechpartnerLabel(r.ansprechpartner);
              const skipped = d.skip;
              const match = matching.get(d.recipientId);
              return (
                <li
                  key={d.recipientId}
                  className={cn(
                    "grid cursor-pointer items-center gap-3 px-4 py-3 text-sm transition",
                    headerGrid,
                    active
                      ? "bg-blue-50"
                      : skipped
                        ? "bg-red-50/30 text-zinc-500"
                        : "hover:bg-zinc-50"
                  )}
                  onClick={() => setActive(d.recipientId)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-zinc-900">
                        {name}
                      </span>
                      <Badge variant="neutral" className="uppercase">
                        {r.sprache}
                      </Badge>
                      {skipped && <Badge variant="red">Skip</Badge>}
                    </div>
                    <div className="truncate text-xs text-zinc-500">
                      {apLabel ? `${apLabel} · ` : ""}
                      {r.email}
                    </div>
                  </div>
                  <div>
                    <Badge variant={bestand ? "green" : "blue"}>
                      {bestand ? "Bestand" : "Neu"}
                    </Badge>
                  </div>
                  <div className="truncate text-zinc-700">
                    {r.bezirkDe ?? "—"}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.gewerke && r.gewerke.length > 0 ? (
                      r.gewerke.map((g) => (
                        <Badge key={g} variant="neutral">
                          {g}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </div>
                  <div>
                    {match ? (
                      <>
                        <ScoreBar value={match.score} />
                        {match.reason && (
                          <div className="mt-0.5 truncate text-[11px] text-zinc-500">
                            {match.reason}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </div>
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (skipped) toggleSkip(d.recipientId);
                      }}
                      aria-pressed={!skipped}
                      className={cn(
                        "inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition",
                        !skipped
                          ? "bg-emerald-100 text-emerald-700"
                          : "text-zinc-500 hover:bg-white hover:text-emerald-600"
                      )}
                      title="Passt — bleibt im Versand"
                    >
                      <ThumbsUp size={12} /> Passt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!skipped) toggleSkip(d.recipientId);
                      }}
                      aria-pressed={skipped}
                      className={cn(
                        "inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition",
                        skipped
                          ? "bg-red-100 text-red-700"
                          : "text-zinc-500 hover:bg-white hover:text-red-600"
                      )}
                      title="Passt nicht — vom Versand ausschließen"
                    >
                      <ThumbsDown size={12} /> Passt nicht
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {addOpen && (
        <AddContactsSheet campaign={campaign} onClose={() => setAddOpen(false)} />
      )}
    </section>
  );
}

function AddContactsSheet({
  campaign,
  onClose,
}: {
  campaign: Campaign;
  onClose: () => void;
}) {
  const existingDrafts = useCampaignStore((s) => s.drafts);
  const [matches, setMatches] = useState<WithScore<Recipient>[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Recipient[]>([]);
  const [addingId, setAddingId] = useState<number | null>(null);
  const debouncedSearch = useDebounced(search, 200);

  useEffect(() => {
    if (campaign.origin !== "item" || !campaign.itemRef) return;
    const ctrl = new AbortController();
    (async () => {
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
      } catch {
        // ignore
      }
    })();
    return () => ctrl.abort();
  }, [campaign]);

  useEffect(() => {
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
  }, [debouncedSearch]);

  const existingIds = useMemo(
    () => new Set(Object.keys(existingDrafts).map((n) => Number(n))),
    [existingDrafts]
  );

  const matchIds = useMemo(() => new Set(matches.map((m) => m.id)), [matches]);
  const extraResults = useMemo(
    () => searchResults.filter((r) => !matchIds.has(r.id)),
    [matchIds, searchResults]
  );

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
            <h2 className="text-sm font-semibold">Kontakt hinzufügen</h2>
            <p className="text-xs text-zinc-500">
              Matching-Vorschläge + freie Suche im Kontaktstamm.
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
          {campaign.origin === "item" && matches.length > 0 && (
            <section className="mb-5">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Matching-Vorschläge
              </h3>
              <ul className="space-y-1.5">
                {matches.map((r) => (
                  <ContactRow
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
            </section>
          )}

          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              {matches.length > 0 ? "Weitere Kontakte (freie Suche)" : "Kontakte"}
            </h3>
            {extraResults.length === 0 ? (
              <div className="rounded-md border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-500">
                {debouncedSearch
                  ? "Kein weiterer Treffer."
                  : "Tippe einen Namen, eine Firma oder eine Email."}
              </div>
            ) : (
              <ul className="space-y-1.5">
                {extraResults.map((r) => (
                  <ContactRow
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

function ContactRow({ recipient, score, reason, added, adding, onAdd }: RowProps) {
  const name =
    recipient.sprache === "it" ? recipient.nameIt : recipient.nameDe;
  const bestand = isBestandskunde(recipient);
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
            <Badge variant={bestand ? "green" : "blue"}>
              {bestand ? "Bestand" : "Neu"}
            </Badge>
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
                <span className="truncate text-[11px] text-zinc-500">
                  {reason}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="shrink-0">
          {added ? (
            <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-emerald-700">
              hinzugefügt
            </span>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              disabled={adding}
              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {adding ? "Füge hinzu…" : (
                <>
                  <Plus size={11} /> Hinzufügen
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

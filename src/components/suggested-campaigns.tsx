"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StartCampaignButton } from "@/components/ui/start-campaign-button";
import { ScoreBar } from "@/components/ui/score-bar";
import { serviceLabels } from "@/lib/filter-options";
import { scenarios } from "@/lib/scenarios";
import { useStartCampaign } from "@/lib/use-start-campaign";
import type { Suggestion } from "@/lib/suggestions";

export function SuggestedCampaigns() {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const { start, startingId } = useStartCampaign();

  useEffect(() => {
    fetch("/api/dummy/sql/suggestions?limit=6")
      .then((r) => r.json())
      .then((d) => setSuggestions(d.suggestions ?? []))
      .catch(() => setSuggestions([]));
  }, []);

  function startFrom(s: Suggestion) {
    const name = `Vorschlag · ${s.recipient.nameDe} · ${serviceLabels[s.item.service]}`;
    const itemRef =
      s.item.service === "ausschreibungen" || s.item.service === "ergebnisse"
        ? { service: s.item.service, itemId: s.item.id }
        : undefined;
    void start(s.id, {
      name,
      origin: itemRef ? "item" : "recipient",
      itemRef,
      recipientIds: [s.recipient.id],
    });
  }

  return (
    <section className="mb-8 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Email-Vorschläge
            </h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              Konkrete Kontakt × Eintrag-Kombinationen mit dem besten
              Matching-Score. Ein Klick startet eine vorausgefüllte Kampagne.
            </p>
          </div>
        </div>
        <Badge variant="amber">Top 6</Badge>
      </div>

      {suggestions === null ? (
        <div className="rounded-md border border-dashed border-zinc-200 bg-white p-6 text-center text-xs text-zinc-500">
          Lade Vorschläge …
        </div>
      ) : suggestions.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-200 bg-white p-6 text-center text-xs text-zinc-500">
          Aktuell keine Vorschläge mit hohem Score (Schwellwert 0,70). Sobald
          mehr Kontakte und Service-Daten verfügbar sind, erscheinen hier
          konkrete Empfehlungen.
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {suggestions.map((s) => {
            const scn = scenarios[s.scenarioId];
            return (
              <div
                key={s.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3.5 py-3 text-sm transition hover:border-blue-400 hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="blue">{serviceLabels[s.item.service]}</Badge>
                    <Badge variant="neutral">{scn.labelDe}</Badge>
                  </div>
                  <div className="mt-1 text-sm font-medium text-zinc-900 line-clamp-1">
                    {s.recipient.sprache === "it"
                      ? s.recipient.nameIt
                      : s.recipient.nameDe}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                    {s.item.beschreibungDe}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <ScoreBar value={s.score} />
                    <span className="text-[11px] text-zinc-500 truncate">
                      {s.reason}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StartCampaignButton
                    disabled={startingId !== null}
                    loading={startingId === s.id}
                    onClick={() => startFrom(s)}
                    label="Kampagne"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StartCampaignButton } from "@/components/ui/start-campaign-button";
import { serviceLabels } from "@/lib/filter-options";
import { useStartCampaign } from "@/lib/use-start-campaign";
import type { Suggestion } from "@/lib/suggestions";
import { cn } from "@/lib/utils";

export function SuggestedCampaigns() {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const { start, startingId } = useStartCampaign();

  useEffect(() => {
    fetch("/api/dummy/sql/suggestions")
      .then((r) => r.json())
      .then((d) => setSuggestions(d.suggestions ?? []))
      .catch(() => setSuggestions([]));
  }, []);

  function startFrom(s: Suggestion) {
    if (!s.latestItem) return;
    void start(s.scenarioId, {
      name: `Vorschlag · ${serviceLabels[s.service]} · ${new Date().toISOString().slice(0, 10)}`,
      origin: "item",
      itemRef: { service: s.service, itemId: s.latestItem.id },
      scenarioId: s.scenarioId,
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
              Automatische Email-Vorschläge
            </h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              Basierend auf neu hinzugefügten Daten der letzten 14 Tage. Ein
              Klick reicht, um eine passende Kampagne zu starten.
            </p>
          </div>
        </div>
        <Badge variant="amber">Phase 2 · Preview</Badge>
      </div>

      {suggestions === null ? (
        <div className="rounded-md border border-dashed border-zinc-200 bg-white p-6 text-center text-xs text-zinc-500">
          Lade Vorschläge …
        </div>
      ) : suggestions.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-200 bg-white p-6 text-center text-xs text-zinc-500">
          Keine neuen Einträge im Zeitraum.
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {suggestions.map((s) => {
            const isEmpty = s.newItems === 0 || !s.latestItem;
            const countLabel =
              s.newItems === 1 ? "1 neuer Eintrag" : `${s.newItems} neue Einträge`;
            return (
              <div
                key={s.scenarioId}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-lg border bg-white px-3.5 py-3 text-sm transition",
                  isEmpty
                    ? "border-zinc-200 opacity-70"
                    : "border-zinc-200 hover:border-blue-400 hover:shadow-sm"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="blue">Szenario {s.scenarioId}</Badge>
                    <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      {serviceLabels[s.service]}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-medium text-zinc-900">
                    {s.newItems > 0 ? countLabel : "Keine neuen Einträge"}
                  </div>
                  {s.latestItem && (
                    <div className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                      {s.latestItem.beschreibungDe}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isEmpty ? (
                    <Link
                      href="/services"
                      className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-300"
                    >
                      Übersicht
                    </Link>
                  ) : (
                    <StartCampaignButton
                      disabled={startingId !== null}
                      loading={startingId === s.scenarioId}
                      onClick={() => startFrom(s)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Example, Service } from "@/lib/types";
import { useCampaignStore } from "@/lib/campaign-store";
import { serviceLabels } from "@/lib/filter-options";
import { ExampleCard } from "./example-card";
import { ExampleSwapSheet } from "./example-swap-sheet";
import { cn } from "@/lib/utils";

type Props = {
  recipientId: number;
  service: Service;
  pinnedExampleId?: number;
};

export function ServicePanel({ recipientId, service, pinnedExampleId }: Props) {
  const draft = useCampaignStore((s) => s.drafts[recipientId]);
  const pool = useCampaignStore((s) => s.examplesByService[service]);
  const toggleService = useCampaignStore((s) => s.toggleService);
  const removeExample = useCampaignStore((s) => s.removeExample);
  const setExamples = useCampaignStore((s) => s.setExamplesFor);
  const [swapOpen, setSwapOpen] = useState<number | null>(null);

  if (!draft) return null;

  const enabled = draft.serviceEnabled[service];
  const selectedIds = draft.selectedExamples[service];
  const selected: Example[] = selectedIds
    .map((id) => pool.find((e) => e.id === id))
    .filter((e): e is Example => !!e);

  return (
    <section
      className={cn(
        "rounded-lg border border-zinc-200 bg-white transition",
        !enabled && "opacity-60"
      )}
    >
      <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold">{serviceLabels[service]}</h3>
          <span className="text-xs text-zinc-500">
            {selected.length} {selected.length === 1 ? "Eintrag" : "Einträge"}
          </span>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            checked={enabled}
            onChange={() => toggleService(recipientId, service)}
          />
          <span>Im Email anzeigen</span>
        </label>
      </header>

      {enabled && (
        <div className="space-y-2 p-4">
          {selected.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-200 px-4 py-6 text-center text-xs text-zinc-500">
              Keine Einträge. Klick auf „Beispiel hinzufügen".
            </div>
          ) : (
            selected.map((ex) => (
              <ExampleCard
                key={ex.id}
                example={ex}
                sprache={draft.sprache}
                pinned={ex.id === pinnedExampleId}
                onSwap={() => setSwapOpen(ex.id)}
                onRemove={() => removeExample(recipientId, service, ex.id)}
              />
            ))
          )}
          <button
            type="button"
            onClick={() => setSwapOpen(-1)}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <Plus size={12} /> Beispiel hinzufügen
          </button>
        </div>
      )}

      {swapOpen !== null && (
        <ExampleSwapSheet
          open
          recipientId={recipientId}
          service={service}
          excludeId={swapOpen > 0 ? swapOpen : -1}
          sprache={draft.sprache}
          onClose={() => setSwapOpen(null)}
          onPick={(newId) => {
            if (swapOpen === -1) {
              setExamples(recipientId, service, [...selectedIds, newId]);
            } else {
              setExamples(
                recipientId,
                service,
                selectedIds.map((id) => (id === swapOpen ? newId : id))
              );
            }
          }}
        />
      )}
    </section>
  );
}

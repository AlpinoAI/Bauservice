"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Service } from "@/lib/types";
import { useCampaignStore, type PoolExample } from "@/lib/campaign-store";
import { serviceLabels, servicesOrder } from "@/lib/filter-options";
import { ExampleCard } from "./example-card";
import { ExampleSwapSheet } from "./example-swap-sheet";
import { cn } from "@/lib/utils";

type Props = {
  recipientId: number;
  pinnedService?: Service;
  pinnedExampleId?: number;
};

export function ServiceTabsPanel({
  recipientId,
  pinnedService,
  pinnedExampleId,
}: Props) {
  const draft = useCampaignStore((s) => s.drafts[recipientId]);
  const examplesByService = useCampaignStore((s) => s.examplesByService);
  const toggleService = useCampaignStore((s) => s.toggleService);
  const removeExample = useCampaignStore((s) => s.removeExample);
  const setExamples = useCampaignStore((s) => s.setExamplesFor);
  const setExampleCount = useCampaignStore((s) => s.setExampleCount);
  const [activeTab, setActiveTab] = useState<Service>(
    pinnedService ?? "ausschreibungen"
  );
  const [swapOpen, setSwapOpen] = useState<number | null>(null);

  if (!draft) return null;

  const service = activeTab;
  const pool = examplesByService[service];
  const enabled = draft.serviceEnabled[service];
  const selectedIds = draft.selectedExamples[service];
  const selected: PoolExample[] = selectedIds
    .map((id) => pool.find((e) => e.id === id))
    .filter((e): e is PoolExample => !!e);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center gap-1 border-b border-zinc-100 px-2 py-1.5">
        {servicesOrder.map((svc) => {
          const active = svc === activeTab;
          const count = draft.selectedExamples[svc].length;
          return (
            <button
              key={svc}
              type="button"
              onClick={() => setActiveTab(svc)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                active
                  ? "bg-blue-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              )}
              aria-pressed={active}
            >
              {serviceLabels[svc]}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                  active ? "bg-white/20" : "bg-zinc-200 text-zinc-600"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className={cn("transition", !enabled && "opacity-60")}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-2 text-xs">
          <span className="text-zinc-500">
            {selected.length} {selected.length === 1 ? "Eintrag" : "Einträge"} von {pool.length}
          </span>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-zinc-600">
              <span>Anzahl</span>
              <input
                type="number"
                min={0}
                max={pool.length}
                value={selected.length}
                disabled={!enabled || pool.length === 0}
                onChange={(e) => {
                  const next = Number.parseInt(e.target.value, 10);
                  if (Number.isFinite(next))
                    setExampleCount(recipientId, service, next);
                }}
                className="h-7 w-14 rounded border border-zinc-200 bg-white px-2 text-right text-xs text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
              />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 text-zinc-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                checked={enabled}
                onChange={() => toggleService(recipientId, service)}
              />
              <span>Im Email anzeigen</span>
            </label>
          </div>
        </div>

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
                  recipientId={recipientId}
                  service={service}
                  score={ex.score}
                  reason={ex.reason}
                  pinned={
                    service === pinnedService && ex.id === pinnedExampleId
                  }
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
      </div>

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

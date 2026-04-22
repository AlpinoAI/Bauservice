"use client";

import { useCampaignStore } from "@/lib/campaign-store";
import { scenarios, scenariosOrder } from "@/lib/scenarios";
import type { ScenarioId } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ScenarioSelector() {
  const scenarioId = useCampaignStore((s) => s.scenarioId);
  const setScenario = useCampaignStore((s) => s.setScenario);
  const activeId = useCampaignStore((s) => s.activeRecipientId);
  const drafts = useCampaignStore((s) => s.drafts);
  const active = activeId ? drafts[activeId] : null;

  const sprache = active?.sprache ?? "de";
  const current = scenarios[scenarioId];

  return (
    <section className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Email-Template wählen</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Jedes Szenario hat einen eigenen Aufbau, Betreff und Text in DE und
            IT. Text-Anpassungen pro Empfänger folgen unten oder direkt in der
            Vorschau.
          </p>
        </div>
        <span className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-600">
          Sprache Empfänger: {sprache}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {scenariosOrder.map((id) => {
          const s = scenarios[id];
          const isActive = scenarioId === id;
          const label = sprache === "it" ? s.labelIt : s.labelDe;
          const desc = sprache === "it" ? s.descriptionIt : s.descriptionDe;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setScenario(id as ScenarioId)}
              aria-pressed={isActive}
              className={cn(
                "group flex flex-col items-start gap-1 rounded-md border px-3 py-2.5 text-left text-xs transition",
                isActive
                  ? "border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
              )}
            >
              <span className="font-semibold">{label}</span>
              <span className="text-[11px] leading-snug text-zinc-500 group-hover:text-zinc-600">
                {desc}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-md border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] text-zinc-600">
        Aktiv: <strong>{sprache === "it" ? current.labelIt : current.labelDe}</strong>
        {" · "}Template-Varianten: <strong>DE</strong> + <strong>IT</strong>
      </div>
    </section>
  );
}

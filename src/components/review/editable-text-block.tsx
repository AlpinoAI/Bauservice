"use client";

import type { RecipientDraft } from "@/lib/campaign-store";
import { useCampaignStore } from "@/lib/campaign-store";

type Key = "salutation" | "intro" | "cta";

const labels: Record<Key, { title: string; defaultDe: string; defaultIt: string }> = {
  salutation: {
    title: "Anrede",
    defaultDe: "Sehr geehrte Damen und Herren,",
    defaultIt: "Gentile cliente,",
  },
  intro: {
    title: "Einleitung",
    defaultDe: "nachfolgend eine persönliche Auswahl passender Informationen für Sie.",
    defaultIt:
      "di seguito trovate una selezione personalizzata basata sui vostri interessi.",
  },
  cta: {
    title: "Call-to-Action",
    defaultDe: "Für weitere Details kontaktieren Sie uns gerne.",
    defaultIt: "Contattateci per ulteriori informazioni.",
  },
};

type Props = {
  recipientId: number;
  draft: RecipientDraft;
};

export function EditableTextBlock({ recipientId, draft }: Props) {
  const setOverride = useCampaignStore((s) => s.setOverride);
  const keys: Key[] = ["salutation", "intro", "cta"];

  return (
    <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="text-sm font-semibold">Text-Anpassungen</h3>
      <p className="text-xs text-zinc-500">
        Überschreibt den Standardtext für diesen einen Empfänger. Leer lassen =
        Standard verwenden (Platzhaltertext unten).
      </p>
      <div className="space-y-3">
        {keys.map((key) => {
          const meta = labels[key];
          const value = draft.overrides[key] ?? "";
          const placeholder =
            draft.sprache === "it" ? meta.defaultIt : meta.defaultDe;
          return (
            <label key={key} className="block text-xs">
              <span className="font-medium text-zinc-700">{meta.title}</span>
              <textarea
                rows={key === "intro" ? 3 : 2}
                value={value}
                placeholder={placeholder}
                onChange={(e) => setOverride(recipientId, key, e.target.value)}
                className="mt-1 w-full resize-none rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
              />
            </label>
          );
        })}
      </div>
    </section>
  );
}

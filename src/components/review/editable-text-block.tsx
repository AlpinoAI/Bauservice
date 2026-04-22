"use client";

import type { RecipientDraft } from "@/lib/campaign-store";
import { useCampaignStore } from "@/lib/campaign-store";
import { getContent } from "@/lib/email-template-content";
import type { EmailOverrides } from "@/lib/types";

type Key = Exclude<keyof EmailOverrides, "bodyHtml" | "subject" | "senderName">;

const labels: Record<Key, { title: string; hint: string }> = {
  salutation: {
    title: "Anrede",
    hint: "Standard: Szenario-Prefix + Firmenname",
  },
  hook: {
    title: "Opener / Trigger-Absatz",
    hint: "Der persönliche Aufhänger unter der Anrede (z.B. 'Glückwunsch zum Zuschlag')",
  },
  bridge: {
    title: "Bridge-Absatz",
    hint: "Leitet zur Beispielliste über",
  },
  cta: {
    title: "Call-to-Action",
    hint: "Abschluss + Aufforderung",
  },
};

type Props = {
  recipientId: number;
  draft: RecipientDraft;
};

export function EditableTextBlock({ recipientId, draft }: Props) {
  const setOverride = useCampaignStore((s) => s.setOverride);
  const keys: Key[] = ["salutation", "hook", "bridge", "cta"];
  const scenario = getContent(draft.sprache).scenarios[draft.scenarioId];

  const placeholders: Record<Key, string> = {
    salutation: scenario.salutationFallback,
    hook: scenario.hook,
    bridge: scenario.bridge,
    cta: scenario.ctaClosing,
  };

  return (
    <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold">Strukturierter Text-Editor</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Überschreibt die einzelnen Szenario-Abschnitte für diesen Empfänger.
          Für freies Bearbeiten klick direkt auf den entsprechenden Absatz in
          der Vorschau rechts.
        </p>
      </div>
      <div className="space-y-3">
        {keys.map((key) => {
          const meta = labels[key];
          const value = draft.overrides[key] ?? "";
          return (
            <label key={key} className="block text-xs">
              <span className="font-medium text-zinc-700">{meta.title}</span>
              <span className="ml-2 text-[10px] text-zinc-400">{meta.hint}</span>
              <textarea
                rows={key === "salutation" ? 2 : 3}
                value={value}
                placeholder={placeholders[key]}
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

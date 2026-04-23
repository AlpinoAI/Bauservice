"use client";

import { useEffect, useMemo } from "react";
import { useCampaignStore } from "@/lib/campaign-store";
import type { RecipientDraft } from "@/lib/campaign-store";
import { useDebounced } from "@/lib/use-debounced";
import { servicesOrder } from "@/lib/filter-options";
import type {
  Campaign,
  Example,
  RenderPayload,
  Service,
} from "@/lib/types";

function buildRenderPayload(
  draft: RecipientDraft,
  pool: Record<Service, Example[]>,
  itemRef: Campaign["itemRef"] | undefined
): RenderPayload {
  const examples: Record<Service, Example[]> = {
    ausschreibungen: [],
    ergebnisse: [],
    beschluesse: [],
    baukonzessionen: [],
  };
  for (const svc of servicesOrder) {
    examples[svc] = draft.selectedExamples[svc]
      .map((id) => pool[svc].find((e) => e.id === id))
      .filter((e): e is Example => !!e);
  }
  const pinnedExample = itemRef
    ? pool[itemRef.service].find((e) => e.id === itemRef.itemId)
    : undefined;
  return {
    templateId: "default",
    sprache: draft.sprache,
    scenarioId: draft.scenarioId,
    payload: {
      recipient: {
        nameDe: draft.recipient.nameDe,
        nameIt: draft.recipient.nameIt,
        ansprechpartner: draft.recipient.ansprechpartner,
      },
      examples,
      serviceEnabled: draft.serviceEnabled,
      overrides: draft.overrides,
      pinnedExample,
    },
  };
}

// Stabil gegen Key-Reihenfolge in `overrides` — zwei Drafts mit identischem
// Inhalt aber anderer Insertion-Order ergeben denselben Key und triggern
// keinen Re-Render.
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map(stableStringify).join(",") + "]";
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + stableStringify(record[k]))
      .join(",") +
    "}"
  );
}

// Modul-weit (über Hook-Instanzen hinweg), damit die Navigation
// Review↔Versand keine redundanten /render/mjml-Calls produziert.
const lastRenderedKey = new Map<number, string>();

/**
 * Debounced Auto-Render für den aktiven Empfänger-Draft. Hört auf Draft-
 * Änderungen + itemRef, ruft /api/dummy/render/mjml und persistiert das
 * Ergebnis im campaign-store.renderCache. Wird von ReviewScreen UND der
 * Versand-Seite aufgerufen, damit die EmailPreview beim Empfänger-Wechsel
 * frisch gerendert wird.
 */
export function useAutoRender() {
  const activeDraft = useCampaignStore((s) =>
    s.activeRecipientId ? s.drafts[s.activeRecipientId] ?? null : null
  );
  const itemRef = useCampaignStore((s) => s.campaign?.itemRef);

  const renderKey = useMemo(() => {
    if (!activeDraft) return "";
    return stableStringify({
      id: activeDraft.recipientId,
      se: activeDraft.selectedExamples,
      en: activeDraft.serviceEnabled,
      ov: activeDraft.overrides,
      sp: activeDraft.sprache,
      sc: activeDraft.scenarioId,
      ir: itemRef ?? null,
    });
  }, [activeDraft, itemRef]);

  const debouncedKey = useDebounced(renderKey, 350);

  useEffect(() => {
    if (!debouncedKey || !activeDraft) return;
    if (lastRenderedKey.get(activeDraft.recipientId) === debouncedKey) return;

    const controller = new AbortController();
    const draft = activeDraft;
    const capturedItemRef = itemRef;

    (async () => {
      const pool = useCampaignStore.getState().examplesByService;
      const payload = buildRenderPayload(draft, pool, capturedItemRef);
      try {
        const res = await fetch("/api/dummy/render/mjml", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          html: string;
          text: string;
          subject: string;
        };
        if (controller.signal.aborted) return;
        lastRenderedKey.set(draft.recipientId, debouncedKey);
        useCampaignStore
          .getState()
          .setRender(draft.recipientId, data.html, data.text, data.subject);
      } catch {
        // AbortError oder Netz-Fehler — kein State-Update, nächster Render
        // kommt beim nächsten Key-Change.
      }
    })();

    return () => controller.abort();
  }, [debouncedKey, activeDraft, itemRef]);
}

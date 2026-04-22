import { buildEmptyDraft } from "@/lib/campaign-store";
import type { RecipientDraft } from "@/lib/campaign-store";
import { servicesOrder } from "@/lib/filter-options";
import type { Example, Recipient, ScenarioId, Service, WithScore } from "@/lib/types";

export type MatchingBundle = {
  service: Service;
  items: WithScore<Example>[];
};

export type BuiltDraft = {
  draft: RecipientDraft;
  matching: MatchingBundle[];
};

const DEFAULT_SELECTION_SIZE = 5;
const MATCHING_POOL_SIZE = 10;

/**
 * Lädt Matching-Items für alle vier Services und die Kundentyp-Klassifizierung
 * parallel und baut daraus einen leeren Draft. Der Draft muss noch via
 * `addToPool` + `addDraft` in den Store geschrieben werden.
 *
 * Wenn `pinnedItem` gesetzt ist (origin=item), wird dieses Item im Focus-Service
 * an erste Stelle gepinnt.
 */
export async function buildDraftForRecipient(
  recipient: Recipient,
  itemRef?: { service: Service; itemId: number },
  pinnedItem?: WithScore<Example>
): Promise<BuiltDraft> {
  const [matchingResults, scenarioRes] = await Promise.all([
    Promise.all(
      servicesOrder.map(async (svc): Promise<MatchingBundle> => {
        const res = await fetch("/api/dummy/matching/examples", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientId: recipient.id,
            service: svc,
            n: MATCHING_POOL_SIZE,
          }),
        });
        if (!res.ok) return { service: svc, items: [] };
        const data = (await res.json()) as { items: WithScore<Example>[] };
        return { service: svc, items: data.items };
      })
    ),
    fetch("/api/dummy/classify-recipient", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: recipient.id, itemRef }),
    }),
  ]);

  const scenarioId: ScenarioId = scenarioRes.ok
    ? ((await scenarioRes.json()) as { scenarioId: ScenarioId }).scenarioId
    : "D";

  const draft = buildEmptyDraft(recipient, scenarioId);
  if (pinnedItem && itemRef) {
    // Item-Flow: Email enthält ausschließlich das in Schritt 1 gewählte Item.
    // Andere Services werden deaktiviert, damit die Mail auf den einen Trigger
    // fokussiert bleibt (Zuschlag / Projekt / Konzession).
    for (const svc of servicesOrder) {
      if (svc === itemRef.service) {
        draft.selectedExamples[svc] = [pinnedItem.id];
      } else {
        draft.serviceEnabled[svc] = false;
      }
    }
  } else {
    for (const { service, items } of matchingResults) {
      draft.selectedExamples[service] = items
        .slice(0, DEFAULT_SELECTION_SIZE)
        .map((it) => it.id);
    }
  }

  return { draft, matching: matchingResults };
}

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

const DEFAULT_N = 3;

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
            n: 5,
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
  for (const { service, items } of matchingResults) {
    let ids = items.slice(0, DEFAULT_N).map((it) => it.id);
    if (pinnedItem && itemRef?.service === service && !ids.includes(pinnedItem.id)) {
      ids = [pinnedItem.id, ...ids.slice(0, DEFAULT_N - 1)];
    }
    draft.selectedExamples[service] = ids;
  }

  return { draft, matching: matchingResults };
}

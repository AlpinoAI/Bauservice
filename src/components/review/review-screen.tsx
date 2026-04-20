"use client";

import { useEffect, useMemo, useRef } from "react";
import type {
  Campaign,
  Example,
  Recipient,
  Service,
  WithScore,
} from "@/lib/types";
import { buildEmptyDraft, useCampaignStore } from "@/lib/campaign-store";
import type { RecipientDraft } from "@/lib/campaign-store";
import { TopNav } from "@/components/top-nav";
import { Badge } from "@/components/ui/badge";
import { RecipientTabs } from "./recipient-tabs";
import { ServicePanel } from "./service-panel";
import { EmailPreview } from "./email-preview";
import { ApprovalBar } from "./approval-bar";
import { EditableTextBlock } from "./editable-text-block";
import { servicesOrder, serviceLabels } from "@/lib/filter-options";

const DEFAULT_N = 3;

type RenderPayloadInput = {
  draft: RecipientDraft;
  pool: Record<Service, Example[]>;
};

function buildRenderPayload({ draft, pool }: RenderPayloadInput) {
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
  return {
    templateId: "default",
    sprache: draft.sprache,
    payload: {
      recipient: {
        nameDe: draft.recipient.nameDe,
        nameIt: draft.recipient.nameIt,
      },
      examples,
      serviceEnabled: draft.serviceEnabled,
      overrides: draft.overrides,
    },
  };
}

export function ReviewScreen({ campaignId }: { campaignId: string }) {
  const campaign = useCampaignStore((s) => s.campaign);
  const activeId = useCampaignStore((s) => s.activeRecipientId);
  const drafts = useCampaignStore((s) => s.drafts);
  const examplesByService = useCampaignStore((s) => s.examplesByService);
  const loading = useCampaignStore((s) => s.loading);

  const setRender = useCampaignStore((s) => s.setRender);

  const activeDraft = activeId ? drafts[activeId] : null;
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (loadedRef.current === campaignId) return;
    loadedRef.current = campaignId;
    const store = useCampaignStore.getState();
    store.reset();
    store.setLoading(true);

    (async () => {
      try {
        const cRes = await fetch(`/api/dummy/sql/campaigns/${campaignId}`);
        if (!cRes.ok) return;
        const c = (await cRes.json()) as Campaign;
        store.setCampaign(c);

        const rRes = await fetch(`/api/dummy/sql/recipients?limit=100`);
        if (!rRes.ok) return;
        const rData = (await rRes.json()) as { items: Recipient[] };
        const recipients = rData.items.filter((r) =>
          c.recipientIds.includes(r.id)
        );

        let pinnedExampleId: number | undefined;
        if (c.origin === "item" && c.itemRef) {
          const piRes = await fetch(
            `/api/dummy/sql/items?service=${c.itemRef.service}&limit=100`
          );
          if (piRes.ok) {
            const piData = (await piRes.json()) as { items: Example[] };
            const pinItem = piData.items.find(
              (x) => x.id === c.itemRef!.itemId
            );
            if (pinItem) {
              pinnedExampleId = pinItem.id;
              useCampaignStore.getState().addToPool(c.itemRef.service, [pinItem]);
            }
          }
        }

        for (const rec of recipients) {
          const matchingResults = await Promise.all(
            servicesOrder.map(async (svc) => {
              const res = await fetch("/api/dummy/matching/examples", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  recipientId: rec.id,
                  service: svc,
                  n: 5,
                }),
              });
              if (!res.ok) return { svc, items: [] as WithScore<Example>[] };
              const data = (await res.json()) as {
                items: WithScore<Example>[];
              };
              return { svc, items: data.items };
            })
          );

          const draft = buildEmptyDraft(rec);
          const api = useCampaignStore.getState();
          for (const { svc, items } of matchingResults) {
            api.addToPool(svc, items);
            let ids = items.slice(0, DEFAULT_N).map((it) => it.id);
            if (
              pinnedExampleId !== undefined &&
              c.itemRef?.service === svc &&
              !ids.includes(pinnedExampleId)
            ) {
              ids = [pinnedExampleId, ...ids.slice(0, DEFAULT_N - 1)];
            }
            draft.selectedExamples[svc] = ids;
          }
          api.addDraft(draft);
        }
      } finally {
        useCampaignStore.getState().setLoading(false);
      }
    })();
  }, [campaignId]);

  const renderKey = useMemo(() => {
    if (!activeDraft) return "";
    return JSON.stringify({
      id: activeDraft.recipientId,
      se: activeDraft.selectedExamples,
      en: activeDraft.serviceEnabled,
      ov: activeDraft.overrides,
      sp: activeDraft.sprache,
    });
  }, [activeDraft]);

  useEffect(() => {
    if (!activeDraft) return;
    const timer = setTimeout(async () => {
      const payload = buildRenderPayload({
        draft: activeDraft,
        pool: examplesByService,
      });
      try {
        const res = await fetch("/api/dummy/render/mjml", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { html: string; text: string };
        setRender(activeDraft.recipientId, data.html, data.text);
      } catch {
        // ignore
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [renderKey, activeDraft, examplesByService, setRender]);

  if (loading || !campaign) {
    return (
      <>
        <TopNav />
        <main className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-lg border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
            Lade Kampagne …
          </div>
        </main>
      </>
    );
  }

  const pinnedService = campaign.origin === "item" ? campaign.itemRef?.service : undefined;
  const pinnedExampleId =
    campaign.origin === "item" && campaign.itemRef && activeDraft
      ? activeDraft.selectedExamples[campaign.itemRef.service].includes(
          campaign.itemRef.itemId
        )
        ? campaign.itemRef.itemId
        : undefined
      : undefined;

  const list = Object.values(drafts);
  const toSend = list.filter((d) => !d.skip);

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-7xl px-6 py-6 pb-24">
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="blue">
                Richtung {campaign.origin === "recipient" ? "A" : "B"}
              </Badge>
              <Badge variant="gray">Draft</Badge>
              {pinnedService && (
                <Badge variant="amber">
                  Ursprung: {serviceLabels[pinnedService]} · ID{" "}
                  {campaign.itemRef?.itemId}
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-semibold">{campaign.name}</h1>
            <p className="mt-1 text-xs text-zinc-500">
              {toSend.length} von {list.length} Empfängern im Versand
            </p>
          </div>
        </header>

        <RecipientTabs />

        {activeDraft ? (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_520px]">
            <div className="space-y-4">
              <EditableTextBlock
                recipientId={activeDraft.recipientId}
                draft={activeDraft}
              />
              {servicesOrder.map((svc) => (
                <ServicePanel
                  key={svc}
                  recipientId={activeDraft.recipientId}
                  service={svc}
                  pinnedExampleId={
                    pinnedService === svc ? pinnedExampleId : undefined
                  }
                />
              ))}
            </div>
            <div className="lg:sticky lg:top-4 lg:self-start">
              <EmailPreview recipientId={activeDraft.recipientId} />
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
            Keine Empfänger in der Kampagne.
          </div>
        )}
      </div>

      <ApprovalBar />
    </>
  );
}

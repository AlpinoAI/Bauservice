"use client";

import { useEffect, useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import type { Campaign, Example, Recipient, WithScore } from "@/lib/types";
import { useCampaignStore } from "@/lib/campaign-store";
import { buildDraftForRecipient } from "@/lib/build-draft-for-recipient";
import { useAutoRender } from "@/lib/use-auto-render";
import { Badge } from "@/components/ui/badge";
import { RecipientTabs } from "./recipient-tabs";
import { ServiceTabsPanel } from "./service-tabs-panel";
import { ItemContactsTable } from "./item-contacts-table";
import { EmailPreview } from "./email-preview";
import { ApprovalBar } from "./approval-bar";
import { RecipientSwapSheet } from "./recipient-swap-sheet";
import { CampaignStepper } from "@/components/campaign-stepper";
import { serviceLabels } from "@/lib/filter-options";

export function ReviewScreen({ campaignId }: { campaignId: string }) {
  const campaign = useCampaignStore((s) => s.campaign);
  const activeId = useCampaignStore((s) => s.activeRecipientId);
  const drafts = useCampaignStore((s) => s.drafts);
  const loading = useCampaignStore((s) => s.loading);

  const activeDraft = activeId ? drafts[activeId] : null;
  const loadedRef = useRef<string | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);

  useAutoRender();

  useEffect(() => {
    if (loadedRef.current === campaignId) return;
    // Kein Re-Fetch, wenn der Client-Store die Kampagne bereits hat — der
    // serverseitige In-Memory-Store ist pro Vercel-Lambda isoliert und
    // liefert auf kalter Instanz 404, was sonst "Lade Kampagne …" einfriert.
    const existing = useCampaignStore.getState();
    if (
      existing.campaignId === campaignId &&
      existing.campaign &&
      Object.keys(existing.drafts).length > 0
    ) {
      loadedRef.current = campaignId;
      return;
    }
    loadedRef.current = campaignId;
    const store = useCampaignStore.getState();
    store.reset();
    store.setLoading(true);

    (async () => {
      try {
        const cRes = await fetch(`/api/dummy/sql/campaigns/${campaignId}`);
        if (!cRes.ok) return;
        const c = (await cRes.json()) as Campaign;

        const rRes = await fetch(`/api/dummy/sql/recipients?limit=500`);
        if (!rRes.ok) return;
        const rData = (await rRes.json()) as { items: Recipient[] };
        const recipients = rData.items.filter((r) =>
          c.recipientIds.includes(r.id)
        );

        store.setCampaign(c);

        let pinnedItem: WithScore<Example> | undefined;
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
              pinnedItem = {
                ...pinItem,
                score: 1,
                reason: "Ursprungs-Eintrag der Kampagne",
              };
              useCampaignStore.getState().addToPool(c.itemRef.service, [pinnedItem]);
            }
          }
        }

        const built = await Promise.all(
          recipients.map((rec) => buildDraftForRecipient(rec, c.itemRef, pinnedItem))
        );
        const api = useCampaignStore.getState();
        for (const { draft, matching } of built) {
          for (const { service, items } of matching) {
            api.addToPool(service, items);
          }
          api.addDraft(draft);
        }
      } finally {
        useCampaignStore.getState().setLoading(false);
      }
    })();
  }, [campaignId]);

  if (loading || !campaign) {
    return (
      <main className="mx-auto w-full max-w-7xl px-8 py-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
          Lade Kampagne …
        </div>
      </main>
    );
  }

  const pinnedService =
    campaign.origin === "item" ? campaign.itemRef?.service : undefined;
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
  const isItemFlow = campaign.origin === "item";

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 pb-24 md:px-6 lg:px-8">
        <CampaignStepper
          activeStep="review"
          campaignId={campaignId}
          origin={campaign.origin}
        />
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="blue">
                {campaign.origin === "recipient" ? "Aus Kontakt" : "Aus Services"}
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

        {isItemFlow ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_480px]">
            <ItemContactsTable campaign={campaign} />
            <div className="lg:sticky lg:top-4 lg:self-start">
              {activeDraft ? (
                <EmailPreview recipientId={activeDraft.recipientId} />
              ) : (
                <div className="rounded-lg border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
                  Wähle links einen Kontakt für die Vorschau.
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-500">
                {list.length} Empfänger in dieser Kampagne.
              </p>
              <button
                type="button"
                onClick={() => setSwapOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-blue-500 hover:text-blue-700"
              >
                <UserPlus size={12} /> Empfänger suchen &amp; hinzufügen
              </button>
            </div>

            <RecipientTabs />

            {activeDraft ? (
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_480px]">
                <ServiceTabsPanel
                  recipientId={activeDraft.recipientId}
                  pinnedService={pinnedService}
                  pinnedExampleId={pinnedExampleId}
                />
                <div className="lg:sticky lg:top-4 lg:self-start">
                  <EmailPreview recipientId={activeDraft.recipientId} />
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
                Keine Empfänger in der Kampagne.
              </div>
            )}
          </>
        )}
      </div>

      <ApprovalBar />

      <RecipientSwapSheet
        open={swapOpen}
        campaign={campaign}
        onClose={() => setSwapOpen(false)}
      />
    </div>
  );
}

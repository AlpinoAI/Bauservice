"use client";

import { useRouter } from "next/navigation";
import { useCampaignStore } from "@/lib/campaign-store";
import { Button } from "@/components/ui/button";

export function ApprovalBar() {
  const router = useRouter();
  const campaign = useCampaignStore((s) => s.campaign);
  const drafts = useCampaignStore((s) => s.drafts);
  const activeId = useCampaignStore((s) => s.activeRecipientId);
  const toggleSkip = useCampaignStore((s) => s.toggleSkip);
  const reset = useCampaignStore((s) => s.reset);

  const active = activeId ? drafts[activeId] : null;
  const list = Object.values(drafts);
  const toSend = list.filter((d) => !d.skip);

  function onDiscard() {
    reset();
    router.push("/");
  }

  function onContinue() {
    if (!campaign) return;
    router.push(`/kampagnen/${campaign.id}/versand`);
  }

  return (
    <div className="sticky bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-zinc-700">
            <strong>{toSend.length}</strong> von {list.length} Empfängern werden
            versandt
          </span>
          {active && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                checked={active.skip}
                onChange={() => toggleSkip(active.recipientId)}
              />
              <span>Aktuellen Empfänger aus Versand streichen</span>
            </label>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onDiscard}>
            Verwerfen
          </Button>
          <Button onClick={onContinue} disabled={toSend.length === 0}>
            Weiter zum Versand
          </Button>
        </div>
      </div>
    </div>
  );
}

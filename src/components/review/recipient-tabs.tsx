"use client";

import { useCampaignStore } from "@/lib/campaign-store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function RecipientTabs() {
  const drafts = useCampaignStore((s) => s.drafts);
  const activeId = useCampaignStore((s) => s.activeRecipientId);
  const setActive = useCampaignStore((s) => s.setActiveRecipient);

  const list = Object.values(drafts);
  if (list.length === 0) return null;

  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-1">
      {list.map((d) => {
        const active = d.recipientId === activeId;
        const name =
          d.recipient.sprache === "it"
            ? d.recipient.nameIt
            : d.recipient.nameDe;
        return (
          <button
            key={d.recipientId}
            type="button"
            onClick={() => setActive(d.recipientId)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition",
              active
                ? "bg-blue-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100",
              d.skip && !active && "opacity-50"
            )}
            aria-pressed={active}
          >
            <span>{name}</span>
            <Badge
              variant={active ? "neutral" : "gray"}
              className={cn(active && "bg-white/20 text-white")}
            >
              {d.sprache.toUpperCase()}
            </Badge>
            {d.skip && (
              <span className="text-[10px] uppercase tracking-wide">
                {active ? "ausgelassen" : "skip"}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

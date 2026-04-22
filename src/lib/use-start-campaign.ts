"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { ScenarioId, Service } from "@/lib/types";

export type StartCampaignInput = {
  name: string;
  origin: "recipient" | "item";
  itemRef?: { service: Service; itemId: number };
  scenarioId?: ScenarioId;
  recipientIds?: number[];
};

export function useStartCampaign() {
  const router = useRouter();
  const [startingId, setStartingId] = useState<string | number | null>(null);

  const start = useCallback(
    async (trackingId: string | number, input: StartCampaignInput) => {
      setStartingId(trackingId);
      try {
        const res = await fetch("/api/dummy/sql/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipientIds: [], ...input }),
        });
        if (!res.ok) throw new Error(`Campaign-Erstellung fehlgeschlagen (${res.status})`);
        const c = (await res.json()) as { id: string };
        setStartingId(null);
        router.push(`/kampagnen/${c.id}`);
      } catch {
        setStartingId(null);
      }
    },
    [router]
  );

  return { start, startingId };
}

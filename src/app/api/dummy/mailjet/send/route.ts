import { NextResponse } from "next/server";
import type { SendResult } from "@/lib/types";
import { findCampaign, markCampaignSent } from "@/lib/fixtures/campaigns";
import { recipientsFixture } from "@/lib/fixtures/recipients";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    campaignId?: string;
    recipientIds?: number[];
  };

  if (!body.campaignId || !Array.isArray(body.recipientIds)) {
    return NextResponse.json(
      { error: "campaignId and recipientIds[] required" },
      { status: 400 }
    );
  }

  // In der Dummy-Phase ist der Campaign-Store per-Lambda-Instance in-memory.
  // Wenn der Send-Call auf einer anderen Instanz landet als der Create-Call,
  // kennt sie die Campaign nicht. Wir brechen deshalb nicht ab, sondern
  // prüfen Opt-out trotzdem und überspringen nur das Status-Update.
  const campaign = findCampaign(body.campaignId);
  const campaignKnownHere = campaign !== undefined;

  const accepted: number[] = [];
  const rejected: Array<{ recipientId: number; reason: string }> = [];

  for (const id of body.recipientIds) {
    const r = recipientsFixture.find((x) => x.id === id);
    if (!r) {
      rejected.push({ recipientId: id, reason: "unbekannter Empfänger" });
      continue;
    }
    if (r.optOut) {
      rejected.push({
        recipientId: id,
        reason: "Opt-out seit Draft-Erstellung gesetzt",
      });
      continue;
    }
    if (!r.aktiv) {
      rejected.push({
        recipientId: id,
        reason: "Empfänger inaktiv",
      });
      continue;
    }
    accepted.push(id);
  }

  if (accepted.length > 0 && campaignKnownHere) {
    markCampaignSent(body.campaignId);
  }

  const result: SendResult = {
    jobId: `demo-${Date.now().toString(36)}`,
    accepted,
    rejected,
    demoMode: true,
  };

  return NextResponse.json(result);
}

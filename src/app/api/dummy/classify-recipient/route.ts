import { NextResponse } from "next/server";
import { classifyRecipientForCampaign } from "@/lib/fixtures/matching";
import { recipientsFixture } from "@/lib/fixtures/recipients";
import type { Service } from "@/lib/types";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    recipientId?: number;
    itemRef?: { service: Service; itemId: number };
  };

  if (typeof body.recipientId !== "number") {
    return NextResponse.json(
      { error: "recipientId required" },
      { status: 400 }
    );
  }

  const recipient = recipientsFixture.find((r) => r.id === body.recipientId);
  if (!recipient) {
    return NextResponse.json({ scenarioId: "D", reason: "unknown" });
  }

  const scenarioId = classifyRecipientForCampaign(recipient, body.itemRef);
  return NextResponse.json({ scenarioId });
}

import { NextResponse } from "next/server";
import { createCampaign, listCampaigns } from "@/lib/fixtures/campaigns";
import { visibleRecipients } from "@/lib/fixtures/recipients";
import type { ScenarioId, Service } from "@/lib/types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const filter: { status?: "draft" | "sent" } | undefined =
    status === "draft" || status === "sent" ? { status } : undefined;
  const items = listCampaigns(filter);
  return NextResponse.json({ items, total: items.length });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    name?: string;
    origin?: "recipient" | "item";
    itemRef?: { service: Service; itemId: number };
    recipientIds?: number[];
    scenarioId?: ScenarioId;
    createdBy?: string;
  };

  if (!body.name || !body.origin) {
    return NextResponse.json(
      { error: "name and origin required" },
      { status: 400 }
    );
  }

  let recipientIds = body.recipientIds ?? [];

  if (
    recipientIds.length === 0 &&
    body.origin === "item" &&
    body.itemRef
  ) {
    recipientIds = visibleRecipients()
      .filter((r) => r.rollen.anbieter)
      .slice(0, 20)
      .map((r) => r.id);
  }

  const campaign = createCampaign({
    name: body.name,
    origin: body.origin,
    status: "draft",
    itemRef: body.itemRef,
    recipientIds,
    scenarioId: body.scenarioId,
    createdBy: body.createdBy ?? "bauservice-user",
  });

  return NextResponse.json(campaign, { status: 201 });
}

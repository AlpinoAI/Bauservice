import { NextResponse } from "next/server";
import { findCampaign, markCampaignSent } from "@/lib/fixtures/campaigns";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const campaign = findCampaign(id);
  if (!campaign) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(campaign);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as { status?: "sent" };
  if (body.status === "sent") {
    const updated = markCampaignSent(id);
    if (!updated) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  }
  return NextResponse.json({ error: "no valid update" }, { status: 400 });
}

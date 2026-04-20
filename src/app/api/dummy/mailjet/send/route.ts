import { NextResponse } from "next/server";
import type { SendResult } from "@/lib/types";

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

  const result: SendResult = {
    jobId: `demo-${Date.now().toString(36)}`,
    accepted: body.recipientIds,
    rejected: [],
    demoMode: true,
  };

  return NextResponse.json(result);
}

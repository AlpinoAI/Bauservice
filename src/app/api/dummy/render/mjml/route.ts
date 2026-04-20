import { NextResponse } from "next/server";
import type { RenderPayload } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<RenderPayload>;
  if (!body.sprache || !body.payload || !body.templateId) {
    return NextResponse.json(
      { error: "templateId, sprache and payload required" },
      { status: 400 }
    );
  }
  try {
    const { render } = await import("@/lib/email-template");
    const result = render(body as RenderPayload);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "render failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

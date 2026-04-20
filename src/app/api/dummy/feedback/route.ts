import { NextResponse } from "next/server";

export const runtime = "nodejs";

type FeedbackEntry = {
  recipientId: number;
  service: string;
  exampleId: number;
  verdict: "passt" | "passt_nicht";
  note?: string;
  at: string;
};

const log: FeedbackEntry[] = [];

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<FeedbackEntry>;
  if (
    typeof body.recipientId !== "number" ||
    typeof body.exampleId !== "number" ||
    !body.service ||
    (body.verdict !== "passt" && body.verdict !== "passt_nicht")
  ) {
    return NextResponse.json(
      {
        error:
          "recipientId, service, exampleId, verdict ('passt'|'passt_nicht') required",
      },
      { status: 400 }
    );
  }

  const entry: FeedbackEntry = {
    recipientId: body.recipientId,
    service: body.service,
    exampleId: body.exampleId,
    verdict: body.verdict,
    note: body.note,
    at: new Date().toISOString(),
  };
  log.push(entry);

  return NextResponse.json({ ok: true, count: log.length });
}

export async function GET() {
  return NextResponse.json({ items: log, count: log.length });
}

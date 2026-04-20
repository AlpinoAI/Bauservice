import { NextResponse } from "next/server";
import { matchExamplesForRecipient } from "@/lib/fixtures/matching";
import type { Service } from "@/lib/types";

const services: Service[] = [
  "ausschreibungen",
  "ergebnisse",
  "beschluesse",
  "baukonzessionen",
];

function isService(v: unknown): v is Service {
  return typeof v === "string" && (services as string[]).includes(v);
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    recipientId?: number;
    service?: string;
    n?: number;
  };

  if (typeof body.recipientId !== "number" || !isService(body.service)) {
    return NextResponse.json(
      { error: "recipientId (number) and service required" },
      { status: 400 }
    );
  }

  const n = Number.isFinite(body.n) && body.n! > 0 ? body.n! : 5;
  const items = matchExamplesForRecipient(body.recipientId, body.service, n);
  return NextResponse.json({ items, total: items.length });
}

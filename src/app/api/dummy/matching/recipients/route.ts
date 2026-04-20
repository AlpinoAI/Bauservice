import { NextResponse } from "next/server";
import { matchRecipientsForItem } from "@/lib/fixtures/matching";
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
    service?: string;
    itemId?: number;
    n?: number;
  };

  if (!isService(body.service) || typeof body.itemId !== "number") {
    return NextResponse.json(
      { error: "service and itemId (number) required" },
      { status: 400 }
    );
  }

  const n = Number.isFinite(body.n) && body.n! > 0 ? body.n! : 10;
  const items = matchRecipientsForItem(body.service, body.itemId, n);
  return NextResponse.json({ items, total: items.length });
}

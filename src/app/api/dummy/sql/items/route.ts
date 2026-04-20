import { NextResponse } from "next/server";
import { itemsForService } from "@/lib/fixtures/items";
import type { Service } from "@/lib/types";

const services: Service[] = [
  "ausschreibungen",
  "ergebnisse",
  "beschluesse",
  "baukonzessionen",
];

function isService(v: string | null): v is Service {
  return !!v && (services as string[]).includes(v);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const service = url.searchParams.get("service");
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const bezirk = url.searchParams.get("bezirk")?.trim();
  const limitRaw = Number(url.searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 50;

  if (!isService(service)) {
    return NextResponse.json(
      {
        error: "invalid service",
        allowed: services,
      },
      { status: 400 }
    );
  }

  const items = itemsForService(service)
    .filter((it) => (bezirk ? it.bezirk === bezirk : true))
    .filter((it) =>
      q
        ? it.beschreibungDe.toLowerCase().includes(q) ||
          it.beschreibungIt.toLowerCase().includes(q)
        : true
    )
    .slice()
    .sort((a, b) => (b.datum ?? "").localeCompare(a.datum ?? ""))
    .slice(0, limit);

  return NextResponse.json({ items, total: items.length, service });
}

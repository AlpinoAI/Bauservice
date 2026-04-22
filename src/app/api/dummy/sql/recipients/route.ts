import { NextResponse } from "next/server";
import {
  recipientsFixture,
  segmentFilter,
} from "@/lib/fixtures/recipients";
import type { RecipientSegment } from "@/lib/types";

function matchesText(
  r: (typeof recipientsFixture)[number],
  q: string
): boolean {
  const needle = q.toLowerCase();
  return (
    r.nameDe.toLowerCase().includes(needle) ||
    r.nameIt.toLowerCase().includes(needle) ||
    r.email.toLowerCase().includes(needle)
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const bezirk = url.searchParams.get("bezirk")?.trim();
  const rolle = url.searchParams.get("rolle")?.trim();
  const gewerk = url.searchParams.get("gewerk")?.trim();
  const segment =
    (url.searchParams.get("segment") as RecipientSegment | null) ?? "alle";
  const limitRaw = Number(url.searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 50;

  const items = recipientsFixture
    .filter((r) => r.aktiv && !r.optOut)
    .filter((r) => (q ? matchesText(r, q) : true))
    .filter((r) => (bezirk ? r.bezirkDe === bezirk : true))
    .filter((r) => {
      if (!rolle) return true;
      if (rolle === "anbieter") return r.rollen.anbieter;
      if (rolle === "ausschreiber") return r.rollen.ausschreiber;
      if (rolle === "kunde") return r.rollen.kunde;
      return true;
    })
    .filter((r) => (gewerk ? !!r.gewerke?.includes(gewerk) : true))
    .filter((r) => segmentFilter(r, segment))
    .slice(0, limit);

  return NextResponse.json({ items, total: items.length });
}

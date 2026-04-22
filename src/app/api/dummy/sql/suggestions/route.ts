import { NextResponse } from "next/server";
import { itemsForService } from "@/lib/fixtures/items";
import { scenarios, scenariosOrder } from "@/lib/scenarios";
import type { Suggestion } from "@/lib/suggestions";

const FRESHNESS_DAYS = 14;

export async function GET() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - FRESHNESS_DAYS);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  const suggestions: Suggestion[] = scenariosOrder.map((id) => {
    const meta = scenarios[id];
    const items = itemsForService(meta.service)
      .slice()
      .sort((a, b) => (b.datum ?? "").localeCompare(a.datum ?? ""));
    const fresh = items.filter((it) => (it.datum ?? "") >= cutoffIso);
    return {
      scenarioId: id,
      service: meta.service,
      newItems: fresh.length,
      latestItem: fresh[0] ?? items[0] ?? null,
      since: cutoffIso,
    };
  });

  return NextResponse.json({ suggestions, since: cutoffIso });
}

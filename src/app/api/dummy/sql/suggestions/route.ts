import { NextResponse } from "next/server";
import {
  classifyRecipientForCampaign,
  matchExamplesForRecipient,
} from "@/lib/fixtures/matching";
import { visibleRecipients } from "@/lib/fixtures/recipients";
import type { Service } from "@/lib/types";
import type { Suggestion } from "@/lib/suggestions";

const services: Service[] = [
  "ausschreibungen",
  "ergebnisse",
  "beschluesse",
  "baukonzessionen",
];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? "6");
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 6;
  const minScoreRaw = Number(url.searchParams.get("minScore") ?? "0.7");
  const minScore = Number.isFinite(minScoreRaw) ? minScoreRaw : 0.7;

  const suggestions: Suggestion[] = [];

  for (const r of visibleRecipients()) {
    if (!r.rollen.anbieter) continue;
    let best: { item: Suggestion["item"]; score: number; reason: string } | null = null;
    for (const svc of services) {
      const matches = matchExamplesForRecipient(r.id, svc, 3);
      for (const m of matches) {
        if (!best || m.score > best.score) {
          best = { item: m, score: m.score, reason: m.reason ?? "" };
        }
      }
    }
    if (!best || best.score < minScore) continue;
    const itemRef =
      best.item.service === "ausschreibungen" || best.item.service === "ergebnisse"
        ? { service: best.item.service as Service, itemId: best.item.id }
        : undefined;
    const scenarioId = classifyRecipientForCampaign(r, itemRef);
    suggestions.push({
      id: `${r.id}-${best.item.service}-${best.item.id}`,
      recipient: {
        id: r.id,
        nameDe: r.nameDe,
        nameIt: r.nameIt,
        sprache: r.sprache,
        bezirkDe: r.bezirkDe,
        gewerke: r.gewerke,
      },
      item: best.item,
      score: best.score,
      reason: best.reason,
      scenarioId,
    });
  }

  suggestions.sort((a, b) => b.score - a.score);
  return NextResponse.json({
    suggestions: suggestions.slice(0, limit),
    total: suggestions.length,
  });
}

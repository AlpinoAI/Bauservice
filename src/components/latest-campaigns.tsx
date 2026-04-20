"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Campaign } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

type Props = { limit?: number };

export function LatestCampaigns({ limit = 5 }: Props) {
  const [items, setItems] = useState<Campaign[] | null>(null);

  useEffect(() => {
    fetch("/api/dummy/sql/campaigns")
      .then((r) => r.json())
      .then((d) => {
        const all = (d.items as Campaign[]) ?? [];
        const sorted = [...all].sort((a, b) =>
          (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
        );
        setItems(sorted.slice(0, limit));
      })
      .catch(() => setItems([]));
  }, [limit]);

  if (items === null) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
        Lade …
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
        Noch keine Kampagnen vorhanden.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
      {items.map((c) => (
        <li key={c.id}>
          <Link
            href={
              c.status === "draft"
                ? `/kampagnen/${c.id}`
                : `/kampagnen/${c.id}/versand`
            }
            className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition hover:bg-zinc-50"
          >
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={c.status === "sent" ? "green" : "gray"}>
                  {c.status === "sent" ? "Versandt" : "Entwurf"}
                </Badge>
                <Badge variant="blue">
                  Richtung {c.origin === "recipient" ? "A" : "B"}
                </Badge>
              </div>
              <div className="mt-1 font-medium text-zinc-900">{c.name}</div>
              <div className="text-xs text-zinc-500">
                {new Date(c.createdAt).toLocaleString("de-DE")} ·{" "}
                {c.recipientIds.length} Empfänger
              </div>
            </div>
            <span className="text-xs text-zinc-400">
              {c.status === "draft" ? "Bearbeiten →" : "Details →"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

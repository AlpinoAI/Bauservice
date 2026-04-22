"use client";

import { useState } from "react";
import { Repeat2, ThumbsDown, ThumbsUp, X } from "lucide-react";
import type { Example, Service } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/ui/score-bar";
import { useCampaignStore, type FeedbackVerdict } from "@/lib/campaign-store";
import { betragOf, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  example: Example;
  sprache: "de" | "it";
  recipientId: number;
  service: Service;
  score?: number;
  reason?: string;
  onSwap: () => void;
  onRemove: () => void;
  pinned?: boolean;
};

export function ExampleCard({
  example,
  sprache,
  recipientId,
  service,
  score,
  reason,
  onSwap,
  onRemove,
  pinned,
}: Props) {
  const text =
    sprache === "it" ? example.beschreibungIt : example.beschreibungDe;
  const feedback = useCampaignStore(
    (s) => s.feedback[recipientId]?.[service]?.[example.id] ?? null
  );
  const setFeedbackInStore = useCampaignStore((s) => s.setFeedback);
  const [sending, setSending] = useState(false);
  const betrag = formatCurrency(betragOf(example));

  const rejected = feedback === "passt_nicht";
  const approved = feedback === "passt";

  async function sendFeedback(verdict: FeedbackVerdict) {
    if (sending) return;
    // Toggle off when the same verdict is clicked twice — lets users correct themselves.
    const next: FeedbackVerdict | null = feedback === verdict ? null : verdict;
    setSending(true);
    // Update the store optimistically; the Phase-2 feedback store can reconcile
    // against the real ML-training backend if the POST fails. Until then a
    // silent network error shouldn't prevent the user from marking the item.
    setFeedbackInStore(recipientId, service, example.id, next);
    try {
      if (next !== null) {
        await fetch("/api/dummy/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientId,
            service,
            exampleId: example.id,
            verdict: next,
          }),
        }).catch(() => {
          // In-memory dummy endpoint — swallow network errors, store is already updated.
        });
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className={cn(
        "group relative rounded-md border bg-zinc-50/60 px-3 py-2.5 pr-10 text-sm transition",
        rejected
          ? "border-red-200 bg-red-50/40 opacity-60"
          : approved
            ? "border-emerald-200 bg-emerald-50/30"
            : "border-zinc-200"
      )}
    >
      {!pinned && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Beispiel entfernen"
          title="Entfernen"
          className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded text-zinc-400 transition hover:bg-white hover:text-red-600"
        >
          <X size={14} />
        </button>
      )}
      <div className="mb-1 flex flex-wrap items-center gap-2">
        {example.datum && (
          <span className="text-xs text-zinc-500">{example.datum}</span>
        )}
        {example.bezirk && <Badge variant="neutral">{example.bezirk}</Badge>}
        {example.gewerk && <Badge variant="blue">{example.gewerk}</Badge>}
        {betrag && <Badge variant="gray">{betrag}</Badge>}
        {pinned && <Badge variant="amber">Ursprungs-Service</Badge>}
        {rejected && <Badge variant="red">Ungeeignet</Badge>}
        {approved && <Badge variant="green">Bestätigt</Badge>}
        {typeof score === "number" && (
          <ScoreBar value={score} className="ml-auto" />
        )}
      </div>
      <p
        className={cn(
          "text-zinc-800",
          rejected && "line-through text-zinc-500"
        )}
      >
        {text}
      </p>
      {reason && (
        <p className="mt-1 text-xs italic text-zinc-500">Begründung: {reason}</p>
      )}
      <div className="mt-2 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => sendFeedback("passt")}
            disabled={sending}
            aria-pressed={approved}
            className={cn(
              "inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition",
              approved
                ? "bg-emerald-100 text-emerald-700"
                : "text-zinc-600 hover:bg-white hover:text-emerald-600"
            )}
            title="Passt — als positives Signal für das ML-Training speichern"
          >
            <ThumbsUp size={12} /> Passt
          </button>
          <button
            type="button"
            onClick={() => sendFeedback("passt_nicht")}
            disabled={sending}
            aria-pressed={rejected}
            className={cn(
              "inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition",
              rejected
                ? "bg-red-100 text-red-700"
                : "text-zinc-600 hover:bg-white hover:text-red-600"
            )}
            title="Passt nicht — als negatives Signal für das ML-Training speichern"
          >
            <ThumbsDown size={12} /> Passt nicht
          </button>
        </div>
        {!pinned && (
          <button
            type="button"
            onClick={onSwap}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-600 transition hover:bg-white hover:text-blue-600"
          >
            <Repeat2 size={12} /> Austauschen
          </button>
        )}
      </div>
    </div>
  );
}

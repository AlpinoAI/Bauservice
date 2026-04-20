"use client";

import { useState } from "react";
import { Repeat2, ThumbsDown, ThumbsUp, X } from "lucide-react";
import type { Example, Service } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/ui/score-bar";
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

function betragOf(it: Example): number | undefined {
  if ("betrag" in it) return it.betrag;
  return undefined;
}

function formatCurrency(value?: number): string | null {
  if (typeof value !== "number") return null;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

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
  const [feedback, setFeedback] = useState<"passt" | "passt_nicht" | null>(null);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const betrag = formatCurrency(betragOf(example));

  async function sendFeedback(verdict: "passt" | "passt_nicht") {
    if (feedback || feedbackSending) return;
    setFeedbackSending(true);
    try {
      const res = await fetch("/api/dummy/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          service,
          exampleId: example.id,
          verdict,
        }),
      });
      if (res.ok) setFeedback(verdict);
    } finally {
      setFeedbackSending(false);
    }
  }

  return (
    <div className="group relative rounded-md border border-zinc-200 bg-zinc-50/60 px-3 py-2.5 text-sm">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        {example.datum && (
          <span className="text-xs text-zinc-500">{example.datum}</span>
        )}
        {example.bezirk && <Badge variant="neutral">{example.bezirk}</Badge>}
        {example.gewerk && <Badge variant="blue">{example.gewerk}</Badge>}
        {betrag && <Badge variant="gray">{betrag}</Badge>}
        {pinned && <Badge variant="amber">Ursprungs-Item</Badge>}
        {typeof score === "number" && (
          <ScoreBar value={score} className="ml-auto" />
        )}
      </div>
      <p className="text-zinc-800">{text}</p>
      {reason && (
        <p className="mt-1 text-xs italic text-zinc-500">Begründung: {reason}</p>
      )}
      <div className="mt-2 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => sendFeedback("passt")}
            disabled={feedback !== null || feedbackSending}
            aria-pressed={feedback === "passt"}
            className={cn(
              "inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition",
              feedback === "passt"
                ? "bg-emerald-50 text-emerald-700"
                : "text-zinc-600 hover:bg-white hover:text-emerald-600",
              feedback && feedback !== "passt" ? "opacity-40" : ""
            )}
            title="Passt — als positives Signal für das ML-Training speichern"
          >
            <ThumbsUp size={12} /> Passt
          </button>
          <button
            type="button"
            onClick={() => sendFeedback("passt_nicht")}
            disabled={feedback !== null || feedbackSending}
            aria-pressed={feedback === "passt_nicht"}
            className={cn(
              "inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition",
              feedback === "passt_nicht"
                ? "bg-red-50 text-red-700"
                : "text-zinc-600 hover:bg-white hover:text-red-600",
              feedback && feedback !== "passt_nicht" ? "opacity-40" : ""
            )}
            title="Passt nicht — als negatives Signal für das ML-Training speichern"
          >
            <ThumbsDown size={12} /> Passt nicht
          </button>
        </div>
        {!pinned && (
          <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              onClick={onSwap}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-600 transition hover:bg-white hover:text-blue-600"
            >
              <Repeat2 size={12} /> Austauschen
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-600 transition hover:bg-white hover:text-red-600"
            >
              <X size={12} /> Entfernen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

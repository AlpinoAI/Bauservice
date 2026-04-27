"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, List, Rows3, X } from "lucide-react";
import type { Example, Service, WithScore } from "@/lib/types";
import { useCampaignStore } from "@/lib/campaign-store";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBar } from "@/components/ui/score-bar";
import { cn } from "@/lib/utils";

type Mode = "list" | "detail";

type Props = {
  open: boolean;
  recipientId: number;
  service: Service;
  excludeId: number;
  sprache: "de" | "it";
  onClose: () => void;
  onPick: (newId: number) => void;
};

export function ExampleSwapSheet({
  open,
  recipientId,
  service,
  excludeId,
  sprache,
  onClose,
  onPick,
}: Props) {
  const addToPool = useCampaignStore((s) => s.addToPool);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<WithScore<Example>[]>([]);
  const [mode, setMode] = useState<Mode>("list");
  const [detailIdx, setDetailIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    setMode("list");
    setDetailIdx(0);
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/dummy/matching/examples", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipientId, service, n: 10 }),
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items: WithScore<Example>[] };
        setItems(data.items);
        addToPool(service, data.items);
      } catch {
        // abort
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [open, recipientId, service, addToPool]);

  if (!open) return null;

  const candidates = items.filter((it) => it.id !== excludeId);
  const currentDetail = candidates[detailIdx];

  function handlePick(id: number) {
    onPick(id);
    onClose();
  }

  function prev() {
    if (candidates.length === 0) return;
    setDetailIdx((i) => (i - 1 + candidates.length) % candidates.length);
  }
  function next() {
    if (candidates.length === 0) return;
    setDetailIdx((i) => (i + 1) % candidates.length);
  }

  return (
    <div className="fixed inset-0 z-40 flex" aria-modal role="dialog">
      <div
        className="flex-1 bg-zinc-900/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside className="flex h-full w-full max-w-xl flex-col bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold">Alternative wählen</h2>
            <p className="text-xs text-zinc-500">
              {candidates.length} Vorschläge sortiert nach Relevanz-Score
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex gap-0.5 rounded-md border border-zinc-200 p-0.5">
              <button
                type="button"
                onClick={() => setMode("list")}
                aria-pressed={mode === "list"}
                title="Liste"
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded transition",
                  mode === "list"
                    ? "bg-blue-600 text-white"
                    : "text-zinc-500 hover:bg-zinc-100"
                )}
              >
                <List size={14} />
              </button>
              <button
                type="button"
                onClick={() => setMode("detail")}
                aria-pressed={mode === "detail"}
                title="Detail mit Prev/Next"
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded transition",
                  mode === "detail"
                    ? "bg-blue-600 text-white"
                    : "text-zinc-500 hover:bg-zinc-100"
                )}
              >
                <Rows3 size={14} />
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Schließen"
              className="rounded p-1 text-zinc-500 hover:bg-zinc-100"
            >
              <X size={18} />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && candidates.length === 0 ? (
            <div className="py-10 text-center text-sm text-zinc-500">
              Lade Vorschläge…
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-10 text-center text-sm text-zinc-500">
              Keine Alternativen gefunden.
            </div>
          ) : mode === "list" ? (
            <ul className="space-y-2">
              {candidates.map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(it.id)}
                    className={cn(
                      "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-left text-sm transition",
                      "hover:border-blue-400 hover:bg-blue-50"
                    )}
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {it.datum && (
                        <span className="text-xs text-zinc-500">{formatDate(it.datum)}</span>
                      )}
                      {it.bezirk && <Badge variant="neutral">{it.bezirk}</Badge>}
                      {it.gewerk && <Badge variant="blue">{it.gewerk}</Badge>}
                      <ScoreBar value={it.score} className="ml-auto" />
                    </div>
                    <p>
                      {sprache === "it" ? it.beschreibungIt : it.beschreibungDe}
                    </p>
                    {it.reason && (
                      <p className="mt-1 text-xs italic text-zinc-500">
                        Begründung: {it.reason}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : currentDetail ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Vorheriger Vorschlag"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 transition hover:border-blue-500 hover:text-blue-600"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-zinc-500">
                  {detailIdx + 1} / {candidates.length}
                </span>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Nächster Vorschlag"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 transition hover:border-blue-500 hover:text-blue-600"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="rounded-md border border-zinc-200 bg-white p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {currentDetail.datum && (
                    <span className="text-xs text-zinc-500">
                      {currentDetail.datum}
                    </span>
                  )}
                  {currentDetail.bezirk && (
                    <Badge variant="neutral">{currentDetail.bezirk}</Badge>
                  )}
                  {currentDetail.gewerk && (
                    <Badge variant="blue">{currentDetail.gewerk}</Badge>
                  )}
                  <ScoreBar value={currentDetail.score} className="ml-auto" />
                </div>
                <p className="text-sm text-zinc-900">
                  {sprache === "it"
                    ? currentDetail.beschreibungIt
                    : currentDetail.beschreibungDe}
                </p>
                {currentDetail.reason && (
                  <p className="mt-2 text-xs italic text-zinc-500">
                    Begründung: {currentDetail.reason}
                  </p>
                )}
              </div>
              <Button onClick={() => handlePick(currentDetail.id)}>
                Diesen übernehmen
              </Button>
            </div>
          ) : null}
        </div>
        <footer className="border-t border-zinc-100 px-5 py-3">
          <Button variant="secondary" onClick={onClose} className="w-full">
            Abbrechen
          </Button>
        </footer>
      </aside>
    </div>
  );
}

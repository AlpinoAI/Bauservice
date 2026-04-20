"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Example, Service, WithScore } from "@/lib/types";
import { useCampaignStore } from "@/lib/campaign-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const pool = useCampaignStore((s) => s.examplesByService[service]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<WithScore<Example>[]>([]);

  useEffect(() => {
    if (!open) return;
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
              Vorschläge sortiert nach Relevanz-Score
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100"
          >
            <X size={18} />
          </button>
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
          ) : (
            <ul className="space-y-2">
              {candidates.map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick(it.id);
                      onClose();
                    }}
                    className={cn(
                      "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-left text-sm transition",
                      "hover:border-blue-400 hover:bg-blue-50"
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      {it.datum && (
                        <span className="text-xs text-zinc-500">{it.datum}</span>
                      )}
                      {it.bezirk && <Badge variant="neutral">{it.bezirk}</Badge>}
                      {it.gewerk && <Badge variant="blue">{it.gewerk}</Badge>}
                      <Badge variant="green">
                        Score {Math.round(it.score * 100)}
                      </Badge>
                    </div>
                    <p>
                      {sprache === "it" ? it.beschreibungIt : it.beschreibungDe}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
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

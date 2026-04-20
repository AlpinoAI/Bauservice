"use client";

import { Repeat2, X } from "lucide-react";
import type { Example } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

type Props = {
  example: Example;
  sprache: "de" | "it";
  onSwap: () => void;
  onRemove: () => void;
  pinned?: boolean;
};

export function ExampleCard({
  example,
  sprache,
  onSwap,
  onRemove,
  pinned,
}: Props) {
  const text =
    sprache === "it" ? example.beschreibungIt : example.beschreibungDe;
  return (
    <div className="group relative rounded-md border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-sm">
      <div className="mb-1 flex items-center gap-2">
        {example.datum && (
          <span className="text-xs text-zinc-500">{example.datum}</span>
        )}
        {example.bezirk && <Badge variant="neutral">{example.bezirk}</Badge>}
        {example.gewerk && <Badge variant="blue">{example.gewerk}</Badge>}
        {pinned && <Badge variant="amber">Ursprungs-Item</Badge>}
      </div>
      <p className="text-zinc-800">{text}</p>
      {!pinned && (
        <div className="mt-2 flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
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
  );
}

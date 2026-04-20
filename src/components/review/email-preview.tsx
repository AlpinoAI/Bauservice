"use client";

import { useState } from "react";
import { useCampaignStore } from "@/lib/campaign-store";
import { cn } from "@/lib/utils";

type Props = { recipientId: number };

export function EmailPreview({ recipientId }: Props) {
  const rendered = useCampaignStore((s) => s.renderCache[recipientId]);
  const [tab, setTab] = useState<"html" | "text">("html");

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
        <div className="text-xs font-medium text-zinc-600">Vorschau</div>
        <div className="inline-flex gap-1 rounded-md border border-zinc-200 p-0.5">
          {(["html", "text"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide transition",
                tab === t
                  ? "bg-blue-600 text-white"
                  : "text-zinc-500 hover:bg-zinc-100"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      {!rendered ? (
        <div className="flex h-96 items-center justify-center text-sm text-zinc-500">
          Rendere Vorschau…
        </div>
      ) : tab === "html" ? (
        <iframe
          title={`Email-Vorschau Empfänger ${recipientId}`}
          srcDoc={rendered.html}
          className="h-[700px] w-full border-0"
          sandbox=""
        />
      ) : (
        <pre className="h-[700px] overflow-auto whitespace-pre-wrap bg-zinc-50 p-4 text-xs text-zinc-700">
          {rendered.text}
        </pre>
      )}
    </div>
  );
}

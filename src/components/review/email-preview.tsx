"use client";

import { useState } from "react";
import { useCampaignStore } from "@/lib/campaign-store";
import { cn } from "@/lib/utils";

type Props = { recipientId: number };

const subjectByLang = {
  de: "Aktuelle Bauvorhaben in Ihrer Region",
  it: "Nuovi progetti edili nella vostra zona",
} as const;

export function EmailPreview({ recipientId }: Props) {
  const rendered = useCampaignStore((s) => s.renderCache[recipientId]);
  const draft = useCampaignStore((s) => s.drafts[recipientId]);
  const [tab, setTab] = useState<"html" | "text">("html");

  const name = draft
    ? draft.sprache === "it"
      ? draft.recipient.nameIt
      : draft.recipient.nameDe
    : "";
  const email = draft?.recipient.email ?? "";
  const subject = draft ? subjectByLang[draft.sprache] : subjectByLang.de;

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
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
      {draft && (
        <div className="space-y-0.5 border-b border-zinc-100 bg-zinc-50/60 px-4 py-3 text-xs">
          <div className="flex gap-2">
            <span className="w-14 shrink-0 text-zinc-500">Von:</span>
            <span className="truncate text-zinc-700">info@bauservice.it</span>
          </div>
          <div className="flex gap-2">
            <span className="w-14 shrink-0 text-zinc-500">An:</span>
            <span className="truncate text-zinc-700">
              {name}
              <span className="text-zinc-400"> &lt;{email}&gt;</span>
            </span>
          </div>
          <div className="flex gap-2 pt-1">
            <span className="w-14 shrink-0 text-zinc-500">Betreff:</span>
            <span className="truncate font-medium text-zinc-900">{subject}</span>
          </div>
        </div>
      )}
      {!rendered ? (
        <div className="flex h-[620px] items-center justify-center text-sm text-zinc-500">
          Rendere Vorschau…
        </div>
      ) : tab === "html" ? (
        <iframe
          title={`Email-Vorschau Empfänger ${recipientId}`}
          srcDoc={rendered.html}
          className="h-[620px] w-full border-0"
          sandbox=""
        />
      ) : (
        <pre className="h-[620px] overflow-auto whitespace-pre-wrap bg-zinc-50 p-4 text-xs text-zinc-700">
          {rendered.text}
        </pre>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Info, Pencil, RotateCcw, Save, X } from "lucide-react";
import { useCampaignStore } from "@/lib/campaign-store";
import { getContent } from "@/lib/email-template-content";
import { scenarios, scenariosOrder } from "@/lib/scenarios";
import { DEFAULT_SCENARIO_ID, type ScenarioId } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = { recipientId: number };

function extractInnerBody(doc: string): string {
  const match = doc.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1] : doc;
}

export function EmailPreview({ recipientId }: Props) {
  const rendered = useCampaignStore((s) => s.renderCache[recipientId]);
  const draft = useCampaignStore((s) => s.drafts[recipientId]);
  const setOverride = useCampaignStore((s) => s.setOverride);
  const setDraftScenario = useCampaignStore((s) => s.setDraftScenario);
  const [tab, setTab] = useState<"html" | "text">("html");
  const [editMode, setEditMode] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const sprache = draft?.sprache ?? "de";
  const scenarioId = draft?.scenarioId ?? DEFAULT_SCENARIO_ID;

  const subjectOverride = draft?.overrides.subject;
  const subject =
    subjectOverride ||
    rendered?.subject ||
    getContent(sprache).scenarios[scenarioId].subject;
  const name = draft
    ? draft.sprache === "it"
      ? draft.recipient.nameIt
      : draft.recipient.nameDe
    : "";
  const email = draft?.recipient.email ?? "";

  const bodyHtml = useMemo(
    () => (rendered ? extractInnerBody(rendered.html) : ""),
    [rendered]
  );

  useEffect(() => {
    if (!editMode || !editorRef.current) return;
    editorRef.current.innerHTML = draft?.overrides.bodyHtml || bodyHtml;
  }, [editMode, bodyHtml, draft?.overrides.bodyHtml]);

  function onSaveEdit() {
    if (!editorRef.current) return;
    setOverride(recipientId, "bodyHtml", editorRef.current.innerHTML);
    setEditMode(false);
  }

  function onResetEdit() {
    setOverride(recipientId, "bodyHtml", undefined);
    setEditMode(false);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
        <div className="text-xs font-medium text-zinc-600">Vorschau</div>
        <div className="flex items-center gap-2">
          {!editMode && (
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-700 transition hover:border-blue-500 hover:text-blue-600"
              title="Body inline bearbeiten"
            >
              <Pencil size={11} /> Bearbeiten
            </button>
          )}
          {editMode && (
            <>
              <button
                type="button"
                onClick={onResetEdit}
                className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-700 transition hover:border-red-500 hover:text-red-600"
                title="Änderungen verwerfen"
              >
                <X size={11} /> Zurücksetzen
              </button>
              <button
                type="button"
                onClick={onSaveEdit}
                className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-0.5 text-[11px] font-medium text-white transition hover:bg-blue-700"
              >
                <Save size={11} /> Übernehmen
              </button>
            </>
          )}
          {!editMode && (
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
          )}
        </div>
      </div>
      {draft && (
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 bg-zinc-50/70 px-3 py-2">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500"
            title="Das System schlägt den Kundentyp basierend auf Rolle & Historie des Empfängers vor. Du kannst jederzeit auf einen anderen Typ wechseln."
          >
            Kundentyp
            <Info size={10} className="text-zinc-400" aria-hidden />
          </span>
          <div className="flex flex-wrap gap-1">
            {scenariosOrder.map((id) => {
              const s = scenarios[id];
              const label = sprache === "it" ? s.labelIt : s.labelDe;
              const isActive = scenarioId === id;
              const isSystemPick = id === draft.autoScenarioId;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setDraftScenario(recipientId, id as ScenarioId)
                  }
                  aria-pressed={isActive}
                  title={sprache === "it" ? s.descriptionIt : s.descriptionDe}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition",
                    isActive
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-blue-400 hover:text-blue-700"
                  )}
                >
                  {label}
                  {isSystemPick && (
                    <span
                      aria-hidden
                      title="System-Vorschlag basiert auf Empfängerprofil"
                      className={cn(
                        "text-[9px]",
                        isActive ? "text-blue-100" : "text-amber-500"
                      )}
                    >
                      ★
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {scenarioId !== draft.autoScenarioId && (
            <button
              type="button"
              onClick={() => setDraftScenario(recipientId, draft.autoScenarioId)}
              className="ml-auto inline-flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-600 ring-1 ring-zinc-200 transition hover:text-blue-600"
              title="Auf System-Vorschlag zurücksetzen"
            >
              <RotateCcw size={9} /> Manuell geändert
            </button>
          )}
        </div>
      )}
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
          <div className="flex items-center gap-2 pt-1">
            <span className="w-14 shrink-0 text-zinc-500">Betreff:</span>
            <input
              type="text"
              value={subjectOverride ?? subject}
              onChange={(e) =>
                setOverride(recipientId, "subject", e.target.value)
              }
              className="w-full flex-1 rounded border border-transparent bg-transparent px-1.5 py-0.5 font-medium text-zinc-900 transition hover:border-zinc-200 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      )}
      {!rendered ? (
        <div className="flex h-[620px] items-center justify-center text-sm text-zinc-500">
          Rendere Vorschau…
        </div>
      ) : editMode ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="h-[620px] overflow-auto bg-white p-4 text-sm text-zinc-900 outline-none"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        />
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

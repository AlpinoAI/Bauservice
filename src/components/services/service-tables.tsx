"use client";

import { Check } from "lucide-react";
import type {
  AusschreibungExample,
  BeschlussExample,
  ErgebnisExample,
  KonzessionExample,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { StartCampaignButton } from "@/components/ui/start-campaign-button";
import { KategorienBadges } from "@/components/services/kategorien-badges";
import { formatCurrency } from "@/lib/format";
import { konzessionenTypItToDe } from "@/lib/filter-options";
import { cn } from "@/lib/utils";

// Shared per-service tables used by
//  - /services (Detail + Kampagne-starten pro Zeile)
//  - /kampagnen/neu-aus-item (Single-Select: Zeile klickbar, ausgewählte
//    Zeile blau hinterlegt + Haken-Badge)
// Modus wird über `selectable` + `selectedId` + `onSelect` gesteuert.

export type ServiceTableCommonProps<T> = {
  items: T[];
  loading: boolean;
  // Detail-Modus
  starting?: number | null;
  onStart?: (it: T) => void;
  onDetail?: (it: T) => void;
  // Selection-Modus
  selectable?: boolean;
  selectedId?: number | null;
  onSelect?: (it: T) => void;
};

function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-10 text-center text-zinc-500">
        {text}
      </td>
    </tr>
  );
}

function SelectionIndicator({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-full border transition",
        selected
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-zinc-300 bg-white"
      )}
      aria-hidden
    >
      {selected && <Check size={12} strokeWidth={3} />}
    </span>
  );
}

function RowActions<T extends { id: number }>({
  it,
  starting,
  onStart,
  onDetail,
}: {
  it: T;
  starting?: number | null;
  onStart?: (it: T) => void;
  onDetail?: (it: T) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      {onDetail && (
        <button
          type="button"
          onClick={() => onDetail(it)}
          className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-blue-500 hover:text-blue-700"
        >
          Details
        </button>
      )}
      {onStart && (
        <StartCampaignButton
          disabled={starting != null}
          loading={starting === it.id}
          onClick={() => onStart(it)}
        />
      )}
    </div>
  );
}

function rowClass(selectable: boolean, isSelected: boolean) {
  return cn(
    "align-top transition",
    isSelected ? "bg-blue-50" : "hover:bg-zinc-50",
    selectable && "cursor-pointer"
  );
}

function rowClickHandler<T>(
  selectable: boolean | undefined,
  onSelect: ((it: T) => void) | undefined,
  it: T
) {
  if (!selectable || !onSelect) return undefined;
  return () => onSelect(it);
}

/* --- Ausschreibungen ------------------------------------------------------ */

export function AusschreibungenTable({
  items,
  loading,
  starting,
  onStart,
  onDetail,
  selectable,
  selectedId,
  onSelect,
}: ServiceTableCommonProps<AusschreibungExample>) {
  const cols = 7 + (selectable ? 1 : 0);
  return (
    <table className="w-full text-sm">
      <thead className="border-b border-zinc-100 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        <tr>
          {selectable && <th className="w-10 px-4 py-2" />}
          <th className="px-4 py-2 text-left">Ausschreiber</th>
          <th className="px-4 py-2 text-left">Nummer</th>
          <th className="px-4 py-2 text-left">Beschreibung</th>
          <th className="px-4 py-2 text-left">Kategorien</th>
          <th className="px-4 py-2 text-right">Betrag</th>
          <th className="px-4 py-2 text-left">Termine</th>
          {!selectable && <th className="px-4 py-2" />}
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
        {loading && items.length === 0 ? (
          <EmptyRow cols={cols} text="Lade …" />
        ) : items.length === 0 ? (
          <EmptyRow cols={cols} text="Keine Einträge gefunden." />
        ) : (
          items.map((it) => {
            const isSelected = selectedId === it.id;
            return (
              <tr
                key={it.id}
                className={rowClass(!!selectable, isSelected)}
                onClick={rowClickHandler(selectable, onSelect, it)}
              >
                {selectable && (
                  <td className="px-4 py-2.5">
                    <SelectionIndicator selected={isSelected} />
                  </td>
                )}
                <td className="max-w-[220px] px-4 py-2.5">
                  <div className="font-medium text-zinc-900">
                    {it.ausschreiberName ?? "—"}
                  </div>
                  {it.bezirk && (
                    <div className="text-xs text-zinc-500">{it.bezirk}</div>
                  )}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-xs text-zinc-700">
                  <div>{it.nummer ?? it.id}</div>
                  {it.datum && <div className="text-zinc-500">{it.datum}</div>}
                </td>
                <td className="max-w-[360px] px-4 py-2.5 text-zinc-800">
                  {it.gewerk && (
                    <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                      {it.gewerk}
                    </div>
                  )}
                  <p className="line-clamp-3">{it.beschreibungDe}</p>
                </td>
                <td className="px-4 py-2.5">
                  <KategorienBadges kategorien={it.kategorien} gewerk={it.gewerk} />
                </td>
                <td className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                  {formatCurrency(it.betrag) ?? "—"}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-xs">
                  {it.frist ? (
                    <span className="text-zinc-700">Angebot bis {it.datum}</span>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                {!selectable && (
                  <td className="px-4 py-2.5 text-right">
                    <RowActions
                      it={it}
                      starting={starting}
                      onStart={onStart}
                      onDetail={onDetail}
                    />
                  </td>
                )}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

/* --- Ergebnisse ----------------------------------------------------------- */

export function ErgebnisseTable({
  items,
  loading,
  starting,
  onStart,
  onDetail,
  selectable,
  selectedId,
  onSelect,
}: ServiceTableCommonProps<ErgebnisExample>) {
  const showPunkte = items.some((it) => it.punkteBewertung != null);
  const cols =
    6 + (showPunkte ? 1 : 0) + (selectable ? 1 : 0) + (!selectable ? 1 : 0);
  return (
    <table className="w-full text-sm">
      <thead className="border-b border-zinc-100 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        <tr>
          {selectable && <th className="w-10 px-4 py-2" />}
          <th className="px-4 py-2 text-left">Ausschreiber</th>
          <th className="px-4 py-2 text-left">Nummer</th>
          <th className="px-4 py-2 text-left">Beschreibung</th>
          <th className="px-4 py-2 text-left">Kategorien</th>
          <th className="px-4 py-2 text-left">Ausgang (Zuschlag)</th>
          <th className="px-4 py-2 text-right">Abgebot</th>
          {showPunkte && <th className="px-4 py-2 text-right">Punkte</th>}
          {!selectable && <th className="px-4 py-2" />}
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
        {loading && items.length === 0 ? (
          <EmptyRow cols={cols} text="Lade …" />
        ) : items.length === 0 ? (
          <EmptyRow cols={cols} text="Keine Einträge gefunden." />
        ) : (
          items.map((it) => {
            const isSelected = selectedId === it.id;
            return (
              <tr
                key={it.id}
                className={rowClass(!!selectable, isSelected)}
                onClick={rowClickHandler(selectable, onSelect, it)}
              >
                {selectable && (
                  <td className="px-4 py-2.5">
                    <SelectionIndicator selected={isSelected} />
                  </td>
                )}
                <td className="max-w-[200px] px-4 py-2.5">
                  <div className="font-medium text-zinc-900">
                    {it.ausschreiberName ?? "—"}
                  </div>
                  {it.bezirk && (
                    <div className="text-xs text-zinc-500">{it.bezirk}</div>
                  )}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-xs text-zinc-700">
                  <div>{it.nummer ?? it.ausschreiberName}</div>
                  {it.datum && <div className="text-zinc-500">{it.datum}</div>}
                </td>
                <td className="max-w-[300px] px-4 py-2.5 text-zinc-800">
                  {it.gewerk && (
                    <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                      {it.gewerk}
                    </div>
                  )}
                  <p className="line-clamp-3">{it.beschreibungDe}</p>
                </td>
                <td className="px-4 py-2.5">
                  <KategorienBadges
                    kategorien={it.kategorien}
                    gewerk={it.gewerk}
                  />
                </td>
                <td className="px-4 py-2.5">
                  <div className="font-medium text-zinc-900">
                    {it.teilnehmerNameDe}
                  </div>
                  {it.betrag != null && (
                    <div className="text-xs text-zinc-500">
                      {formatCurrency(it.betrag)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap">
                  {it.prozent != null && (
                    <div className="font-medium text-zinc-700">
                      {it.prozent.toLocaleString("de-DE")}%
                    </div>
                  )}
                  {it.ausschreibungBetrag != null && (
                    <div className="text-zinc-500">
                      aus {formatCurrency(it.ausschreibungBetrag)}
                    </div>
                  )}
                </td>
                {showPunkte && (
                  <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap">
                    {it.punkteBewertung != null
                      ? `${it.punkteBewertung} / 100`
                      : "—"}
                  </td>
                )}
                {!selectable && (
                  <td className="px-4 py-2.5 text-right">
                    <RowActions
                      it={it}
                      starting={starting}
                      onStart={onStart}
                      onDetail={onDetail}
                    />
                  </td>
                )}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

/* --- Beschlüsse & Projekte ------------------------------------------------ */

export function BeschluesseTable({
  items,
  loading,
  starting,
  onStart,
  onDetail,
  selectable,
  selectedId,
  onSelect,
}: ServiceTableCommonProps<BeschlussExample>) {
  const cols = 8 + (selectable ? 1 : 0);
  return (
    <table className="w-full text-sm">
      <thead className="border-b border-zinc-100 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        <tr>
          {selectable && <th className="w-10 px-4 py-2" />}
          <th className="px-4 py-2 text-left">Ausschreiber</th>
          <th className="px-4 py-2 text-left">Beschluss-Nr</th>
          <th className="px-4 py-2 text-left">Datum</th>
          <th className="px-4 py-2 text-left">Bezirk</th>
          <th className="px-4 py-2 text-left">Beschreibung</th>
          <th className="px-4 py-2 text-left">Kategorien</th>
          <th className="px-4 py-2 text-right">Betrag (geschätzt)</th>
          {!selectable && <th className="px-4 py-2" />}
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
        {loading && items.length === 0 ? (
          <EmptyRow cols={cols} text="Lade …" />
        ) : items.length === 0 ? (
          <EmptyRow cols={cols} text="Keine Einträge gefunden." />
        ) : (
          items.map((it) => {
            const isSelected = selectedId === it.id;
            return (
              <tr
                key={it.id}
                className={rowClass(!!selectable, isSelected)}
                onClick={rowClickHandler(selectable, onSelect, it)}
              >
                {selectable && (
                  <td className="px-4 py-2.5">
                    <SelectionIndicator selected={isSelected} />
                  </td>
                )}
                <td className="max-w-[200px] px-4 py-2.5">
                  {it.ausschreiberName ? (
                    <div className="font-medium text-zinc-900">
                      {it.ausschreiberName}
                    </div>
                  ) : (
                    <span
                      className="text-xs text-zinc-400"
                      title="Noch nicht verfügbar — Vergabestellen-Tabelle wird vom Backend nachgeliefert."
                    >
                      —
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-zinc-800">
                  {it.beschlussNr ?? "—"}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-xs text-zinc-700">
                  {it.datum ?? "—"}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {it.bezirk ? (
                    <Badge variant="neutral">{it.bezirk}</Badge>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="max-w-[300px] px-4 py-2.5 text-zinc-800">
                  {it.gewerk && (
                    <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                      {it.gewerk}
                    </div>
                  )}
                  <p className="line-clamp-3">{it.beschreibungDe}</p>
                  {it.status && (
                    <div className="mt-1">
                      <Badge variant="amber">{it.status}</Badge>
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <KategorienBadges
                    kategorien={it.kategorien}
                    gewerk={it.gewerk}
                  />
                </td>
                <td className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                  {formatCurrency(it.geschaetzterBetrag) ?? "—"}
                </td>
                {!selectable && (
                  <td className="px-4 py-2.5 text-right">
                    <RowActions
                      it={it}
                      starting={starting}
                      onStart={onStart}
                      onDetail={onDetail}
                    />
                  </td>
                )}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

/* --- Baukonzessionen ------------------------------------------------------ */

export function KonzessionenTable({
  items,
  loading,
  starting,
  onStart,
  onDetail,
  selectable,
  selectedId,
  onSelect,
}: ServiceTableCommonProps<KonzessionExample>) {
  const cols = 8 + (selectable ? 1 : 0);
  return (
    <table className="w-full text-sm">
      <thead className="border-b border-zinc-100 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        <tr>
          {selectable && <th className="w-10 px-4 py-2" />}
          <th className="px-4 py-2 text-left">Datum</th>
          <th className="px-4 py-2 text-left">Gemeinde</th>
          <th className="px-4 py-2 text-left">Typ</th>
          <th className="px-4 py-2 text-left">Bauherr</th>
          <th className="px-4 py-2 text-left">Projektant</th>
          <th className="px-4 py-2 text-left">Beschreibung</th>
          <th className="px-4 py-2 text-left">Kategorien</th>
          <th className="px-4 py-2 text-left">Bauort</th>
          {!selectable && <th className="px-4 py-2" />}
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
        {loading && items.length === 0 ? (
          <EmptyRow cols={cols + (!selectable ? 1 : 0)} text="Lade …" />
        ) : items.length === 0 ? (
          <EmptyRow
            cols={cols + (!selectable ? 1 : 0)}
            text="Keine Einträge gefunden."
          />
        ) : (
          items.map((it) => {
            const isSelected = selectedId === it.id;
            const typLabel = it.konzessionenTyp
              ? konzessionenTypItToDe[it.konzessionenTyp] ?? it.konzessionenTyp
              : null;
            return (
              <tr
                key={it.id}
                className={rowClass(!!selectable, isSelected)}
                onClick={rowClickHandler(selectable, onSelect, it)}
              >
                {selectable && (
                  <td className="px-4 py-2.5">
                    <SelectionIndicator selected={isSelected} />
                  </td>
                )}
                <td className="px-4 py-2.5 whitespace-nowrap text-xs text-zinc-700">
                  {it.datum ?? "—"}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap font-medium text-zinc-900">
                  {it.gemeinde ?? "—"}
                  {it.bezirk && (
                    <div className="text-xs font-normal text-zinc-500">
                      {it.bezirk}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {typLabel ? (
                    <span
                      title={
                        it.konzessionenTypvariante
                          ? `Variante ${it.konzessionenTypvariante}`
                          : undefined
                      }
                    >
                      <Badge variant="blue">{typLabel}</Badge>
                    </span>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                <td className="max-w-[200px] px-4 py-2.5 font-medium text-zinc-900">
                  {it.name ?? (
                    <span className="font-normal text-zinc-400">—</span>
                  )}
                </td>
                <td className="max-w-[180px] px-4 py-2.5 text-xs text-zinc-700">
                  {it.projektantName ?? (
                    <span className="text-zinc-400">
                      {it.projektantId ? `ID ${it.projektantId}` : "—"}
                    </span>
                  )}
                </td>
                <td className="max-w-[280px] px-4 py-2.5 text-zinc-800">
                  <p className="line-clamp-2 text-zinc-700">
                    {it.beschreibungDe}
                  </p>
                </td>
                <td className="px-4 py-2.5">
                  <KategorienBadges
                    kategorien={it.kategorien}
                    gewerk={it.gewerk}
                  />
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-xs text-zinc-700">
                  {it.adresse ?? "—"}
                  {it.ort && (
                    <div className="text-zinc-500">
                      {it.plz ? `${it.plz} ` : ""}
                      {it.ort}
                    </div>
                  )}
                </td>
                {!selectable && (
                  <td className="px-4 py-2.5 text-right">
                    <RowActions
                      it={it}
                      starting={starting}
                      onStart={onStart}
                      onDetail={onDetail}
                    />
                  </td>
                )}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

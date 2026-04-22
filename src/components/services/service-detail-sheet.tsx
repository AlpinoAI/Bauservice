"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type {
  AusschreibungExample,
  BeschlussExample,
  ErgebnisExample,
  Example,
  KonzessionExample,
  WithScore,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KategorienBadges } from "@/components/services/kategorien-badges";
import { betragOf, formatCurrency } from "@/lib/format";
import { serviceLabels } from "@/lib/filter-options";

type Props = {
  open: boolean;
  item: Example | null;
  onClose: () => void;
  onStartCampaign?: (item: Example) => void;
  starting?: boolean;
};

export function ServiceDetailSheet({
  open,
  item,
  onClose,
  onStartCampaign,
  starting,
}: Props) {
  const [participants, setParticipants] = useState<WithScore<ErgebnisExample>[]>(
    []
  );
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  useEffect(() => {
    if (!open || !item) return;
    if (item.service !== "ausschreibungen") {
      setParticipants([]);
      return;
    }
    const ctrl = new AbortController();
    (async () => {
      setLoadingParticipants(true);
      try {
        const res = await fetch(
          `/api/dummy/sql/items?service=ergebnisse&ausschreibungId=${item.id}&limit=20`,
          { signal: ctrl.signal }
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          items: WithScore<ErgebnisExample>[];
        };
        setParticipants(data.items);
      } catch {
        // ignore
      } finally {
        setLoadingParticipants(false);
      }
    })();
    return () => ctrl.abort();
  }, [open, item]);

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-40 flex" aria-modal role="dialog">
      <div
        className="flex-1 bg-zinc-900/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant="blue">{serviceLabels[item.service]}</Badge>
              {item.datum && (
                <span className="text-xs text-zinc-500">{item.datum}</span>
              )}
              {item.bezirk && <Badge variant="neutral">{item.bezirk}</Badge>}
            </div>
            <h2 className="text-lg font-semibold text-zinc-900">
              {"ausschreiberName" in item && item.ausschreiberName
                ? item.ausschreiberName
                : "gemeinde" in item && item.gemeinde
                  ? item.gemeinde
                  : "Detail"}
            </h2>
            {"nummer" in item && item.nummer && (
              <p className="text-xs text-zinc-500">Nummer: {item.nummer}</p>
            )}
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

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <Section title="Beschreibung">
            <p className="text-sm leading-relaxed text-zinc-800">
              {item.beschreibungDe}
            </p>
            {item.beschreibungIt !== item.beschreibungDe && (
              <p className="mt-2 text-xs italic text-zinc-500">
                {item.beschreibungIt}
              </p>
            )}
          </Section>

          <Section title="Kategorien">
            <KategorienBadges
              kategorien={"kategorien" in item ? item.kategorien : undefined}
              gewerk={item.gewerk}
            />
          </Section>

          <ServiceSpecificFields item={item} />

          {item.service === "ausschreibungen" && (
            <Section title="Teilnehmer & Zuschlag">
              {loadingParticipants ? (
                <div className="text-xs text-zinc-500">Lade Teilnehmer…</div>
              ) : participants.length === 0 ? (
                <div className="text-xs text-zinc-500">
                  Keine Teilnehmerliste verfügbar für diese Ausschreibung.
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {participants.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-zinc-900">
                          {p.teilnehmerNameDe}
                        </div>
                        <div className="text-zinc-500">
                          {p.punkteBewertung != null &&
                            `Punkte ${p.punkteBewertung} / 100 · `}
                          {p.prozent != null && `-${p.prozent}%`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(p.betrag) ?? "—"}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}
        </div>

        <footer className="flex gap-2 border-t border-zinc-100 px-6 py-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Schließen
          </Button>
          {onStartCampaign && (
            <Button
              onClick={() => onStartCampaign(item)}
              disabled={starting}
              className="flex-1"
            >
              {starting ? "Lege an…" : "Kampagne starten"}
            </Button>
          )}
        </footer>
      </aside>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ServiceSpecificFields({ item }: { item: Example }) {
  const rows: Array<{ label: string; value: React.ReactNode }> = [];
  const betrag = betragOf(item);
  if (betrag != null) {
    rows.push({ label: "Betrag", value: formatCurrency(betrag) });
  }

  if (item.service === "ausschreibungen") {
    const a = item as AusschreibungExample;
    if (a.frist) rows.push({ label: "Angebot bis", value: a.frist });
    if (a.cig) rows.push({ label: "CIG", value: a.cig });
    if (a.cup) rows.push({ label: "CUP", value: a.cup });
    if (a.gewinnerId)
      rows.push({ label: "Gewinner-ID", value: String(a.gewinnerId) });
  } else if (item.service === "ergebnisse") {
    const e = item as ErgebnisExample;
    if (e.ausschreiberName)
      rows.push({ label: "Ausschreiber", value: e.ausschreiberName });
    if (e.teilnehmerNameDe)
      rows.push({ label: "Zuschlag an", value: e.teilnehmerNameDe });
    if (e.punkteBewertung != null)
      rows.push({ label: "Punkte", value: `${e.punkteBewertung} / 100` });
    if (e.prozent != null)
      rows.push({ label: "Abgebot", value: `-${e.prozent}%` });
  } else if (item.service === "beschluesse") {
    const b = item as BeschlussExample;
    if (b.beschlussNr)
      rows.push({ label: "Beschluss-Nr", value: b.beschlussNr });
    if (b.beschlussDatum)
      rows.push({ label: "Beschluss-Datum", value: b.beschlussDatum });
    if (b.status) rows.push({ label: "Status", value: b.status });
    if (b.projektyp) rows.push({ label: "Projekttyp", value: b.projektyp });
  } else if (item.service === "baukonzessionen") {
    const k = item as KonzessionExample;
    if (k.gemeinde) rows.push({ label: "Gemeinde", value: k.gemeinde });
    if (k.konzessionenTyp)
      rows.push({ label: "Typ", value: k.konzessionenTyp });
    if (k.name) rows.push({ label: "Bauherr", value: k.name });
    if (k.adresse) rows.push({ label: "Adresse", value: k.adresse });
    if (k.ort) rows.push({ label: "Ort", value: k.ort });
  }

  if (rows.length === 0) return null;

  return (
    <Section title="Details">
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="contents">
            <dt className="text-zinc-500">{r.label}</dt>
            <dd className="font-medium text-zinc-900">{r.value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchFilterBar, type FilterSpec } from "@/components/search-filter-bar";
import { StartCampaignButton } from "@/components/ui/start-campaign-button";
import { Badge } from "@/components/ui/badge";
import { useDebounced } from "@/lib/use-debounced";
import { bezirke, serviceLabels, servicesOrder } from "@/lib/filter-options";
import { scenarioFromService } from "@/lib/scenarios";
import { useStartCampaign } from "@/lib/use-start-campaign";
import { betragOf, formatCurrency } from "@/lib/format";
import type {
  AusschreibungExample,
  BeschlussExample,
  ErgebnisExample,
  Example,
  KonzessionExample,
  Service,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ServicesPage() {
  const [service, setService] = useState<Service>("ausschreibungen");
  const [query, setQuery] = useState("");
  const [bezirk, setBezirk] = useState("");
  const [items, setItems] = useState<Example[]>([]);
  const [loading, setLoading] = useState(false);
  const { start, startingId } = useStartCampaign();
  const starting = typeof startingId === "number" ? startingId : null;
  const debouncedQuery = useDebounced(query, 200);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      const params = new URLSearchParams({ service });
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (bezirk) params.set("bezirk", bezirk);
      params.set("limit", "100");
      try {
        const res = await fetch(`/api/dummy/sql/items?${params}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items: Example[] };
        setItems(data.items);
      } catch {
        // abort
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [service, debouncedQuery, bezirk]);

  const filters: FilterSpec[] = useMemo(
    () => [
      {
        name: "bezirk",
        label: "Bezirk",
        value: bezirk,
        onChange: setBezirk,
        options: bezirke.map((b) => ({ value: b, label: b })),
      },
    ],
    [bezirk]
  );

  function startCampaign(it: Example) {
    void start(it.id, {
      name: `${serviceLabels[service]} · ${it.datum ?? ""} · ID ${it.id}`,
      origin: "item",
      itemRef: { service, itemId: it.id },
      scenarioId: scenarioFromService(service),
    });
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-8 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Services</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Alle vier Service-Quellen in einer Tabelle. Pro Zeile kannst du eine
          Kampagne auf Basis des Eintrags starten — Empfänger kommen
          automatisch aus dem Matching.
        </p>
      </header>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-1">
        {servicesOrder.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setService(s)}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition",
              service === s
                ? "bg-blue-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            )}
            aria-pressed={service === s}
          >
            {serviceLabels[s]}
          </button>
        ))}
      </div>

      <SearchFilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder={`In ${serviceLabels[service]} suchen…`}
        filters={filters}
        totalCount={items.length}
        totalLabel="Einträge"
      />

      <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        {service === "ausschreibungen" && (
          <AusschreibungenTable
            items={items as AusschreibungExample[]}
            loading={loading}
            starting={starting}
            onStart={startCampaign}
          />
        )}
        {service === "ergebnisse" && (
          <ErgebnisseTable
            items={items as ErgebnisExample[]}
            loading={loading}
            starting={starting}
            onStart={startCampaign}
          />
        )}
        {service === "beschluesse" && (
          <BeschluesseTable
            items={items as BeschlussExample[]}
            loading={loading}
            starting={starting}
            onStart={startCampaign}
          />
        )}
        {service === "baukonzessionen" && (
          <KonzessionenTable
            items={items as KonzessionExample[]}
            loading={loading}
            starting={starting}
            onStart={startCampaign}
          />
        )}
      </div>
    </main>
  );
}

type TableBaseProps<T> = {
  items: T[];
  loading: boolean;
  starting: number | null;
  onStart: (it: T) => void;
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

function AusschreibungenTable({
  items,
  loading,
  starting,
  onStart,
}: TableBaseProps<AusschreibungExample>) {
  const cols = 7;
  return (
    <table className="w-full text-sm">
      <thead className="border-b border-zinc-100 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        <tr>
          <th className="px-4 py-2 text-left">Ausschreiber</th>
          <th className="px-4 py-2 text-left">Nummer</th>
          <th className="px-4 py-2 text-left">Beschreibung</th>
          <th className="px-4 py-2 text-left">Kategorien</th>
          <th className="px-4 py-2 text-right">Betrag</th>
          <th className="px-4 py-2 text-left">Termine</th>
          <th className="px-4 py-2" />
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
        {loading && items.length === 0 ? (
          <EmptyRow cols={cols} text="Lade …" />
        ) : items.length === 0 ? (
          <EmptyRow cols={cols} text="Keine Einträge gefunden." />
        ) : (
          items.map((it) => (
            <tr key={it.id} className="align-top transition hover:bg-zinc-50">
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
                {it.datum && (
                  <div className="text-zinc-500">{it.datum}</div>
                )}
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
                <div className="flex flex-wrap gap-1">
                  {(it.kategorien ?? (it.gewerk ? [it.gewerk] : [])).map((k) => (
                    <Badge key={k} variant="neutral">
                      {k}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                {formatCurrency(it.betrag) ?? "—"}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap text-xs">
                {it.frist ? (
                  <span className="text-zinc-700">Angebot bis {it.frist}</span>
                ) : (
                  <span className="text-zinc-400">—</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right">
                <StartCampaignButton
                  disabled={starting !== null}
                  loading={starting === it.id}
                  onClick={() => onStart(it)}
                />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function ErgebnisseTable({
  items,
  loading,
  starting,
  onStart,
}: TableBaseProps<ErgebnisExample>) {
  const cols = 6;
  return (
    <table className="w-full text-sm">
      <thead className="border-b border-zinc-100 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        <tr>
          <th className="px-4 py-2 text-left">Zuschlag an</th>
          <th className="px-4 py-2 text-left">Ausschreibung</th>
          <th className="px-4 py-2 text-left">Beschreibung</th>
          <th className="px-4 py-2 text-right">Betrag</th>
          <th className="px-4 py-2 text-right">Punkte / Rabatt</th>
          <th className="px-4 py-2" />
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
        {loading && items.length === 0 ? (
          <EmptyRow cols={cols} text="Lade …" />
        ) : items.length === 0 ? (
          <EmptyRow cols={cols} text="Keine Einträge gefunden." />
        ) : (
          items.map((it) => (
            <tr key={it.id} className="align-top transition hover:bg-zinc-50">
              <td className="px-4 py-2.5">
                <div className="font-medium text-zinc-900">
                  {it.teilnehmerNameDe}
                </div>
                {it.datum && (
                  <div className="text-xs text-zinc-500">{it.datum}</div>
                )}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap text-xs">
                <div className="text-zinc-700">ID {it.ausschreibungId}</div>
                {it.bezirk && (
                  <div className="text-zinc-500">{it.bezirk}</div>
                )}
              </td>
              <td className="max-w-[360px] px-4 py-2.5 text-zinc-800">
                {it.gewerk && (
                  <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                    {it.gewerk}
                  </div>
                )}
                <p className="line-clamp-3">{it.beschreibungDe}</p>
              </td>
              <td className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                {formatCurrency(it.betrag) ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap">
                {it.punkteBewertung != null && (
                  <div className="font-medium text-zinc-700">
                    {it.punkteBewertung} / 100
                  </div>
                )}
                {it.prozent != null && (
                  <div className="text-zinc-500">−{it.prozent}%</div>
                )}
              </td>
              <td className="px-4 py-2.5 text-right">
                <StartCampaignButton
                  disabled={starting !== null}
                  loading={starting === it.id}
                  onClick={() => onStart(it)}
                />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function BeschluesseTable({
  items,
  loading,
  starting,
  onStart,
}: TableBaseProps<BeschlussExample>) {
  const cols = 7;
  return (
    <table className="w-full text-sm">
      <thead className="border-b border-zinc-100 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        <tr>
          <th className="px-4 py-2 text-left">Beschluss-Nr</th>
          <th className="px-4 py-2 text-left">Datum</th>
          <th className="px-4 py-2 text-left">Bezirk</th>
          <th className="px-4 py-2 text-left">Beschreibung</th>
          <th className="px-4 py-2 text-right">Betrag (geschätzt)</th>
          <th className="px-4 py-2 text-left">Status</th>
          <th className="px-4 py-2" />
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
        {loading && items.length === 0 ? (
          <EmptyRow cols={cols} text="Lade …" />
        ) : items.length === 0 ? (
          <EmptyRow cols={cols} text="Keine Einträge gefunden." />
        ) : (
          items.map((it) => (
            <tr key={it.id} className="align-top transition hover:bg-zinc-50">
              <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-zinc-800">
                {it.beschlussNr ?? "—"}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap text-xs text-zinc-700">
                {it.beschlussDatum ?? it.datum ?? "—"}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                {it.bezirk ? (
                  <Badge variant="neutral">{it.bezirk}</Badge>
                ) : (
                  "—"
                )}
              </td>
              <td className="max-w-[360px] px-4 py-2.5 text-zinc-800">
                {it.gewerk && (
                  <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                    {it.gewerk}
                  </div>
                )}
                <p className="line-clamp-3">{it.beschreibungDe}</p>
              </td>
              <td className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                {formatCurrency(it.geschaetzterBetrag) ?? "—"}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                {it.status && <Badge variant="amber">{it.status}</Badge>}
              </td>
              <td className="px-4 py-2.5 text-right">
                <StartCampaignButton
                  disabled={starting !== null}
                  loading={starting === it.id}
                  onClick={() => onStart(it)}
                />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function KonzessionenTable({
  items,
  loading,
  starting,
  onStart,
}: TableBaseProps<KonzessionExample>) {
  const cols = 6;
  return (
    <table className="w-full text-sm">
      <thead className="border-b border-zinc-100 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        <tr>
          <th className="px-4 py-2 text-left">Gemeinde</th>
          <th className="px-4 py-2 text-left">Typ</th>
          <th className="px-4 py-2 text-left">Bauvorhaben</th>
          <th className="px-4 py-2 text-left">Adresse</th>
          <th className="px-4 py-2 text-left">Datum</th>
          <th className="px-4 py-2" />
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
        {loading && items.length === 0 ? (
          <EmptyRow cols={cols} text="Lade …" />
        ) : items.length === 0 ? (
          <EmptyRow cols={cols} text="Keine Einträge gefunden." />
        ) : (
          items.map((it) => (
            <tr key={it.id} className="align-top transition hover:bg-zinc-50">
              <td className="px-4 py-2.5 whitespace-nowrap font-medium text-zinc-900">
                {it.gemeinde ?? "—"}
                {it.bezirk && (
                  <div className="text-xs font-normal text-zinc-500">
                    {it.bezirk}
                  </div>
                )}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                {it.konzessionenTyp && (
                  <Badge variant="blue">{it.konzessionenTyp}</Badge>
                )}
              </td>
              <td className="max-w-[360px] px-4 py-2.5 text-zinc-800">
                {it.name && (
                  <div className="font-medium text-zinc-900">{it.name}</div>
                )}
                <p className="line-clamp-2 text-zinc-700">{it.beschreibungDe}</p>
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap text-xs text-zinc-700">
                {it.adresse ?? "—"}
                {it.ort && (
                  <div className="text-zinc-500">{it.ort}</div>
                )}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap text-xs text-zinc-700">
                {it.datum ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-right">
                <StartCampaignButton
                  disabled={starting !== null}
                  loading={starting === it.id}
                  onClick={() => onStart(it)}
                />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

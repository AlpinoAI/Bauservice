import type {
  AusschreibungExample,
  BeschlussExample,
  ErgebnisExample,
  Example,
  KonzessionExample,
  Service,
} from "./types";
import { bezirkItToDe } from "./filter-options";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5001";

type DbRow = Record<string, unknown>;
type Filter = { field: string; op: "eq" | "contains"; value: string | number };
type ItemEndpoint = "tenders" | "results" | "projects" | "concessions";

// DB liefert Bezirke italienisch — UI zeigt deutsch. Inverse Map für Filter,
// damit Dropdown-Wert (DE) wieder zum DB-Wert (IT) wird.
const bezirkDeToIt: Record<string, string> = Object.fromEntries(
  Object.entries(bezirkItToDe).map(([it, de]) => [de, it])
);
const toBezirkDe = (it: string | undefined): string | undefined =>
  it ? bezirkItToDe[it] ?? it : undefined;

// Pro Service unterschiedliche DB-Spaltennamen für die Filter.
//   - bezirk: VectorDB_Ausschreibungen.Bezirk vs. VectorDB_Konzessionen.Bezirke_BezeichnungI
//   - q (Suche): Beschreibung_D / BeschreibungD / conz_desc_d (uneinheitliches Schema)
//   - jahr:     Datum (Erstellung) — bei Ergebnissen Datum_Zuschlag (Vergabedatum)
// Gewerk hat in keinem der vier Quellen-Tabellen eine direkte Spalte (gehört in
// VectorDB_Oberkategorie_Unterkategorie und müsste per JOIN reingezogen werden).
// Solange der Endpoint das nicht liefert, wird der Filter unten ignoriert.
type FilterFields = { bezirk: string; q: string; jahr: string };
const filterColumns: Record<ItemEndpoint, FilterFields> = {
  tenders:     { bezirk: "Bezirk",                q: "Beschreibung_D", jahr: "Datum" },
  results:     { bezirk: "Bezirk",                q: "Beschreibung_D", jahr: "Datum_Zuschlag" },
  projects:    { bezirk: "Bezirk",                q: "BeschreibungD",  jahr: "Datum" },
  concessions: { bezirk: "Bezirke_BezeichnungI",  q: "conz_desc_d",    jahr: "Datum" },
};

const str = (v: unknown): string | undefined => {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t || undefined;
};
const num = (v: unknown): number | undefined => {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
};

function mapTender(row: DbRow): AusschreibungExample {
  return {
    id: num(row.AusschreibungenID) ?? 0,
    service: "ausschreibungen",
    datum: str(row.Datum),
    bezirk: toBezirkDe(str(row.Bezirk)),
    beschreibungDe: str(row.Beschreibung_D) ?? "",
    beschreibungIt: str(row.Beschreibung_I) ?? "",
    quelle: { table: "VectorDB_Ausschreibungen", pk: "AusschreibungenID" },
    ausschreiberId: num(row.Ausschreiber_id),
    ausschreiberName: str(row.Ausschreiber_name),
    frist: str(row.DatumOffert),
    betrag: num(row.Betrag),
    cig: str(row.CIG),
    cup: str(row.CUP),
    gewinnerId: num(row.gewinner_id),
  };
}

function mapResult(row: DbRow): ErgebnisExample {
  return {
    id: num(row.AusschreibungenID) ?? 0,
    service: "ergebnisse",
    datum: str(row.Datum_Zuschlag) ?? str(row.Datum),
    bezirk: toBezirkDe(str(row.Bezirk)),
    beschreibungDe: str(row.Beschreibung_D) ?? "",
    beschreibungIt: str(row.Beschreibung_I) ?? "",
    quelle: { table: "VectorDB_Ausschreibungen", pk: "AusschreibungenID" },
    ausschreibungId: num(row.AusschreibungenID) ?? 0,
    ausschreiberId: num(row.Ausschreiber_id),
    ausschreiberName: str(row.Ausschreiber_name),
    teilnehmerId: num(row.gewinner_id) ?? 0,
    teilnehmerNameDe: str(row.Gewinner_name) ?? "",
    teilnehmerNameIt: str(row.Gewinner_name_I) ?? "",
    ausschreibungBetrag: num(row.Betrag),
  };
}

function mapProject(row: DbRow): BeschlussExample {
  return {
    id: num(row.ProjektierungenId) ?? 0,
    service: "beschluesse",
    datum: str(row.Datum),
    bezirk: toBezirkDe(str(row.Bezirk)),
    beschreibungDe: str(row.BeschreibungD) ?? "",
    beschreibungIt: str(row.BeschreibungI) ?? "",
    quelle: { table: "VectorDB_Projektierungen", pk: "ProjektierungenId" },
    ausschreiberName: str(row.Ausschreiber_name),
    beschlussNr: str(row.BeschlussNr),
    status: str(row.Status),
    projekttyp: str(row.Projektyp),
  };
}

function mapConcession(row: DbRow): KonzessionExample {
  return {
    id: num(row.KonzessionenID) ?? 0,
    service: "baukonzessionen",
    datum: str(row.Datum),
    bezirk: toBezirkDe(str(row.Bezirke_BezeichnungI)),
    beschreibungDe: str(row.conz_desc_d) ?? "",
    beschreibungIt: str(row.conz_desc_i) ?? "",
    quelle: { table: "VectorDB_Konzessionen", pk: "KonzessionenID" },
    // `Gemeinde` ist italienisch ("Valle Aurina (BZ)"), `Ort` ist deutsch
    // ("Ahrntal"). UI zeigt deutsch — daher DE-zuerst, IT als Fallback.
    gemeinde: str(row.Ort) ?? str(row.Gemeinde),
    konzessionenTyp: str(row.KonzessionenTyp),
    konzessionenTypvariante: str(row.KonzessionenTypvariante),
    name: str(row.Name),
    adresse: str(row.adresse),
    ort: str(row.Ort),
    plz: str(row.PLZ),
  };
}

export type ItemSearchParams = {
  q?: string;
  bezirk?: string;
  gewerk?: string;
  jahr?: string;
  page?: number;
  limit?: number;
};

function buildFilters(
  params: ItemSearchParams,
  endpoint: ItemEndpoint
): Filter[] {
  const { q, bezirk, gewerk: _gewerk, jahr } = params;
  const cols = filterColumns[endpoint];
  const filters: Filter[] = [];
  if (q) filters.push({ field: cols.q, op: "contains", value: q });
  if (bezirk) {
    filters.push({
      field: cols.bezirk,
      op: "eq",
      value: bezirkDeToIt[bezirk] ?? bezirk,
    });
  }
  // TODO(matthias): Gewerk-Filter braucht Backend-Support (JOIN auf
  // VectorDB_Oberkategorie_Unterkategorie). Bis dahin senden wir ihn nicht
  // mit, damit andere aktive Filter nicht durch ein Backend-400 leerlaufen.
  if (jahr) filters.push({ field: cols.jahr, op: "contains", value: jahr });
  return filters;
}

async function searchItems<T extends Example>(
  endpoint: ItemEndpoint,
  params: ItemSearchParams,
  apiKey: string,
  mapRow: (row: DbRow) => T,
  signal?: AbortSignal
): Promise<{ items: T[]; total: number }> {
  const { page = 0, limit = 20 } = params;
  try {
    const res = await fetch(`${BACKEND_URL}/bauservice/${endpoint}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ filters: buildFilters(params, endpoint), page, page_size: limit }),
      signal,
    });
    if (!res.ok) return { items: [], total: 0 };
    const data = (await res.json()) as { data: DbRow[]; total: number };
    return { items: data.data.map(mapRow), total: data.total };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw err;
    return { items: [], total: 0 };
  }
}

export function searchTenders(
  params: ItemSearchParams,
  apiKey: string,
  signal?: AbortSignal
) {
  return searchItems<AusschreibungExample>("tenders", params, apiKey, mapTender, signal);
}

export function searchResults(
  params: ItemSearchParams,
  apiKey: string,
  signal?: AbortSignal
) {
  return searchItems<ErgebnisExample>("results", params, apiKey, mapResult, signal);
}

export function searchProjects(
  params: ItemSearchParams,
  apiKey: string,
  signal?: AbortSignal
) {
  return searchItems<BeschlussExample>("projects", params, apiKey, mapProject, signal);
}

export function searchConcessions(
  params: ItemSearchParams,
  apiKey: string,
  signal?: AbortSignal
) {
  return searchItems<KonzessionExample>("concessions", params, apiKey, mapConcession, signal);
}

// ID-Lookup für ein einzelnes Item (für Pinned-Item im Item-Flow). Nutzt den
// bestehenden /search-Endpoint mit einem eq-Filter auf das DB-spezifische
// ID-Feld — solange Matthias keinen dedizierten /by-id-Endpoint liefert.
const idFieldByService: Record<Service, { endpoint: ItemEndpoint; field: string }> = {
  ausschreibungen: { endpoint: "tenders", field: "AusschreibungenID" },
  ergebnisse: { endpoint: "results", field: "AusschreibungenID" },
  beschluesse: { endpoint: "projects", field: "ProjektierungenId" },
  baukonzessionen: { endpoint: "concessions", field: "KonzessionenID" },
};

const mapByService: Record<Service, (row: DbRow) => Example> = {
  ausschreibungen: mapTender,
  ergebnisse: mapResult,
  beschluesse: mapProject,
  baukonzessionen: mapConcession,
};

export async function getItemById(
  service: Service,
  id: number,
  apiKey: string,
  signal?: AbortSignal
): Promise<Example | undefined> {
  const { endpoint, field } = idFieldByService[service];
  const mapRow = mapByService[service];
  try {
    const res = await fetch(`${BACKEND_URL}/bauservice/${endpoint}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify({
        filters: [{ field, op: "eq", value: id }],
        page: 0,
        page_size: 1,
      }),
      signal,
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { data: DbRow[] };
    return data.data[0] ? mapRow(data.data[0]) : undefined;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw err;
    return undefined;
  }
}

import type {
  AusschreibungExample,
  BeschlussExample,
  ErgebnisExample,
  Example,
  KonzessionExample,
  Service,
} from "./types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5001";

type DbRow = Record<string, unknown>;
type Filter = { field: string; op: "eq" | "contains"; value: string | number };

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
    bezirk: str(row.Bezirk),
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
    bezirk: str(row.Bezirk),
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
    bezirk: str(row.Bezirk),
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
    bezirk: str(row.Bezirke_BezeichnungI),
    beschreibungDe: str(row.conz_desc_d) ?? "",
    beschreibungIt: str(row.conz_desc_i) ?? "",
    quelle: { table: "VectorDB_Konzessionen", pk: "KonzessionenID" },
    gemeinde: str(row.Gemeinde),
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

function buildFilters(params: ItemSearchParams): Filter[] {
  const { q, bezirk, gewerk, jahr } = params;
  const filters: Filter[] = [];
  if (q) filters.push({ field: "beschreibung_de", op: "contains", value: q });
  if (bezirk) filters.push({ field: "bezirk", op: "eq", value: bezirk });
  if (gewerk) filters.push({ field: "gewerk", op: "eq", value: gewerk });
  if (jahr) filters.push({ field: "datum", op: "contains", value: jahr });
  return filters;
}

async function searchItems<T extends Example>(
  endpoint: string,
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
      body: JSON.stringify({ filters: buildFilters(params), page, page_size: limit }),
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
const idFieldByService: Record<Service, { endpoint: string; field: string }> = {
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

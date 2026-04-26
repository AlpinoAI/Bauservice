import type {
  AusschreibungExample,
  BeschlussExample,
  ErgebnisExample,
  Example,
  KonzessionExample,
} from "./types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5001";

type DbRow = Record<string, unknown>;
type Filter = { field: string; op: "eq" | "contains"; value: string | number };

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
    return { items: data.data as T[], total: data.total };
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
  return searchItems<AusschreibungExample>("tenders", params, apiKey, signal);
}

export function searchResults(
  params: ItemSearchParams,
  apiKey: string,
  signal?: AbortSignal
) {
  return searchItems<ErgebnisExample>("results", params, apiKey, signal);
}

export function searchProjects(
  params: ItemSearchParams,
  apiKey: string,
  signal?: AbortSignal
) {
  return searchItems<BeschlussExample>("projects", params, apiKey, signal);
}

export function searchConcessions(
  params: ItemSearchParams,
  apiKey: string,
  signal?: AbortSignal
) {
  return searchItems<KonzessionExample>("concessions", params, apiKey, signal);
}

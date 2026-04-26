import type { Ansprechpartner, Recipient, RecipientSegment } from "./types";
import { oberkatItToDe } from "./filter-options";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5001";

// Reverse map: German canonical gewerk label → Italian Unterkategorie substring
// for `contains` filter. Built from oberkatItToDe entries that correspond to a
// canonical gewerk label.
const gewerkToItSubstring: Partial<Record<string, string>> = Object.fromEntries(
  Object.entries(oberkatItToDe)
    .filter(([, de]) =>
      [
        "Hochbau",
        "Tiefbau",
        "Elektro",
        "Sanitär",
        "Zimmerei",
        "Tischlerei",
        "Schlosserei",
        "Maler",
        "Hotellerie",
      ].includes(de)
    )
    .map(([it, de]) => [de, it])
);

type DbRow = Record<string, unknown>;
type Filter = { field: string; op: "eq" | "contains"; value: string | number };

function mapRow(row: DbRow): Recipient {
  const sprache = row.Sprache === "Deutsch" ? ("de" as const) : ("it" as const);
  const unterkategorie =
    (row["Unterkategorie_wird_zusammengeführt"] as string) ?? "";
  const gewerk = oberkatItToDe[unterkategorie];

  const nachname = (row.Nachname as string)?.trim();
  let ansprechpartner: Ansprechpartner | undefined;
  if (nachname) {
    ansprechpartner = {
      anrede: row.Geschlecht === "Frau" ? ("Frau" as const) : ("Herr" as const),
      vorname: (row.Vorname as string)?.trim() || undefined,
      nachname,
      titel: (row.Anrede_i as string)?.trim() || undefined,
    };
  }

  return {
    id: row.id as number,
    nameDe: ((row.Kontakt_full_name_D as string) ?? "").trim(),
    nameIt: ((row.Kontakt_full_name_I as string) ?? "").trim(),
    sprache,
    email: ((row.EMailAdresse as string) ?? "").trim(),
    pec: (row.PEC as string)?.trim() || undefined,
    bezirkDe: (row.inBezirk_d as string)?.trim() || undefined,
    provinz: (row.inProvinz_i as string)?.trim() || undefined,
    gewerke: gewerk
      ? [gewerk]
      : unterkategorie
        ? [unterkategorie]
        : undefined,
    ansprechpartner,
    telefon: (row.Telefonnummer as string)?.trim() || undefined,
    handynummer: (row.Handynummer as string)?.trim() || undefined,
    webseite: (row.Webseite as string)?.trim() || undefined,
    anschrift: (row.Anschrift_D as string)?.trim() || undefined,
    plz: (row.Postleitzahl as string)?.trim() || undefined,
    gemeindeDe: (row.inGemeinde_d as string)?.trim() || undefined,
    rollen: {
      // Note: DB field is "Ausscheiber" (typo for Ausschreiber)
      ausschreiber: row.Ausscheiber === 1,
      anbieter: row.Anbieter === 1,
      kunde: row.Kunde === 1,
    },
    aktiv: row.Aktiv === 1,
    optOut: ((row["Keine Werbung senden"] as number) ?? 0) === 1,
    hatHistorie: false, // not available from contacts/search endpoint
  };
}

export type ContactSearchParams = {
  q?: string;
  bezirk?: string;
  rolle?: string;
  gewerk?: string;
  segment?: RecipientSegment;
  page?: number;
  limit?: number;
};

export async function searchContacts(
  params: ContactSearchParams,
  apiKey: string,
  signal?: AbortSignal
): Promise<{ items: Recipient[]; total: number }> {
  const { q, bezirk, rolle, gewerk, segment = "alle", page = 0, limit = 20 } = params;

  const filters: Filter[] = [
    { field: "Aktiv", op: "eq", value: 1 },
    { field: "Keine Werbung senden", op: "eq", value: 0 },
  ];

  if (q) {
    // Backend only supports AND-combined filters; search on primary name field.
    filters.push({ field: "Kontakt_full_name_D", op: "contains", value: q });
  }

  if (bezirk) {
    filters.push({ field: "inBezirk_d", op: "eq", value: bezirk });
  }

  if (rolle === "anbieter") {
    filters.push({ field: "Anbieter", op: "eq", value: 1 });
  } else if (rolle === "ausschreiber") {
    filters.push({ field: "Ausscheiber", op: "eq", value: 1 });
  } else if (rolle === "kunde") {
    filters.push({ field: "Kunde", op: "eq", value: 1 });
  }

  // segment: "bestand" ≈ Kunde=1 (hatHistorie not in this endpoint)
  // segment: "neu" ≈ Anbieter=1 AND Kunde=0
  if (segment === "bestand") {
    filters.push({ field: "Kunde", op: "eq", value: 1 });
  } else if (segment === "neu") {
    filters.push({ field: "Anbieter", op: "eq", value: 1 });
    filters.push({ field: "Kunde", op: "eq", value: 0 });
  }

  if (gewerk) {
    const itSubstring = gewerkToItSubstring[gewerk];
    if (itSubstring) {
      filters.push({
        field: "Unterkategorie_wird_zusammengeführt",
        op: "contains",
        value: itSubstring,
      });
    }
  }

  try {
    const res = await fetch(`${BACKEND_URL}/bauservice/contacts/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ filters, page, page_size: limit }),
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

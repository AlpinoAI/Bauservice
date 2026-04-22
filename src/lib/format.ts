import type { Ansprechpartner, Example, Recipient } from "@/lib/types";

export function formatCurrency(
  value: number | undefined,
  locale: string = "de-DE"
): string | null {
  if (typeof value !== "number") return null;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function betragOf(it: Example): number | undefined {
  if ("betrag" in it && typeof it.betrag === "number") return it.betrag;
  if ("geschaetzterBetrag" in it && typeof it.geschaetzterBetrag === "number")
    return it.geschaetzterBetrag;
  return undefined;
}

export function issuerFor(item: Example): string | undefined {
  if (item.service === "ausschreibungen") return item.ausschreiberName;
  if (item.service === "ergebnisse")
    return item.ausschreiberName ?? item.teilnehmerNameDe;
  if (item.service === "beschluesse") return item.ausschreiberName;
  if (item.service === "baukonzessionen") return item.gemeinde ?? item.name;
  return undefined;
}

export function refNumberFor(item: Example): string | undefined {
  if (item.service === "ausschreibungen") return item.nummer;
  if (item.service === "ergebnisse") return item.nummer;
  if (item.service === "beschluesse") return item.beschlussNr;
  if (item.service === "baukonzessionen") return item.konzessionenTyp;
  return undefined;
}

export function isBestandskunde(r: Recipient): boolean {
  return r.rollen.kunde || r.hatHistorie;
}

export function ansprechpartnerLabel(
  ap: Ansprechpartner | undefined
): string | null {
  if (!ap) return null;
  const parts = [ap.anrede, ap.titel, ap.vorname, ap.nachname].filter(Boolean);
  return parts.join(" ");
}

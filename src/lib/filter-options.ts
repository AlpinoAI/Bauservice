import type { Service } from "@/lib/types";

export const bezirke = [
  "Eisacktal",
  "Pustertal",
  "Burggrafenamt",
  "Vinschgau",
  "Bozen",
  "Überetsch Unterland",
  "Salten-Schlern",
  "Wipptal",
] as const;
export type Bezirk = (typeof bezirke)[number];

export const gewerke = [
  "Hochbau",
  "Tiefbau",
  "Elektro",
  "Sanitär",
  "Zimmerei",
  "Tischlerei",
  "Schlosserei",
  "Maler",
  "Planung",
  "Hotellerie",
] as const;
export type Gewerk = (typeof gewerke)[number];

// Bauservice-DB liefert Bezirke nur italienisch aus Projektierungen/Konzessionen
// und gemischt aus Ausschreibungen. Für Vergleich mit Empfänger-`bezirkDe` brauchen
// wir die DE-Variante; hier statisch, bis der Endpoint es selber mitliefert.
export const bezirkItToDe: Record<string, Bezirk> = {
  "Val Pusteria": "Pustertal",
  "Valle Isarco": "Eisacktal",
  "Val Venosta": "Vinschgau",
  Burgraviato: "Burggrafenamt",
  "Oltradige Bassa Atesina": "Überetsch Unterland",
  Bolzano: "Bozen",
  "Salto Sciliar": "Salten-Schlern",
  "Alta Valle Isarco": "Wipptal",
};

export const rollenOptions = [
  { value: "anbieter", label: "Anbieter" },
  { value: "ausschreiber", label: "Ausscheiber" },
  { value: "kunde", label: "Kunde" },
] as const;

export const serviceLabels: Record<Service, string> = {
  ausschreibungen: "Ausschreibungen",
  ergebnisse: "Ergebnisse",
  beschluesse: "Beschlüsse & Projekte",
  baukonzessionen: "Baukonzessionen",
};

export const servicesOrder: Service[] = [
  "ausschreibungen",
  "ergebnisse",
  "beschluesse",
  "baukonzessionen",
];

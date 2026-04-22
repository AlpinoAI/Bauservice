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

// VectorDB_Oberkategorie_Unterkategorie.Oberkat liegt nur italienisch vor.
// Katalog der 28 distinkten Werte (Stand DB-Snapshot 2026-04-22). Fehlende
// Keys fallen im UI auf den Originalwert zurück.
export const oberkatItToDe: Record<string, string> = {
  "Acquisto/vendita immobili": "Immobilien",
  Agricoltura: "Landwirtschaft",
  "Altri settore edile": "Sonstiger Bau",
  "Ampliamento residenziale": "Erweiterung Wohnbau",
  "Artigianato/Industria": "Handwerk/Industrie",
  "Falegname/Arredatore": "Tischlerei",
  "Hard- und Software": "Hard- und Software",
  Hotels: "Hotellerie",
  "Impianti solari": "Solaranlagen",
  "Impianti sportivi": "Sportanlagen",
  Impiantistica: "Anlagentechnik",
  "Impianto sportivo/ricreativo": "Sport-/Freizeitanlage",
  "Nuova costruzione residenziale": "Neubau Wohnbau",
  "Opere da carpentiere e lattoniere": "Zimmerei/Spengler",
  "Opere da elettricista": "Elektro",
  "Opere da fabbro": "Schlosserei",
  "Opere da idraulico": "Sanitär",
  "Opere da imbianchino e restauro": "Maler/Restaurierung",
  "Opere da pavimentista": "Bodenleger",
  "Opere edili - edilizia": "Hochbau",
  "Opere edili sottosuolo": "Tiefbau",
  "Opere infrastrutturali": "Infrastruktur",
  "Opere pubbliche (edilizia)": "Öffentliche Bauten",
  "Raccolta/trasporto rifiuti e rifiuti riciclabili": "Abfallwirtschaft",
  "Risanamento residenziale": "Sanierung Wohnbau",
  "Servizi tecnici": "Technische Dienste",
  "Sgombero neve": "Räumdienst",
  Turismo: "Fremdenverkehr",
};

export const rollenOptions = [
  { value: "anbieter", label: "Anbieter" },
  { value: "ausschreiber", label: "Ausschreiber" },
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

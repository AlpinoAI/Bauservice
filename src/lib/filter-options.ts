import type { Service } from "@/lib/types";

export const bezirke = [
  "Eisacktal",
  "Pustertal",
  "Burggrafenamt",
  "Vinschgau",
  "Bozen",
] as const;

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

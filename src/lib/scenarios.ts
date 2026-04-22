import type { ScenarioId } from "@/lib/types";

export type ScenarioMeta = {
  id: ScenarioId;
  labelDe: string;
  labelIt: string;
  descriptionDe: string;
  descriptionIt: string;
};

export const scenariosOrder: ScenarioId[] = ["A", "B", "C", "D"];

export const scenarios: Record<ScenarioId, ScenarioMeta> = {
  A: {
    id: "A",
    labelDe: "Bestandskunde",
    labelIt: "Cliente esistente",
    descriptionDe: "Empfänger ist bereits Bauservice-Kunde. Follow-up-Ton, keine Cold-Intro.",
    descriptionIt: "Il destinatario è già cliente Bauservice. Tono follow-up, niente cold intro.",
  },
  B: {
    id: "B",
    labelDe: "Neukunde · Zuschlag-Gewinner",
    labelIt: "Nuovo cliente · Aggiudicatario",
    descriptionDe:
      "Neukunde hat soeben eine Ausschreibung gewonnen. Trigger wie Goldstandard DE: Glückwunsch zum Zuschlag.",
    descriptionIt:
      "Nuovo cliente aggiudicatario di una gara. Trigger come goldstandard DE: Congratulazioni per l aggiudicazione.",
  },
  C: {
    id: "C",
    labelDe: "Neukunde · Ausschreibungs-Teilnehmer",
    labelIt: "Nuovo cliente · Partecipante",
    descriptionDe:
      "Neukunde hat teilgenommen, aber nicht gewonnen. Trigger wie Goldstandard IT: Der Zuschlag ging an X, hier kommen ähnliche Gelegenheiten.",
    descriptionIt:
      "Nuovo cliente partecipante ma non aggiudicatario. Trigger come goldstandard IT: aggiudicazione andata a X, ecco opportunità simili.",
  },
  D: {
    id: "D",
    labelDe: "Neukunde · Kaltakquise",
    labelIt: "Nuovo cliente · Contatto freddo",
    descriptionDe:
      "Kein spezifischer Trigger. Generische Werbemail mit Beispiel-Ausschreibungen und Value-Proposition.",
    descriptionIt:
      "Nessun trigger specifico. Email generica con esempi di gare e value proposition.",
  },
};

/**
 * Klassifiziert einen Kontakt in ein Kunden-Typ-Szenario.
 * Priorität: Gewinner/Teilnehmer schlägt Bestand, damit der Item-Trigger auch bei
 * Bestandskunden im Mittelpunkt steht.
 */
export function classifyRecipient(params: {
  isGewinner: boolean;
  isTeilnehmer: boolean;
  isKunde: boolean;
}): ScenarioId {
  if (params.isGewinner) return "B";
  if (params.isTeilnehmer) return "C";
  if (params.isKunde) return "A";
  return "D";
}

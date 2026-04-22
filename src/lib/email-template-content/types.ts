import type { ScenarioId, Service, Sprache } from "@/lib/types";

export type ScenarioContent = {
  preview: string;
  subject: string;
  salutationPrefix: string;
  salutationFallback: string;
  hook: string;
  bridge: string;
  examplesHeading: string;
  ctaOpening: string;
  ctaClosing: string;
};

export type Signature = {
  senderName: string;
  companyLine: string;
  streetLine: string;
  cityLine: string;
  tel: string;
  fax: string;
  email: string;
  website: string;
};

export type MetaLabels = {
  datum: string;
  bezirk: string;
  betrag: string;
  gewerk: string;
  ausschreiber: string;
  vergabeBetrag: string;
  zuschlagAn: string;
  nachlass: string;
  bekanntmachung: string;
  beschlussNr: string;
  beschlussDatum: string;
  geschaetzterBetrag: string;
  status: string;
  projekttyp: string;
  gemeinde: string;
  konzessionsTyp: string;
  bauherr: string;
};

/** Strukturierte Anrede für einen Ansprechpartner mit Geschlecht. */
export type PersonSalutation = {
  /** "Sehr geehrter Herr" / "Egregio Sig." */
  herr: string;
  /** "Sehr geehrte Frau" / "Gentile Sig.ra" */
  frau: string;
};

export type ContentPack = {
  sprache: Sprache;
  locale: string;
  valueProps: string[];
  urgency: string;
  optOutDisclaimer: string;
  signature: Signature;
  serviceLabels: Record<Service, string>;
  metaLabels: MetaLabels;
  personSalutation: PersonSalutation;
  scenarios: Record<ScenarioId, ScenarioContent>;
};

export const DESCRIPTION_CUT_CHARS = 140;

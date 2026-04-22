export type Service =
  | "ausschreibungen"
  | "ergebnisse"
  | "beschluesse"
  | "baukonzessionen";

export type Sprache = "de" | "it";

export type ScenarioId = "A" | "B" | "C" | "D";

export type Recipient = {
  id: number;
  nameDe: string;
  nameIt: string;
  sprache: Sprache;
  email: string;
  pec?: string;
  bezirkDe?: string;
  provinz?: string;
  gewerke?: string[];
  rollen: {
    ausschreiber: boolean;
    anbieter: boolean;
    kunde: boolean;
  };
  aktiv: boolean;
  optOut: boolean;
  hatHistorie: boolean;
};

export type RecipientSegment = "neu" | "bestand" | "alle";

export type ExampleBase = {
  id: number;
  service: Service;
  datum?: string;
  bezirk?: string;
  beschreibungDe: string;
  beschreibungIt: string;
  gewerk?: string;
  quelle: { table: string; pk: string };
};

export type AusschreibungExample = ExampleBase & {
  service: "ausschreibungen";
  ausschreiberId?: number;
  ausschreiberName?: string;
  nummer?: string;
  kategorien?: string[];
  frist?: string;
  betrag?: number;
  cig?: string;
  cup?: string;
  gewinnerId?: number;
};

export type ErgebnisExample = ExampleBase & {
  service: "ergebnisse";
  ausschreibungId: number;
  teilnehmerId: number;
  teilnehmerNameDe: string;
  teilnehmerNameIt: string;
  betrag?: number;
  punkteBewertung?: number;
  prozent?: number;
};

export type BeschlussExample = ExampleBase & {
  service: "beschluesse";
  beschlussNr?: string;
  beschlussDatum?: string;
  betrag?: number;
  geschaetzterBetrag?: number;
  status?: string;
};

export type KonzessionExample = ExampleBase & {
  service: "baukonzessionen";
  gemeinde?: string;
  konzessionenTyp?: string;
  name?: string;
  adresse?: string;
  ort?: string;
};

export type Example =
  | AusschreibungExample
  | ErgebnisExample
  | BeschlussExample
  | KonzessionExample;

export type WithScore<T> = T & { score: number; reason?: string };

export type Campaign = {
  id: string;
  name: string;
  status: "draft" | "sent";
  origin: "recipient" | "item";
  itemRef?: { service: Service; itemId: number };
  recipientIds: number[];
  scenarioId?: ScenarioId;
  createdAt: string;
  createdBy: string;
};

export type RenderPayload = {
  templateId: string;
  sprache: Sprache;
  scenarioId?: ScenarioId;
  payload: {
    recipient: { nameDe: string; nameIt: string };
    examples: Record<Service, Example[]>;
    serviceEnabled: Record<Service, boolean>;
    overrides?: { salutation?: string; intro?: string; cta?: string };
  };
};

export type RenderResult = {
  html: string;
  text: string;
};

export type SendResult = {
  jobId: string;
  accepted: number[];
  rejected: Array<{ recipientId: number; reason: string }>;
  demoMode: true;
};

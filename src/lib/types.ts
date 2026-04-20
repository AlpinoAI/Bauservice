export type Service =
  | "ausschreibungen"
  | "ergebnisse"
  | "beschluesse"
  | "baukonzessionen";

export type Sprache = "de" | "it";

export type Recipient = {
  id: number;
  nameDe: string;
  nameIt: string;
  sprache: Sprache;
  email: string;
  pec?: string;
  bezirkDe?: string;
  provinz?: string;
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

export type WithScore<T> = T & { score: number };

export type Campaign = {
  id: string;
  name: string;
  status: "draft" | "sent";
  origin: "recipient" | "item";
  itemRef?: { service: Service; itemId: number };
  createdAt: string;
  createdBy: string;
  recipientCount: number;
};

export type RenderPayload = {
  templateId: string;
  sprache: Sprache;
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

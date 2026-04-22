export type Service =
  | "ausschreibungen"
  | "ergebnisse"
  | "beschluesse"
  | "baukonzessionen";

export type Sprache = "de" | "it";

export type ScenarioId = "A" | "B" | "C" | "D";

export const DEFAULT_SCENARIO_ID: ScenarioId = "D";

export type Ansprechpartner = {
  /** Aus VectorDB_Kontakte.Geschlecht abgeleitet. Steuert "Herr/Frau" bzw. "Signor/Signora". */
  anrede: "Herr" | "Frau";
  vorname?: string;
  nachname: string;
  /** Berufstitel aus VectorDB_Kontakte.Anrede_i — z.B. "Ing.", "Arch.", "Geom.". */
  titel?: string;
};

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
  ansprechpartner?: Ansprechpartner;
  /** VectorDB_Kontakte.Telefonnummer — 94 % Coverage. */
  telefon?: string;
  /** VectorDB_Kontakte.Handynummer — 33 %. */
  handynummer?: string;
  /** VectorDB_Kontakte.Webseite — 44 %. Ohne `https://` gespeichert. */
  webseite?: string;
  /** VectorDB_Kontakte.Anschrift_D — 99.7 %. */
  anschrift?: string;
  /** VectorDB_Kontakte.Postleitzahl. */
  plz?: string;
  /** VectorDB_Kontakte.inGemeinde_d — feiner als `bezirkDe`. */
  gemeindeDe?: string;
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
  ausschreiberId?: number;
  ausschreiberName?: string;
  teilnehmerId: number;
  teilnehmerNameDe: string;
  teilnehmerNameIt: string;
  nummer?: string;
  kategorien?: string[];
  ausschreibungBetrag?: number;
  betrag?: number;
  punkteBewertung?: number;
  prozent?: number;
};

export type BeschlussExample = ExampleBase & {
  service: "beschluesse";
  ausschreiberName?: string;
  nummer?: string;
  kategorien?: string[];
  beschlussNr?: string;
  beschlussDatum?: string;
  betrag?: number;
  geschaetzterBetrag?: number;
  status?: string;
  projekttyp?: string;
};

export type KonzessionExample = ExampleBase & {
  service: "baukonzessionen";
  kategorien?: string[];
  gemeinde?: string;
  konzessionenTyp?: string;
  /** VectorDB_Konzessionen.KonzessionenTypvariante — z.B. "AA", "B", "DR". */
  konzessionenTypvariante?: string;
  /** VectorDB_Konzessionen.Name — Bauherr (Person oder Firma). */
  name?: string;
  adresse?: string;
  ort?: string;
  plz?: string;
  /** VectorDB_Konzessionen.Projektant — oft 0/unauflösbar. */
  projektantId?: number;
  /** Aus `Projektant` via Kontakte-Join. */
  projektantName?: string;
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

export type EmailOverrides = {
  salutation?: string;
  hook?: string;
  bridge?: string;
  cta?: string;
  /** Full-body HTML override coming from the inline WYSIWYG editor. Renderer bypasses template composition when set. */
  bodyHtml?: string;
  /** Subject-line override from the editor. */
  subject?: string;
  /** Name of the human sender shown in the signature block. */
  senderName?: string;
};

export type RenderPayload = {
  templateId: string;
  sprache: Sprache;
  scenarioId?: ScenarioId;
  payload: {
    recipient: {
      nameDe: string;
      nameIt: string;
      ansprechpartner?: Ansprechpartner;
    };
    examples: Record<Service, Example[]>;
    serviceEnabled: Record<Service, boolean>;
    overrides?: EmailOverrides;
    /** Resolves `{itemTitle}` placeholders in subject and trigger openings. */
    pinnedExample?: Example;
  };
};

export type RenderResult = {
  html: string;
  text: string;
  subject: string;
};

export type SendResult = {
  jobId: string;
  accepted: number[];
  rejected: Array<{ recipientId: number; reason: string }>;
  demoMode: true;
};

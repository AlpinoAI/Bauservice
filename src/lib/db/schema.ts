/**
 * Drizzle-Schemas für die vorzuschlagenden Frontend-Views auf der Bauservice-DB.
 * Die Views selbst baut Matthias serverseitig (siehe docs/sql-views-ddl-vorschlag.md).
 * Das Frontend liest ausschließlich lesend.
 *
 * Alle Views sind aus Sicht des Frontends bereits *gefiltert*:
 * - Opt-out (`Keine_Werbung_senden = 1`) und `Aktiv = 0` sind serverseitig aus
 *   `v_frontend_recipients` ausgeblendet (vgl. docs/backend-endpoints-kontrakt.md § 9).
 * - Bezirke in it/de-Inkonsistenzen sind in der View vereinheitlicht (DE-Seite).
 */
import {
  mysqlTable,
  int,
  tinyint,
  varchar,
  text,
  decimal,
  date,
  timestamp,
} from "drizzle-orm/mysql-core";

export const vFrontendRecipients = mysqlTable("v_frontend_recipients", {
  id: int("id").primaryKey(),
  nameDe: varchar("name_de", { length: 255 }).notNull(),
  nameIt: varchar("name_it", { length: 255 }).notNull(),
  sprache: varchar("sprache", { length: 10 }).notNull(),
  email: varchar("email", { length: 250 }).notNull(),
  pec: varchar("pec", { length: 250 }),
  bezirkDe: varchar("bezirk_de", { length: 50 }),
  provinz: varchar("provinz", { length: 50 }),
  // Komma-separierte Liste aus der View; Mapper muss `.split(",")` → `string[]`
  // durchführen, damit das TS-Modell (`Recipient.gewerke?: string[]`) passt.
  gewerke: varchar("gewerke", { length: 500 }),
  ansprechpartnerVorname: varchar("ansprechpartner_vorname", { length: 50 }),
  ansprechpartnerNachname: varchar("ansprechpartner_nachname", { length: 50 }),
  ansprechpartnerGeschlecht: varchar("ansprechpartner_geschlecht", { length: 20 }),
  ansprechpartnerTitel: varchar("ansprechpartner_titel", { length: 50 }),
  rolleAusschreiber: tinyint("rolle_ausschreiber").notNull(),
  rolleAnbieter: tinyint("rolle_anbieter").notNull(),
  rolleKunde: tinyint("rolle_kunde").notNull(),
  aktiv: tinyint("aktiv").notNull(),
  optOut: tinyint("opt_out").notNull(),
  hatHistorie: tinyint("hat_historie").notNull(),
});

export const vFrontendAusschreibungen = mysqlTable(
  "v_frontend_ausschreibungen",
  {
    id: int("id").primaryKey(),
    datum: date("datum"),
    bezirk: varchar("bezirk", { length: 50 }),
    gewerk: varchar("gewerk", { length: 100 }),
    beschreibungDe: text("beschreibung_de").notNull(),
    beschreibungIt: text("beschreibung_it").notNull(),
    ausschreiberId: int("ausschreiber_id"),
    ausschreiberName: varchar("ausschreiber_name", { length: 255 }),
    nummer: varchar("nummer", { length: 50 }),
    kategorien: varchar("kategorien", { length: 500 }),
    frist: date("frist"),
    betrag: decimal("betrag", { precision: 14, scale: 2 }),
    cig: varchar("cig", { length: 30 }),
    cup: varchar("cup", { length: 30 }),
    gewinnerId: int("gewinner_id"),
  }
);

export const vFrontendErgebnisse = mysqlTable("v_frontend_ergebnisse", {
  id: int("id").primaryKey(),
  datum: date("datum"),
  bezirk: varchar("bezirk", { length: 50 }),
  gewerk: varchar("gewerk", { length: 100 }),
  beschreibungDe: text("beschreibung_de").notNull(),
  beschreibungIt: text("beschreibung_it").notNull(),
  ausschreibungId: int("ausschreibung_id").notNull(),
  ausschreiberId: int("ausschreiber_id"),
  ausschreiberName: varchar("ausschreiber_name", { length: 255 }),
  teilnehmerId: int("teilnehmer_id").notNull(),
  teilnehmerNameDe: varchar("teilnehmer_name_de", { length: 255 }).notNull(),
  teilnehmerNameIt: varchar("teilnehmer_name_it", { length: 255 }).notNull(),
  nummer: varchar("nummer", { length: 50 }),
  kategorien: varchar("kategorien", { length: 500 }),
  ausschreibungBetrag: decimal("ausschreibung_betrag", { precision: 14, scale: 2 }),
  betrag: decimal("betrag", { precision: 14, scale: 2 }),
  punkteBewertung: decimal("punkte_bewertung", { precision: 6, scale: 2 }),
  prozent: decimal("prozent", { precision: 6, scale: 2 }),
});

export const vFrontendBeschluesse = mysqlTable("v_frontend_beschluesse", {
  id: int("id").primaryKey(),
  datum: date("datum"),
  bezirk: varchar("bezirk", { length: 50 }),
  gewerk: varchar("gewerk", { length: 100 }),
  beschreibungDe: text("beschreibung_de").notNull(),
  beschreibungIt: text("beschreibung_it").notNull(),
  ausschreiberName: varchar("ausschreiber_name", { length: 255 }),
  nummer: varchar("nummer", { length: 50 }),
  kategorien: varchar("kategorien", { length: 500 }),
  beschlussNr: varchar("beschluss_nr", { length: 50 }),
  beschlussDatum: date("beschluss_datum"),
  betrag: decimal("betrag", { precision: 14, scale: 2 }),
  geschaetzterBetrag: decimal("geschaetzter_betrag", { precision: 14, scale: 2 }),
  status: varchar("status", { length: 50 }),
  projekttyp: varchar("projekttyp", { length: 100 }),
});

export const vFrontendKonzessionen = mysqlTable("v_frontend_konzessionen", {
  id: int("id").primaryKey(),
  datum: date("datum"),
  bezirk: varchar("bezirk", { length: 50 }),
  gewerk: varchar("gewerk", { length: 100 }),
  beschreibungDe: text("beschreibung_de").notNull(),
  beschreibungIt: text("beschreibung_it").notNull(),
  kategorien: varchar("kategorien", { length: 500 }),
  gemeinde: varchar("gemeinde", { length: 100 }),
  konzessionenTyp: varchar("konzessionen_typ", { length: 100 }),
  name: varchar("name", { length: 255 }),
  adresse: varchar("adresse", { length: 255 }),
  ort: varchar("ort", { length: 100 }),
});

/**
 * Persistente Kampagnen-Metadaten. Der Name/Status/Item-Ref-Teil ist Frontend-kanonisch,
 * die Tabelle kann entweder auf der Bauservice-DB oder auf einer separaten
 * Kampagnen-DB leben (Matthias entscheidet).
 */
export const campaigns = mysqlTable("campaigns", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(), // draft | sent
  origin: varchar("origin", { length: 20 }).notNull(), // recipient | item
  itemRefService: varchar("item_ref_service", { length: 30 }),
  itemRefItemId: int("item_ref_item_id"),
  scenarioId: varchar("scenario_id", { length: 4 }),
  createdBy: varchar("created_by", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  sentAt: timestamp("sent_at"),
});

export const campaignRecipients = mysqlTable("campaign_recipients", {
  campaignId: varchar("campaign_id", { length: 64 }).notNull(),
  recipientId: int("recipient_id").notNull(),
});

/**
 * ML-Feedback-Log: jeder "Passt"/"Passt nicht"-Klick. Append-only;
 * Matthias' Matching pflegt die Signale in seine Score-Formel ein.
 */
export const mlFeedback = mysqlTable("ml_feedback", {
  id: int("id").primaryKey().autoincrement(),
  recipientId: int("recipient_id").notNull(),
  service: varchar("service", { length: 30 }).notNull(),
  exampleId: int("example_id").notNull(),
  verdict: varchar("verdict", { length: 20 }).notNull(), // passt | passt_nicht
  note: text("note"),
  mitarbeiterId: varchar("mitarbeiter_id", { length: 100 }),
  at: timestamp("at").notNull().defaultNow(),
});

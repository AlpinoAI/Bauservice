# Frontendkonzept — Bauservice Email-Automation

**Session 1 · 2026-04-20 · Status: Entwurf, Rev 2 nach Scope-Alignment**

Dieses Dokument beschreibt das Zielbild des Next.js-Frontends für die AI-Powered Email-Automation von Bauservice. Es klärt Seitenstruktur, Komponenten-Inventar, State-Management, Integrationspunkte und offene Fragen, damit die Implementierung auf einer geteilten Grundlage starten kann. Implementiert wird später — heute nur Konzept.

Alle externen Systeme werden in dieser Phase gegen **Dummy-Endpoints** angesprochen; der Swap auf echte Backends (Weaviate, SQL-Views, Mailjet) erfolgt in Phase 2.

**Zuständigkeiten im Team:**
- **Julian** — Frontend (Next.js-App, Komponenten, Review-Flow) und Email-Templates (MJML, Rendering, Plain-Text-Fallback).
- **Matthias** — Matching-Logik, Bestands-DB (Views, Opt-out-Filter), Weaviate-Vektorisierung, Reindex-Pipeline.

Die Integrationsgrenze läuft über die Dummy-Endpoints in § 5. Julian liefert die Request-Shapes, Matthias liefert die Responses.

---

## 0. Phase-1-Scope (MVP)

Bauservice ist ein kleiner Kunde (3.900 EUR einmalig + 65 EUR/Monat, 6 Wochen, 1–3 interne Nutzer). Das Frontend muss den Kern-Use-Case wasserdicht abdecken, darf aber **keinen Enterprise-Ballast** mitschleppen. Alles unten Gelistete wird bewusst aus Phase 1 ausgeschlossen und kann nach Go-live nachgezogen werden.

**In Phase 1 enthalten:**
- Bidirektionaler Einstieg: Kampagne starten **aus Kontakt** oder **aus einzelnem Item** (Ausschreibung / Ergebnis / Projekt / Konzession).
- Automatische Beispiel- bzw. Empfängerauswahl via Matching-API (Dummy).
- MJML-Rendering pro Empfänger, Sprache aus `VectorDB_Kontakte.Sprache` (DE oder IT).
- Review-Screen mit Individual-Editing pro Empfänger (Beispiele swappen, Services togglen, Texte überschreiben).
- Versand über Mailjet mit menschlicher Freigabe.
- Kampagnen-Liste mit zwei Zuständen: `draft`, `sent`.
- Magic-Link-Login für Bauservice-Mitarbeiter, keine Rollentrennung.
- Deployment auf Vercel (EU-Region) mit Custom Domain.

**Explizit NICHT in Phase 1 (Phase 2 oder später):**
- Settings-Bereich im Frontend (Templates, Service-Defaults, Nutzerverwaltung) — Templates und Defaults liegen als Files/Konstanten im Repo und werden per PR geändert.
- Rollentrennung `admin` / `reviewer` — flacher Zugang reicht.
- CSV/XLSX-Upload von Empfängerlisten — Empfänger kommen ausschließlich aus `VectorDB_Kontakte`.
- Erweiterte Kampagnen-Statusmaschine (`review`, `sending`, `error`) inkl. SWR-Polling — Versand ist ein einmaliger synchroner Aufruf, Status über manuelles Refresh.
- `CampaignTimeline`-Komponente, Device-Size-Switch im Preview, Bulk-Editing "gleicher Block für alle mit Gewerk X".
- Persistente Draft-Wiederaufnahme zwischen Sessions (nice-to-have, in Phase 1 nur In-Memory bis Versand oder Verwerfen).

Ergebnis: ~3 Routen, ~6 Feature-Komponenten, ein MJML-Template mit DE/IT-Varianten.

---

## 1. Zielbild & Nutzerfluss

Ein Bauservice-Mitarbeiter öffnet die Anwendung, um an einem Vormittag personalisierte Werbe-E-Mails an potenzielle Kunden rauszuschicken. Heute tippt er dafür manuell Beispiele aus vier Datenquellen zusammen — das Tool übernimmt das in einer geführten Oberfläche.

Es gibt zwei **gleichberechtigte Einstiege** — Richtung A setzt an einer Kontakt-Suche an (gezielt, "Kunde im Kopf"), Richtung B an einer chronologischen Liste neuer Items (Browsing, "Was ist heute rausgekommen?"). Beide münden im selben Review- und Versand-Flow:

### Richtung A — Aus Kontakt ("Ich habe einen Kunden im Kopf")

1. **Kontakt wählen.** Aus `VectorDB_Kontakte` einen oder mehrere Empfänger picken (Live-Suche, Filter nach Gewerk/Region/Rolle, Segment-Toggle **Neu / Bestand / Alle**). Opt-out- und Inaktiv-Kontakte sind hart ausgeblendet.
2. **Automatische Beispielauswahl.** Pro Service (Ausschreibungen, Ergebnisse, Beschlüsse, Baukonzessionen) liefert die Matching-API semantisch passende Einträge — Default fünf pro Service.
3. **Review & Versand** (siehe unten).

### Richtung B — Aus Item ("Ich habe eine interessante Ausschreibung/Projekt/Konzession")

1. **Item wählen.** Aus einer der vier Service-Listen ein konkretes Beispiel auswählen (z. B. eine neue Ausschreibung).
2. **Automatische Empfängerauswahl.** Die Matching-API liefert passende Kontakte für dieses Item (Gewerk-Match, Region, Rolle = `Anbieter`), Opt-out hart gefiltert.
3. Bei Bedarf können weitere passende Items aus den anderen Services pro Empfänger ergänzt werden (das Ursprungs-Item bleibt das dominierende).
4. **Review & Versand** (siehe unten).

### Gemeinsam: Review & Versand (beide Richtungen)

1. **Email-Draft.** Pro Empfänger wird ein MJML-Template serverseitig gerendert: Anrede, Einleitung, Service-Blöcke, Call-to-Action. Sprache aus `Kontakte.Sprache` (DE oder IT), Plain-Text-Fallback mit.
2. **Review & Anpassen.** Individual-Editing pro Empfänger: einzelne Beispiele austauschen, Services ein-/ausblenden, Texte überschreiben. Empfänger können aus der Versandliste gestrichen werden.
3. **Approve & Send.** Letzte Vorschau, Versand-Button, Bestätigungsdialog. Mailjet übernimmt, Kampagne wechselt auf `sent`.

Kampagnen werden innerhalb einer Session gehalten; persistente Draft-Wiederaufnahme ist explizit **nicht** Phase 1 (vgl. § 0).

---

## 2. Seiten & Routen (Next.js App Router)

```
app/
  layout.tsx                          # Auth-Guard, Top-Nav, Toaster
  page.tsx                            # Dashboard: zwei Start-CTAs + letzte Kampagnen

  (auth)/
    login/page.tsx                    # Magic-Link-Login

  kampagnen/
    page.tsx                          # Übersicht: draft · sent
    neu-aus-kontakt/page.tsx          # Richtung A — Kontakt-Suche (gezielt)
    neu-aus-item/page.tsx             # Richtung B — neue Items chronologisch (Browsing)
    [id]/
      page.tsx                        # Review: Draft + Individual-Editing
      versand/page.tsx                # Approve & Send

  empfaenger/
    page.tsx                          # Liste + Suche (read-only, aus VectorDB_Kontakte)
    [id]/page.tsx                     # Empfänger-Detail (Profil, letzte Kampagnen)

  api/
    dummy/
      matching/examples/route.ts      # POST — für Richtung A: passende Items zu Kontakt
      matching/recipients/route.ts    # POST — für Richtung B: passende Kontakte zu Item
      sql/recipients/route.ts         # GET — Empfängerstammdaten
      sql/items/route.ts              # GET — Items aller 4 Services (für Picker in Richtung B)
      sql/campaigns/route.ts          # GET/POST — Kampagnen (Liste + Create)
      render/mjml/route.ts            # POST — MJML → HTML (+ Plain-Text)
      mailjet/send/route.ts           # POST — Versand-Trigger
```

**Route-Gruppen:**
- `(auth)` — Login, keine Top-Nav.
- Alle übrigen Routes unter dem Auth-Guard in `layout.tsx`.

**Aus Phase 1 herausgenommen** (siehe § 0): `einstellungen/*` (Templates/Services/Nutzer), CSV-Upload unter `empfaenger/`.

---

## 3. Komponenten-Inventar

### Wiederverwendbare UI-Bausteine

| Komponente | Zweck |
|---|---|
| `LayoutShell` | Top-Nav, Sidebar, Toaster, Auth-State-Kontext |
| `DataTable` | Generische shadcn-Tabelle mit Sortierung, Filter, Pagination — für Empfänger, Kampagnen, Beispiele |
| `SearchFilterBar` | Live-Suche + Filter-Chips auf allen DB-Dimensionen (Gewerk, Bezirk, Provinz, Rolle, Aktiv, Datum) + Ergebnis-Counter; identisches Pattern für Kontakte und Items |
| `StatusBadge` | Farbkodierte Badges für Kampagnen-Status (Draft/Review/Versandt/Fehler) |
| `EmptyState`, `LoadingState`, `ErrorState` | Standardisierte Placeholder |

### Feature-Komponenten (seitenspezifisch)

| Komponente | Zweck | Flow |
|---|---|---|
| `RecipientPicker` | Multi-Select aus `VectorDB_Kontakte`, Live-Suche, Gewerk-/Region-/Rollen-Filter, Opt-out hart ausgeblendet | A + Review |
| `ItemPicker` | Auswahl eines Items aus einer der 4 Service-Listen (Ausschreibung / Ergebnis / Projekt / Konzession), Service-Umschalter als Tabs | B |
| `ServicePanel` | Container für einen Service-Block (Titel, Anzahl, Inkludieren-Toggle) | Review |
| `ExampleCard` | Einzelnes Beispiel mit Metadaten und "Austauschen"-Button | Review |
| `ExampleSwapSheet` | Side-Sheet mit alternativen Beispielen zur Auswahl (Matching-API-Results) | Review |
| `ServiceToggle` | Ein-/Ausblenden eines Service-Blocks im Email-Draft pro Empfänger | Review |
| `EmailPreview` | Sandboxed iframe mit gerendertem HTML + Plain-Text-Toggle (Device-Size-Switch: Phase 2) | Review |
| `EditableTextBlock` | Inline-editierbarer Textbereich für Anrede/Einleitung/CTA-Overrides | Review |
| `ApprovalBar` | Sticky-Footer mit "Verwerfen" und "Versenden" | Review / Versand |

**Aus Phase 1 herausgenommen:** `RecipientUploadDialog` (kein CSV/XLSX), `CampaignTimeline` (zwei Status reichen).

---

## 4. State & Datenflüsse

**Empfehlung:** React Server Components (RSC) als Default, Server Actions für Mutationen, ein kleiner Client-Store (Zustand) für den Review-Flow. Keine globale Redux/Context-Monstrosität.

**Begründung:** Listen (Empfänger, Kampagnen, Beispiele) werden serverseitig gerendert — weniger Client-JS, bessere SEO-irrelevant-aber-Geschwindigkeit, direkter DB-Zugriff in Server-Komponenten. Der Review-Screen hat viel interaktiven State (welche Beispiele sind gerade ausgewählt, welche Toggles sind an, welche Änderungen ungespeichert) — hier braucht es einen Client-Store. Zustand ist leichtgewichtig, passt zu App Router, vermeidet Context-Boilerplate.

**Daten-Quelle je Surface:**

| Surface | Quelle | Cache/Polling |
|---|---|---|
| Kampagnen-Liste | SQL-View (Dummy-Route) | RSC revalidate on mutation |
| Empfänger-Liste | SQL-View (Dummy-Route) | RSC |
| Item-Liste (Richtung B) | SQL-View (Dummy-Route, pro Service) | RSC |
| Beispielauswahl / Empfängervorschläge | Matching-API (Dummy) | On-demand beim Flow-Start + Swap-Action |
| Email-Draft | Server-Action rendert MJML | Bei Beispieländerung oder Text-Override neu rendern |
| Versand-Status | Mailjet-Response beim Send-Call | Synchrones Ergebnis, kein Polling in Phase 1 |

**Client-Store (Zustand) hält nur:**
- aktuelle Kampagnen-ID, Flow-Richtung (A/B), ausgewählte Beispiele pro Service, Toggle-Zustände, Text-Overrides, Empfänger-Skip-Liste, Dirty-Flag.

---

## 5. Integrationspunkte (Dummy-Phase)

Alle Calls laufen in Phase 1 über stubbed API-Routen unter `app/api/dummy/*`. Die Response-Shapes sind stabil, Backend-Swap in Phase 2 ersetzt nur die Implementierung.

| Integration | Richtung | Auslösender Screen | Payload (verkürzt) |
|---|---|---|---|
| `POST /api/dummy/matching/examples` | Frontend → Matching-API | Review (Flow A Initial-Load, Swap) | `{ recipientId, service, n, filters? }` → `ExampleWithScore[]` |
| `POST /api/dummy/matching/recipients` | Frontend → Matching-API | Review (Flow B Initial-Load) | `{ service, itemId, n, filters? }` → `RecipientWithScore[]` |
| `GET /api/dummy/sql/recipients` | Frontend → SQL-View | `/empfaenger`, Recipient-Picker | `?q=&gewerk=&region=&rolle=&limit=` → `Recipient[]` (Opt-out/Inaktiv serverseitig gefiltert) |
| `GET /api/dummy/sql/items` | Frontend → SQL-View | Item-Picker (Flow B) | `?service=&q=&bezirk=&limit=` → `Example[]` |
| `GET /api/dummy/sql/campaigns` | Frontend → SQL | `/kampagnen` | `?status=&limit=` → `Campaign[]` |
| `POST /api/dummy/sql/campaigns` | Frontend → SQL | `/kampagnen/neu-aus-*` | `{ name, origin: 'recipient'\|'item', recipientIds?, itemRef? }` → `Campaign` |
| `POST /api/dummy/render/mjml` | Frontend → Render-Service | Bei jeder Beispieländerung oder Text-Override | `{ templateId, sprache, payload }` → `{ html, text }` |
| `POST /api/dummy/mailjet/send` | Frontend → Mailjet | `/kampagnen/[id]/versand` | `{ campaignId }` → `{ jobId, accepted, rejected? }` |

**Wichtig für den Kontrakt mit Matthias (Matching/DB):**
- Beide `matching/*`-Endpoints liefern einen **Relevanz-Score** (0–1) pro Treffer mit, damit der Review-Screen "bessere Beispiele" anbieten kann.
- Der **Opt-out- und Aktiv-Filter** wird serverseitig in den SQL- und Matching-Routen durchgesetzt, nicht erst im Frontend — das ist auch für das Versand-Audit relevant.
- Die **Sprachauswahl** (`Kontakte.Sprache` = `'de'` | `'it'`) wird vom Frontend an `render/mjml` mitgegeben; welche `_D`/`_I`-Spalten geliefert werden, entscheidet die Matching-API basierend auf der Empfängersprache.

**Reale Tabellenstruktur (Snapshot 2026-04-20):**

Die Bauservice-DB ist MySQL. Alle relevanten Tabellen tragen das Präfix `VectorDB_` — sie sind bereits als Vorstufe für die Weaviate-Vektorisierung aufbereitet. Multilingualität ist durchgehend über `_D`- und `_I`-Suffix-Spalten gelöst (Deutsch/Italienisch).

| Tabelle | Rolle im System | Kern-Spalten |
|---|---|---|
| `VectorDB_Kontakte` | Empfänger + alle beteiligten Personen/Firmen | `id`, `Kontakt_full_name_D/_I`, `Sprache`, `EMailAdresse`, `PEC`, `inBezirk_d/_i`, `inProvinz_i`, Rollen-Flags `Ausscheiber` · `Anbieter` · `Kunde` · `Aktiv`, Opt-out `Keine Werbung senden` |
| `VectorDB_Ausschreibungen` | Service 1: öffentliche Ausschreibungen | `AusschreibungenID`, `Datum`, `Datum_Zuschlag`, `Bezirk`, `Ausschreiber_id`, `Beschreibung_D/_I`, `Betrag`, `gewinner_id`, `Projektant_id`, `CIG`, `CUP` |
| `VectorDB_Ausschreibungen_Teilnehmer` | Service 2: Ergebnisse/Teilnehmer (Join) | `AusschreibungenID`, `TeilnehmerID` → `Kontakte.id`, `Betrag`, `PunkteBewertung`, `prozent`, `Ausschlussgrund` |
| `VectorDB_Ausschreibungen_Hauptarbeiten` | Gewerks-Zuordnung pro Ausschreibung | `Ausschreibung`, `Unterkategorie`, `SOA`, `Betrag` |
| `VectorDB_Ausschreibungen_AbtrennbareArbeiten` | Abtrennbare Arbeiten pro Ausschreibung | `Ausschreibung`, `AbtrennbareArbeit`, `SOA`, `Betrag` |
| `VectorDB_Projektierungen` | Service 3: Beschlüsse/Projekte | `ProjektierungenId`, `Datum`, `BeschlussNr`, `BeschlussDatum`, `BeschreibungD/I`, `Betrag`, `GeschaetzterBetrag`, `Status`, `Bezirk`, `Provinz` |
| `VectorDB_Konzessionen` | Service 4: Baukonzessionen | `KonzessionenID`, `Datum`, `Gemeinde`, `KonzessionenTyp`, `conz_desc_d/_i`, `Name`, `adresse`, `Ort`, `Bezirke_BezeichnungI`, `Provinzen_BezeichnungI` |
| `VectorDB_Oberkategorie_Unterkategorie` | Kategorien-Taxonomie (Gewerke) | — |
| `VectorDB_Projektierungen_Unterkategorie` | Zuordnung Projekt ↔ Kategorie | — |
| `VectorDB_Konzessionen_Unterkategorie` | Zuordnung Konzession ↔ Kategorie | — |

**Datenmodell-Skizze (TypeScript, angelehnt an reale Spalten):**

```ts
type Service = 'ausschreibungen' | 'ergebnisse' | 'beschluesse' | 'baukonzessionen';
type Sprache = 'de' | 'it';

type Recipient = {
  id: number;                         // VectorDB_Kontakte.id
  nameDe: string;                     // Kontakt_full_name_D
  nameIt: string;                     // Kontakt_full_name_I
  sprache: Sprache;                   // Sprache
  email: string;                      // EMailAdresse
  pec?: string;                       // PEC
  bezirkDe?: string;                  // inBezirk_d
  provinz?: string;                   // inProvinz_i
  rollen: {
    ausschreiber: boolean;            // Auftraggeber / Vergabestelle
    anbieter: boolean;                // Firma, die Ausschreibungen bedient
    kunde: boolean;                   // Bauservice-Kunde
  };
  aktiv: boolean;                     // Aktiv
  optOut: boolean;                    // "Keine Werbung senden"
};

type ExampleBase = {
  id: number;
  service: Service;
  datum?: string;                     // ISO
  bezirk?: string;
  beschreibungDe: string;
  beschreibungIt: string;
  quelle: { table: string; pk: string };
};

type AusschreibungExample = ExampleBase & {
  service: 'ausschreibungen';
  ausschreiberId?: number;
  betrag?: number;
  cig?: string;
  cup?: string;
  gewinnerId?: number;                // erst nach Zuschlag gesetzt
};

type ErgebnisExample = ExampleBase & {
  service: 'ergebnisse';
  ausschreibungId: number;
  teilnehmerId: number;
  betrag?: number;
  punkteBewertung?: number;
  prozent?: number;
};

type BeschlussExample = ExampleBase & {
  service: 'beschluesse';
  beschlussNr?: string;
  beschlussDatum?: string;
  betrag?: number;
  geschaetzterBetrag?: number;
  status?: string;
};

type KonzessionExample = ExampleBase & {
  service: 'baukonzessionen';
  gemeinde?: string;
  konzessionenTyp?: string;
  name?: string;
  adresse?: string;
  ort?: string;
};

type Example =
  | AusschreibungExample
  | ErgebnisExample
  | BeschlussExample
  | KonzessionExample;

type CampaignDraft = {
  id: string;
  name: string;
  status: 'draft' | 'sent';            // Phase 1 nur zwei Status
  origin: 'recipient' | 'item';        // Einstiegsrichtung A vs. B
  itemRef?: { service: Service; itemId: number };   // nur bei origin='item' gesetzt
  createdAt: string;
  createdBy: string;
  items: Array<{
    recipientId: number;
    sprache: Sprache;                  // aus Kontakte.Sprache, bestimmt Render-Sprache
    selectedExamples: Record<Service, number[]>;
    serviceEnabled: Record<Service, boolean>;
    overrides?: { salutation?: string; intro?: string; cta?: string };
    skip?: boolean;                    // Empfänger aus Versandliste gestrichen
  }>;
};
```

**Abgeleitete UI-Regeln aus dem Schema:**

- **Opt-out respektieren.** Empfänger mit `Keine Werbung senden = 1` oder `Aktiv = 0` dürfen im `RecipientPicker` und in den Matching-Vorschlägen nicht auftauchen — hart filtern, nicht nur visuell warnen. Der Filter läuft **serverseitig** (SQL-View und Matching-API). Beim Send-Call wird der Opt-out-Status **erneut** geprüft (gegen Änderungen zwischen Picker und Versand).
- **Sprache pro Empfänger.** `Kontakte.Sprache` bestimmt, welche Variante des MJML-Templates gerendert wird und welche `_D`/`_I`-Spalten der Items verwendet werden. Ein Template mit zwei Sprachvarianten, kein zweisprachiger Inhalt pro Mail.
- **Neu / Bestand / Alle als Segment-Toggle.** Abgrenzung über Rollen-Flags und `Ausschreibungen_Teilnehmer`-Historie (konkretes Mapping liefert der Backend-Task). Default: **Alle**. `Ausscheiber`-Rolle (öffentliche Stellen) als separater Filter-Chip, im Werbe-Kontext meist irrelevant.
- **Geografie-Filter.** `inBezirk_d` und `inProvinz_i` sind die primären Region-Filter für die Matching-Logik.
- **Gewerks-Matching** läuft über die `Unterkategorie`-Join-Tabellen; die Taxonomie wird aus `VectorDB_Oberkategorie_Unterkategorie` abgeleitet.
- **Richtung B verlangt ein Item-Listing pro Service.** Der `ItemPicker` nutzt `/api/dummy/sql/items?service=…`. Die Matching-API erhält anschließend `{ service, itemId, … }` und liefert Empfängervorschläge mit Score.

---

## 6. Design-Leitlinien

**Anlehnung an das bestehende Bauservice-Portal** (siehe `https://www.bauservice.it/de/intranet/beschluesse-projekte.html`, Demo-Modus öffentlich):

- 2×3-Tab-Navigation für die 6 Inhaltsbereiche
- Sticky Filter-Bar mit Suche, Filter-Icons, Ergebnis-Counter
- Neutraler Grauton-Hintergrund, Blau-Akzent für aktive Tabs, Orange für Warnbanner/CTAs, Grün im Logo-Badge
- Kompakte DataTable mit Titel + Subtitle in der Beschreibungsspalte
- Klassische, sehr kompakte Sans-Serif

**AlpinoAI-Visual-Layer darüber:**

- **Library:** shadcn/ui + Tailwind. Begründung: Copy-in Components statt Vendor-Library, volle Kontrolle, lightweight, Standard für Next.js App Router, keine Lock-ins.
- **Base-Palette:** `zinc` als neutral, `blue-600` als Primär (Anlehnung an Bauservice-Blau), `orange-500` als Warn-Akzent. Dark Mode kein Launch-Requirement — aber offen lassen durch CSS-Variablen.
- **Typografie:** System-Sans (Inter oder Geist). Kompakte Schrift-Scale für tabellenlastige Oberflächen.
- **Spacing:** 4px-Base-Unit, dichtere Tables (tr h-10), generöse Card-Paddings (p-6).
- **Icons:** `lucide-react`.
- **Motion:** Dezent. Nur für Swap-Sheet, Toast, Drawer.

---

## 7. Auth & Rollen

**Zugriff:** nur Bauservice-Mitarbeiter (1–3 Personen). Öffentlicher Endpoint gibt es nicht.

**Rollen:** keine Rollentrennung in Phase 1 — jeder eingeloggte Mitarbeiter kann alles. Wenn Bauservice später Admin-Funktionen (Nutzerverwaltung, Template-Pflege, Service-Defaults) benötigt, kommen diese mit dem Settings-Bereich in Phase 2 zurück.

**Auth-Verfahren:** Favorit **Magic-Link via Resend/SMTP** (passwortlos, keine SSO-Integration nötig, DSGVO-unproblematisch). Alternative für MVP: einfaches Basic-Auth-Middleware-Secret, falls Magic-Link-Infrastruktur erst später steht. Entscheidung im Kickoff.

**Session:** HTTP-only Cookies, 7-Tage-Lifetime, Refresh bei jeder aktiven Nutzung.

---

## 8. Offene Fragen an Bauservice

Durch den Schema-Snapshot vom 20.04.2026 und das Scope-Alignment (Rev 2) sind einige Ausgangsfragen bereits beantwortet:

- **DBMS:** MySQL, bestätigt.
- **Empfängerdaten:** interne Tabelle `VectorDB_Kontakte`, kein separates CRM nötig. **CSV-Upload ist aus Phase 1 gestrichen.**
- **Mehrsprachigkeit:** eine Mail pro Empfänger in dessen Sprache (`Kontakte.Sprache`), ein MJML-Template mit DE/IT-Varianten.
- **Opt-out-Handling:** Flag `Keine Werbung senden` in `VectorDB_Kontakte` — muss serverseitig in SQL-View und Matching-API hart gefiltert werden und im Send-Call erneut geprüft werden.
- **Flow-Richtung:** beide Richtungen gleichberechtigt, bidirektionaler Einstieg (vgl. § 1).
- **Review-Tiefe:** Individual-Editing pro Empfänger (vgl. § 1 und § 3).
- **Settings-UI:** nicht in Phase 1; Templates und Defaults werden im Repo gepflegt.
- **Rollen:** keine Trennung in Phase 1.

Diese Punkte bleiben offen und müssen im Kickoff / Discovery geklärt werden:

1. **View-Strategie.** Die `VectorDB_*`-Tabellen sind offenbar Aufbereitungs-Tabellen — werden sie periodisch befüllt (Batch-Job bei Bauservice) oder sind es Views auf Live-Daten? Wie oft aktualisieren? Sync-Intervall für Weaviate-Reindex abhängig davon. **(Matthias)**
2. **Gewerks-Taxonomie.** Die Tabelle `VectorDB_Oberkategorie_Unterkategorie` strukturiert Gewerke. Gibt es Dokumentation / Anzahl der Kategorien? Für das Matching und die Filter-UI relevant. **(Matthias/Bauservice)**
3. **Matching-Scoring.** Welche Score-Skala liefert die Matching-API (0–1, Prozent, bucketiert)? Soll der Score im Review-Screen sichtbar sein oder nur die Reihenfolge steuern? **(Matthias/Julian gemeinsam)**
4. **Absender-Identität & DKIM.** Welche Absenderadresse(n)? Ist Mailjet-DKIM-Setup für `bauservice.it` bereits vorhanden? **(Bauservice)**
5. **Plain-Text-Fallback.** Muss ein Plain-Text-Part verpflichtend mitgehen (Deliverability-Best-Practice)? Vermutlich ja. **(Julian klärt mit Mailjet-Doku)**
6. **Unsubscribe-Link.** Jede Werbemail braucht einen funktionierenden Opt-out-Link (CAN-SPAM / DSGVO). Mechanik: Token-Link, der `Keine Werbung senden = 1` setzt. Wer baut den Endpoint? **(Julian FE-Link, Matthias DB-Write)**
7. **Auth-Verfahren.** Magic-Link via Resend/SMTP als Default. Alternative: Basic-Auth für MVP. IdP-Existenz bei Bauservice prüfen. **(Kickoff)**
8. **Matching-Kriterien.** Gewerk/Region sind über das Schema klar. Gibt es weitere (historische Aufträge aus `Ausschreibungen_Teilnehmer`, Umsatzklasse, Netzwerk-Zugehörigkeit)? **(Bauservice)**
9. **Versand-Audit.** Welche Daten müssen aus Compliance-Gründen pro Versand festgehalten werden (Zeitpunkt, gewählte Beispiele, Mitarbeiter-ID, Opt-out-Status zum Versandzeitpunkt)? **(Bauservice)**
10. **DB-Zugang für Produktion.** MySQL-Port ist von außen blockiert; phpMyAdmin-Scraping ist nur Interims-Lösung. Benötigt: VPN, SSH-Tunnel oder Firewall-Freischaltung plus dediziertes Read-only-Konto. Der bisherige Demo-Zugang lief über Plain-HTTP und ist zu ersetzen bzw. zu rotieren (Klartext-Credentials bleiben lokal, nicht im Repo). **(Bauservice/Matthias)**

---

## 9. Dummy-Endpoints — Hinweis zur Phase 2

Alle Routen unter `app/api/dummy/*` liefern in Phase 1 statische bzw. pseudorandomisierte Responses mit den im Datenmodell (§ 5) beschriebenen Shapes. Das erlaubt, das Frontend komplett zu bauen und zu demonstrieren, ohne dass Weaviate, die Kundendaten-DB oder Mailjet produktiv angeschlossen sind.

**Swap in Phase 2:**
- `dummy/matching/examples` + `dummy/matching/recipients` → Weaviate-Client mit semantischem Match (Matthias)
- `dummy/sql/*` → Prisma/Drizzle gegen Bestands-Views (Matthias)
- `dummy/render/mjml` → `mjml`-npm-Package serverseitig (Julian)
- `dummy/mailjet/send` → `node-mailjet` (Julian)

Die Umstellung geschieht pro Integration isoliert, das Frontend bleibt unverändert.

---

## Verweise

- Projekt-Doku im Vault: `alpino-kb/wiki/clients/bauservice/projects/bauservice-email-automation.md`
- Angebot v2 (2026-01): `alpino-kb/wiki/clients/bauservice/proposals/bauservice-2026-01-email-automation.md`
- Live-Portal (Demo): https://www.bauservice.it/de/intranet/beschluesse-projekte.html

# Frontendkonzept — Bauservice Email-Automation

**Session 2 · 2026-04-22 · Status: Rev 4 — Phase 1.6 bis 1.9 umgesetzt**

Dieses Dokument beschreibt das Zielbild des Next.js-Frontends für die AI-Powered Email-Automation von Bauservice. Die ursprünglichen Kapitel (§ 1 Zielbild bis § 9 Dummy-Endpoints) sind mit Rev 3 (2026-04-20) als Implementierungsgrundlage entstanden. Rev 4 (2026-04-22) reflektiert den tatsächlichen Code-Stand nach den Phasen 1.7 (Customer-Type-Szenarien), 1.8 (Template-Polish auf Goldstandard) und 1.9 (Stepper + Swap-Sheet-Detail + Drizzle-Scaffolding) — alle auf `main` gemerged.

Alle externen Systeme werden in Phase 1 gegen **Dummy-Endpoints** angesprochen; der Swap auf echte Backends erfolgt in Phase 2. Der Kontrakt für diesen Swap ist ausgelagert in [`docs/backend-endpoints-kontrakt.md`](backend-endpoints-kontrakt.md) und [`docs/sql-views-ddl-vorschlag.md`](sql-views-ddl-vorschlag.md).

**Zuständigkeiten im Team:**
- **Julian** — Frontend (Next.js-App, Komponenten, Review-Flow), Email-Template-Content, Mailjet-Integration (Post-MVP).
- **Matthias** — Matching-Logik, Bestands-DB (Views, Opt-out-Filter), Weaviate-Vektorisierung, Reindex-Pipeline, Feedback-Persistenz.

Die Integrationsgrenze läuft über die Endpoints in [`docs/backend-endpoints-kontrakt.md`](backend-endpoints-kontrakt.md). Frontend-Drizzle-Schemas in [`src/lib/db/schema.ts`](../src/lib/db/schema.ts).

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

**Phase-1.5-Erweiterungen (nach MVP-Abgleich, implementiert):**
- **Sidebar-Navigation** (Dashboard, Kontakte, Kampagnen, Services, Analytics) statt Top-Nav.
- **`/services`** als eine Tabelle mit Service-Filter-Tabs (statt vier getrennter Service-Routen).
- **Dashboard-KPIs** + Schnellzugriff-Widget.
- **Personalisierter Anrede** aus `Kontakte.Kontakt_full_name_D/_I` (Firmennamen-basiert, da keine Ansprechpartner-Felder im Schema).
- **Mail-Client-Header** (Von / An / Betreff) als Preview-UX oberhalb des Render-iframes.
- **Strukturierte Example-Cards** im Template (Datum, Bezirk, Betrag, Gewerk als Meta-Zeile).
- **Matching-Score + Begründungstext** ("Passend zu Gewerk X und Bezirk Y") in Swap-Sheet und Review-Cards, Score als farbiger Progress-Bar.
- **Feedback-Loop**: „Passt" / „Passt nicht" pro Example mit `POST /api/dummy/feedback` (in-memory Logger, wird in Phase 2 für ML-Training persistiert).
- **`/analytics`** als Placeholder — echtes Tracking folgt in Phase 2.

**Phase-1.7-Erweiterungen (Customer-Type, implementiert):**
- **Vier Kundentyp-Szenarien A/B/C/D** (Bestandskunde, Zuschlag-Gewinner, Teilnehmer-verloren, Kaltakquise) pro Empfänger, steuern Hook/Bridge/CTA/Subject.
- **`classifyRecipient()`-Logik** in [`src/lib/scenarios.ts`](../src/lib/scenarios.ts) und [`src/lib/fixtures/matching.ts`](../src/lib/fixtures/matching.ts) — beim Draft-Build wird automatisch auf Basis von `isGewinner`/`isTeilnehmer`/`isKunde` klassifiziert. Der neue Dummy-Endpoint [`POST /api/dummy/classify-recipient`](../src/app/api/dummy/classify-recipient/route.ts) liefert das Szenario pro Empfänger.
- **`ScenarioSelector`**-Komponente im Review-Screen lässt den User die automatische Klassifikation manuell überschreiben.
- **Ergebnisse-Service getrennt** von Ausschreibungen (eigene Tabelle, eigenes Meta-Schema).
- **Service-Detail-Drawer** für die `/services`-Tabelle (Klick auf Zeile öffnet Detail-Ansicht vor Kampagnen-Start).

**Phase-1.8-Erweiterungen (Template-Polish auf Goldstandard, implementiert — PR #3 gemerged):**
- **Content-Packs** in [`src/lib/email-template-content/{de,it}.ts`](../src/lib/email-template-content/) — alle DE/IT-Strings extern, Muttersprachler kann IT-Wording per PR optimieren. Schließt Pre-Header, Subject (mit `{itemTitle}`-Placeholder), Salutation-Prefixes, Hook, Bridge, doppelte CTA, Value-Props (6 Punkte), Urgency-Hook, Signatur und Opt-out-Disclaimer ein.
- **Subject aus Render-Response** — Preview-Header liest `rendered.subject` statt hardcoded Template-String.
- **Service-spezifisches Meta** pro Example-Typ: Ergebnisse mit „Zuschlag an [Firma] (€X · Y%)" + „Bekanntmachung"-Zeile; Beschlüsse mit Beschluss-Nr + Status + Geschätzter Betrag; Konzessionen mit Gemeinde/Typ/Bauherr.
- **Plain-Text-Look** im Template (statt Card-Borders): `<hr>`-Separatoren zwischen Examples, schlichte Meta-Zeilen, kein blauer Left-Border.
- **140-Zeichen-Cut** für lange Beschreibungen mit `…`-Trunkierung.
- **Doppelte CTA**: nach Hook mit Telefon 0472 208308, abschließend vor Signatur — pro Scenario definiert.
- **Ansprechpartner-Anrede Stufe 1**: Recipient hat ein `ansprechpartner?`-Feld (Vorname, Nachname, Geschlecht, Titel). Template rendert „Sehr geehrter Herr Ing. Perini" bzw. „Egregio Sig. Ing. Perini" — Prefixes in Content-Packs, Fallback auf Firmen-Anrede. Datenquelle: `VectorDB_Kontakte.{Vorname, Nachname, Geschlecht, Anrede_i}` — in Phase 1 per Fixture-Parse-Heuristik, in Phase 2 direkt aus der SQL-View.
- **Adresse**: Julius-Durst-Str. 70 – HOUSE70, 39042 Brixen (Goldstandard-Adresse „Am Thalhofer Graben" war veraltet). Sender-Name Default „Meinrad Kerschbaumer", pro Kampagne überschreibbar via `EmailOverrides.senderName`.
- **Bilingualer Opt-out-Disclaimer** mit Verweis auf `D.L. N° 196/2003` und REMOVE-Mechanik.
- **Anzahl Beispiele pro Service einstellbar** — inline Number-Input (1–10) im Service-Panel-Header, überschreibt den globalen Default pro Kampagne. Matching-Pool holt seit 1.8 `n=10` Items pro Service und Empfänger für Slider-Headroom.
- **Feedback-Persistenz im Store** — `FeedbackMap` im `campaign-store` hält die „Passt"/„Passt nicht"-Signale pro Empfänger × Service × Example. „Ungeeignet"-Badge + Strike-Through auf der Example-Card bleiben beim Tab-Wechsel erhalten.

**Phase-1.9-Erweiterungen (UX-Finish + DB-Connector-Vorbereitung, implementiert — PR #4 gemerged):**
- **`CampaignStepper`-Komponente** (Auswahl → Review → Versand, `aria-disabled` auf Future-Steps) auf 4 Flow-Seiten: `/kampagnen/neu-aus-kontakt`, `/kampagnen/neu-aus-item`, `/kampagnen/[id]`, `/kampagnen/[id]/versand`.
- **ExampleSwapSheet** mit List/Detail-Mode-Toggle im Header. Detail-Mode zeigt einen Vorschlag nach dem anderen mit Prev/Next-Navigation (`1 / 9`-Counter) und „Diesen übernehmen"-CTA analog Kundenportal-Detail-View.
- **X-Icon top-right** auf nicht-pinned Example-Cards (ersetzt den Hover-versteckten „Entfernen"-Text-Button).
- **Drizzle + mysql2 scaffolding**: [`src/lib/db/schema.ts`](../src/lib/db/schema.ts) mit den 5 `v_frontend_*`-Views + 3 Persistenz-Tabellen (`campaigns`, `campaign_recipients`, `ml_feedback`), [`src/lib/db/client.ts`](../src/lib/db/client.ts) mit lazy initialisiertem Pool. `.env.example` konsolidiert, `drizzle.config.ts` für Introspect-Runs.

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
  layout.tsx                          # Root Layout (html/body, Auth-Guard)

  (auth)/
    login/page.tsx                    # Magic-Link-Login (kein AppShell)

  (app)/                              # Route-Group für authentifizierte App
    layout.tsx                        # AppShell mit Sidebar-Nav
    page.tsx                          # Dashboard: KPIs + Schnellzugriff + letzte Kampagnen
    empfaenger/
      page.tsx                        # Kontakte (read-only, aus VectorDB_Kontakte)
      [id]/page.tsx                   # Empfänger-Detail (Phase 2)
    kampagnen/
      page.tsx                        # Übersicht: Alle · Entwurf · Versandt
      neu-aus-kontakt/page.tsx        # Richtung A — Kontakt-Suche (gezielt)
      neu-aus-item/page.tsx           # Richtung B — neue Items chronologisch
      [id]/
        page.tsx                      # Review: Draft + Individual-Editing
        versand/page.tsx              # Approve & Send
    services/
      page.tsx                        # Eine Tabelle + Service-Filter-Tabs
    analytics/
      page.tsx                        # Placeholder, Tracking kommt in Phase 2

  api/
    auth/login|logout/route.ts        # Basic-Auth-Stub (Phase 2: Magic-Link)
    dummy/
      matching/examples/route.ts      # POST — Richtung A: Items zu Kontakt (+ Score + Reason)
      matching/recipients/route.ts    # POST — Richtung B: Kontakte zu Item (+ Score + Reason)
      sql/recipients/route.ts         # GET — Empfängerstammdaten (Opt-out/Aktiv serverseitig gefiltert)
      sql/items/route.ts              # GET — Items aller 4 Services
      sql/campaigns/route.ts          # GET/POST — Kampagnen-Liste + Create
      sql/campaigns/[id]/route.ts     # GET/PATCH — Einzel-Campaign, Status-Update draft→sent
      render/mjml/route.ts            # POST — HTML + Plain-Text (inline-styled Template, kein MJML mehr)
      mailjet/send/route.ts           # POST — Versand-Stub mit Opt-out-Re-Check
      feedback/route.ts               # POST — „Passt"/„Passt nicht"-Feedback fürs ML-Training
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
| `AppShell` | Sidebar-Navigation (Dashboard/Kontakte/Kampagnen/Services/Analytics), Logo, Logout |
| `SearchFilterBar` | Live-Suche + Filter-Chips auf allen DB-Dimensionen + Ergebnis-Counter; identisches Pattern für Kontakte, Items, Services |
| `Badge`, `ScoreBar` | Status-/Kategorien-Pills und farbiger Score-Progress-Bar (grün ≥80, amber ≥60) |
| `DashboardKpis`, `LatestCampaigns` | KPI-Kacheln und Schnellzugriff fürs Dashboard |

### Feature-Komponenten (seitenspezifisch)

| Komponente | Zweck | Flow |
|---|---|---|
| `RecipientPicker` | Multi-Select aus `VectorDB_Kontakte`, Live-Suche, Gewerk-/Region-/Rollen-Filter, Segment-Toggle Neu/Bestand/Alle, Opt-out hart ausgeblendet | A + Review |
| `ItemPicker` | Auswahl eines Items aus einer der 4 Service-Listen, Service-Umschalter als Tabs | B |
| `CampaignStepper` | Fortschritts-Anzeige „Auswahl → Review → Versand" mit klickbarer Rückwärts-Navigation und `aria-disabled` auf Future-Steps | alle 4 Flow-Seiten |
| `ServicePanel` | Container für einen Service-Block (Titel, inline Number-Input 1–10 für Anzahl, Inkludieren-Toggle) | Review |
| `ScenarioSelector` | Vier Kacheln (A/B/C/D) pro Empfänger. System klassifiziert automatisch via `classifyRecipient()`, User kann überschreiben | Review |
| `ExampleCard` | Einzelnes Beispiel mit Service-spezifischem Meta, Score-Bar, Begründung, „Passt/Passt nicht"-Feedback (persistent via Store), Austauschen-Button und immer sichtbarem X-Icon top-right | Review |
| `ExampleSwapSheet` | Side-Sheet mit List-/Detail-Mode-Toggle. Detail-Mode zeigt einen Vorschlag mit Prev/Next-Navigation und „Diesen übernehmen"-CTA | Review |
| `EmailPreview` | Mail-Client-Header (Von/An/Betreff) oben, Subject aus Render-Response, Inline-WYSIWYG-Bearbeiten-Modus oder iframe mit gerendertem HTML + Plain-Text-Toggle | Review |
| `EditableTextBlock` | Strukturierter Text-Editor für Anrede/Hook/Bridge/CTA-Overrides pro Empfänger | Review |
| `ApprovalBar` | Sticky-Footer mit „Verwerfen" und „Weiter zum Versand" | Review / Versand |
| `RecipientSwapSheet` | Side-Sheet zum Nachträglichen Hinzufügen weiterer Empfänger in laufende Kampagne | Review |
| `SuggestedCampaigns` | Dashboard-Widget mit Top-N Empfänger × Item-Kombinationen aus `/api/dummy/sql/suggestions` | Dashboard |

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

**Client-Store (Zustand, implementiert in [`src/lib/campaign-store.ts`](../src/lib/campaign-store.ts)) hält:**
- `campaign`, `drafts` (pro Empfänger mit Sprache, `scenarioId`, Service-Enabled-Flags, `selectedExamples`, Overrides inkl. `subject`/`senderName`/`bodyHtml`), `examplesByService`-Pool (sortiert nach Score aus Matching).
- `renderCache` pro Empfänger: `{ html, text, subject }` — bedient den Preview-iframe und den Subject-Header.
- `feedback`-Map: `recipientId → service → exampleId → "passt" | "passt_nicht"` — persistiert die Badge-Zustände beim Tab-Wechsel.
- `activeRecipientId`, `isDirty`, `loading` als UI-Status.

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

Die vollständige HTTP-API-Spezifikation (inkl. Request-/Response-Shapes, SQL-View-DDL-Vorschläge, Persistenz-Tabellen und Implementierungs-Reihenfolge) liegt in [`docs/backend-endpoints-kontrakt.md`](backend-endpoints-kontrakt.md) und [`docs/sql-views-ddl-vorschlag.md`](sql-views-ddl-vorschlag.md). Rev-4-Zusammenfassung der wichtigsten Punkte:

- **Score + `reason`-Feld** pro Treffer an beiden Matching-Endpoints (0–1). Score steuert UI-Progress-Bar (grün ≥0.8, amber ≥0.6), Reason wird in `ExampleCard` + `ExampleSwapSheet` angezeigt.
- **`isGewinner` / `isTeilnehmer` / `isKunde`-Booleans** pro Empfänger in `POST /matching/recipients` — ersetzt das ursprünglich diskutierte `trigger`-Envelope. Das Frontend ruft `classifyRecipient()` client-seitig und setzt das Kundentyp-Szenario (A/B/C/D).
- **Ansprechpartner-Felder** (Vorname, Nachname, Geschlecht, Titel) direkt aus `VectorDB_Kontakte` in der Recipients-View — kein Schema-Eingriff nötig, Felder existieren bereits mit 75 % / 75 % / 75 % / 38 % Füllquote.
- **Opt-out- und Aktiv-Filter** werden serverseitig in der View (`WHERE Aktiv=1 AND Keine_Werbung_senden=0`) durchgesetzt, nicht erst im Frontend — auch für Versand-Audit relevant. Send-Stub prüft zusätzlich zum Zeitpunkt des Sendens.
- **Sprache pro Empfänger** (`Kontakte.Sprache` = `"de"` | `"it"`) wird vom Frontend an den Render-Endpoint mitgegeben. Ein Template mit zwei Sprachvarianten, kein zweisprachiger Inhalt pro Mail.
- **Render-Response** liefert seit Phase 1.8 `{ html, text, subject }` — das Subject löst `{itemTitle}`-Placeholder aus `pinnedExample` auf und wird vom Preview-Header konsumiert.
- **`POST /feedback`** nimmt „Passt"/„Passt nicht"-Signale pro `{recipientId, service, exampleId}` entgegen. Phase 2 persistiert in `ml_feedback` (Append-only). Matthias nutzt das Signal für Score-Ranking.

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

**Datenmodell — kanonische Quellen (Rev 4):**

Die ursprüngliche TS-Skizze von Rev 2 ist durch den echten Code abgelöst. Einstiegspunkte:

- [`src/lib/types.ts`](../src/lib/types.ts) — `Recipient` (inkl. `ansprechpartner?`), `Example`-Varianten, `Campaign`, `EmailOverrides`, `RenderPayload`, `RenderResult`, `DEFAULT_SCENARIO_ID`.
- [`src/lib/email-template-content/types.ts`](../src/lib/email-template-content/types.ts) — `ContentPack`, `ScenarioContent`, `Signature`, `MetaLabels`, `PersonSalutation`.
- [`src/lib/db/schema.ts`](../src/lib/db/schema.ts) — Drizzle-Schemas für die 5 `v_frontend_*`-Views + `campaigns`, `campaign_recipients`, `ml_feedback`. Matthias-Lesung.
- [`docs/backend-endpoints-kontrakt.md`](backend-endpoints-kontrakt.md) § 2 — vollständige TS-Shapes mit FK-Referenzen, Füllquoten und Pflicht-vs.-Optional-Markierung.

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

## 8. Offene Fragen

Durch Schema-Snapshot, Scope-Alignments, Phase-1.8/1.9-Umsetzung und die Memo-vs-Ist-Analyse sind viele ursprüngliche Fragen beantwortet:

**Geklärt (Rev 1–4):**
- DBMS MySQL · CSV-Upload gestrichen · Sprache pro Empfänger aus `Kontakte.Sprache` · Opt-out-Hartfilter serverseitig in View + Send-Re-Check · bidirektionaler Einstieg · Individual-Editing im Review · Settings-UI erst Phase 2 · keine Rollentrennung in Phase 1.
- **E.1 Ansprechpartner-Feld**: aufgelöst. `VectorDB_Kontakte` hat bereits `Vorname`, `Nachname`, `Geschlecht`, `Anrede_i` (75 / 75 / 75 / 38 % Füllquote, siehe `docs/db-exploration.md`). Kein Schema-Eingriff nötig, nur SQL-View-Erweiterung.
- **E.2 Trigger-Shape**: aufgelöst. Kein `trigger`-Envelope — stattdessen `isGewinner` / `isTeilnehmer` / `isKunde` pro Empfänger in `POST /matching/recipients`.
- **Gewerks-Taxonomie**: über `VectorDB_Oberkategorie_Unterkategorie`, Mapping auf kanonische Gewerke in `src/lib/filter-options.ts`. DDL-Vorschlag in [`docs/sql-views-ddl-vorschlag.md`](sql-views-ddl-vorschlag.md) § 1.
- **Plain-Text-Fallback**: wird gerendert via `html-to-text`, Deliverability-Best-Practice.
- **Unsubscribe-Mechanik**: textbasierter REMOVE-Opt-out im Footer (kein Klick-Link), Mailjet List-Unsubscribe-Header separat (Post-MVP-Task).

**Noch offen — Kickoff mit Bauservice:**

1. **Auth-Verfahren.** Magic-Link via Resend/SMTP als Default, Alternative Basic-Auth-Middleware für MVP. IdP-Existenz prüfen.
2. **Matching-Kriterien jenseits Gewerk/Region.** Historische Aufträge aus `Ausschreibungen_Teilnehmer`, Umsatzklasse, Netzwerk-Zugehörigkeit?
3. **Versand-Audit.** Welche Daten müssen pro Versand geloggt werden (Zeitpunkt, gewählte Beispiele, Mitarbeiter-ID, Opt-out-Status zum Versandzeitpunkt)?
4. **Produktiver DB-Zugang.** VPN/SSH-Tunnel + dediziertes Read-only-Konto. Plain-HTTP-phpMyAdmin ist Interims-Lösung.
5. **IT-Wording-Sign-off (D.2).** Wer bei Bauservice überprüft die italienischen Content-Pack-Texte? Meinrad oder ein anderer Muttersprachler?

**Noch offen — Matthias:**

6. **View-Refresh-Strategie.** `VectorDB_*` batch-befüllt oder Live-Views? Aktualisierungsfrequenz? Bestimmt Weaviate-Reindex-Kadenz.
7. **Score-Skala.** 0–1 kontinuierlich oder bucketiert (High/Med/Low)? Frontend unterstützt beides.
8. **Feedback-Persistenz-Granularität.** Reicht das Append-only-Schema aus `docs/sql-views-ddl-vorschlag.md` § 6 für Matthias' ML-Training?

**Noch offen — Post-MVP (Parent-Task 86c802jrx):**

9. **Mailjet-Integration + DKIM + SPF + DMARC** für `bauservice.it` → blockt Cross-Client-Test D.1.
10. **AI-Summary DB-seitig (E.3).** Optional-Phase-2: Beschreibungs-Kürzung als KI-Zusammenfassung in der SQL-View, statt harter 140-Zeichen-Cut im Template.
11. **Website-Scraping-Profiling.** Memo-Deviation: „anhand vorhandener Ergebnisse aus der Datenbank **und anhand der Firmenwebsite**" — DB-Teil ist drin (`classifyRecipient`), Website-Teil fehlt. Memo sagt „wenn möglich" → nicht MVP-blocking.

---

## 9. Dummy-Endpoints — Phase-2-Swap

Alle Routen unter `app/api/dummy/*` liefern in Phase 1 pseudorandomisierte Responses auf Basis der Fixtures. Die Response-Shapes sind die Phase-2-Vertragsgrundlage für Matthias — siehe Kontrakt-Doc für Details.

**Swap pro Integration (Phase 2):**
- `dummy/matching/examples` + `dummy/matching/recipients` → Weaviate-Client mit semantischem Match. Response MUSS `isGewinner`/`isTeilnehmer`/`isKunde` in `/matching/recipients` mitliefern. (Matthias)
- `dummy/sql/*` → Drizzle gegen die 5 `v_frontend_*`-Views. Drizzle-Scaffolding ist seit Phase 1.9 vorhanden — [`src/lib/db/schema.ts`](../src/lib/db/schema.ts) + [`src/lib/db/client.ts`](../src/lib/db/client.ts) + `drizzle.config.ts`. (Matthias DB-Seite, Julian Route-Seite)
- `dummy/classify-recipient` → entweder eigenständiger Endpoint oder wegfallend, falls die Booleans bereits in `/matching/recipients` mitkommen. (Matthias)
- `dummy/feedback` → Append-only `ml_feedback`-Tabelle, Matthias nutzt das für Score-Ranking. (Matthias)
- `dummy/render/mjml` → bleibt Frontend-lokal, kein Swap nötig. (Julian)
- `dummy/mailjet/send` → `node-mailjet` nach MVP-Kundenabnahme, Post-DKIM. (Julian)

Die Umstellung geschieht pro Integration isoliert, das Frontend bleibt unverändert.

---

## Verweise

- Endpoint-Kontrakt für Matthias: [`docs/backend-endpoints-kontrakt.md`](backend-endpoints-kontrakt.md)
- SQL-View-DDLs: [`docs/sql-views-ddl-vorschlag.md`](sql-views-ddl-vorschlag.md)
- Schema-Snapshot: [`docs/db-exploration.md`](db-exploration.md)
- Drizzle-Scaffolding: [`src/lib/db/schema.ts`](../src/lib/db/schema.ts), [`src/lib/db/client.ts`](../src/lib/db/client.ts)
- Projekt-Doku im Vault: `alpino-kb/wiki/clients/bauservice/projects/bauservice-email-automation.md`
- Angebot v2 (2026-01): `alpino-kb/wiki/clients/bauservice/proposals/bauservice-2026-01-email-automation.md`
- Live-Portal (Demo): https://www.bauservice.it/de/intranet/beschluesse-projekte.html

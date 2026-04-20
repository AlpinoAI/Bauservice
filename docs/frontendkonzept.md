# Frontendkonzept — Bauservice Email-Automation

**Session 1 · 2026-04-20 · Status: Entwurf für Review mit Bauservice**

Dieses Dokument beschreibt das Zielbild des Next.js-Frontends für die AI-Powered Email-Automation von Bauservice. Es klärt Seitenstruktur, Komponenten-Inventar, State-Management, Integrationspunkte und offene Fragen, damit die Implementierung auf einer geteilten Grundlage starten kann. Implementiert wird später — heute nur Konzept.

Alle externen Systeme werden in dieser Phase gegen **Dummy-Endpoints** angesprochen; der Swap auf echte Backends (Weaviate, SQL-Views, Mailjet) erfolgt in Phase 2.

---

## 1. Zielbild & Nutzerfluss

Ein Bauservice-Mitarbeiter öffnet die Anwendung, um an einem Vormittag fünfzehn personalisierte Werbe-E-Mails an potenzielle Kunden rauszuschicken. Heute tippt er dafür manuell Beispiele aus vier Datenquellen zusammen — das Tool übernimmt das in einer geführten Oberfläche.

Der Workflow folgt fünf Schritten, die auch die Route-Struktur prägen:

1. **Empfängerauswahl.** Einzelne Empfänger picken, eine gespeicherte Liste laden oder CSV/XLSX hochladen. Jeder Empfänger trägt Profil-Attribute (Gewerk, Region, Branche, Größe).
2. **Automatische Beispielauswahl.** Pro Service (Ausschreibungen, Ergebnisse, Beschlüsse, Baukonzessionen) wählt das System semantisch passende Einträge — Default fünf pro Service, konfigurierbar.
3. **Email-Draft.** Ein MJML-Template wird serverseitig gerendert: Anrede, Einleitung, vier Service-Blöcke, Call-to-Action. Responsive Layout, Plain-Text-Fallback.
4. **Review & Anpassen.** Einzelne Beispiele austauschen, Services ein-/ausblenden, Texte editieren. Änderungen sind pro Empfänger persistent, Bulk-Actions möglich (z. B. "gleicher Service-Block für alle mit Gewerk X").
5. **Approve & Send.** Letzte Vorschau, Versand-Button, Bestätigungsdialog. Mailjet übernimmt, Status läuft in die Kampagnen-Übersicht zurück.

Alle Schritte sind wiederaufrufbar — eine Kampagne kann zwischengespeichert und später fortgesetzt werden.

---

## 2. Seiten & Routen (Next.js App Router)

```
app/
  layout.tsx                          # Auth-Guard, Top-Nav, Toaster
  page.tsx                            # Dashboard: offene Kampagnen, letzter Versand, Quick-Stats
  (auth)/
    login/page.tsx                    # Bauservice-Mitarbeiter-Login

  kampagnen/
    page.tsx                          # Übersicht: laufend · in Review · versandt · abgebrochen
    neu/page.tsx                      # Schritt 1 — Empfängerauswahl
    [id]/
      page.tsx                        # Schritte 2–4: Draft + Review
      versand/page.tsx                # Schritt 5: Approve & Send

  empfaenger/
    page.tsx                          # Liste + Suche + CSV-Upload
    [id]/page.tsx                     # Empfänger-Detail (Profil, Historie)

  einstellungen/
    templates/page.tsx                # MJML-Templates verwalten (Upload, Preview)
    services/page.tsx                 # Defaults pro Service (Beispielanzahl, Filter)
    nutzer/page.tsx                   # Nur Admin: Nutzerverwaltung

  api/
    dummy/
      weaviate/examples/route.ts      # POST — Beispielauswahl
      sql/recipients/route.ts         # GET — Empfängerstammdaten
      sql/campaigns/route.ts          # GET/POST — Kampagnen
      render/mjml/route.ts            # POST — MJML → HTML
      mailjet/send/route.ts           # POST — Versand-Trigger
```

**Route-Gruppen:**
- `(auth)` — Login, keine Top-Nav
- Alle übrigen Routes unter dem Auth-Guard in `layout.tsx`

---

## 3. Komponenten-Inventar

### Wiederverwendbare UI-Bausteine

| Komponente | Zweck |
|---|---|
| `LayoutShell` | Top-Nav, Sidebar, Toaster, Auth-State-Kontext |
| `DataTable` | Generische shadcn-Tabelle mit Sortierung, Filter, Pagination — für Empfänger, Kampagnen, Beispiele |
| `SearchFilterBar` | Suche + Filter-Chips + Ergebnis-Counter (Anlehnung an Bauservice-Portal-Filterleiste) |
| `StatusBadge` | Farbkodierte Badges für Kampagnen-Status (Draft/Review/Versandt/Fehler) |
| `EmptyState`, `LoadingState`, `ErrorState` | Standardisierte Placeholder |

### Feature-Komponenten (seitenspezifisch)

| Komponente | Zweck |
|---|---|
| `RecipientPicker` | Multi-Select aus Empfänger-Liste, inkl. Live-Suche und Profil-Preview |
| `RecipientUploadDialog` | CSV/XLSX-Upload mit Spalten-Mapping und Validierung |
| `ServicePanel` | Container für einen der 4 Services (Titel, Anzahl, Toggle "inkludieren?") |
| `ExampleCard` | Einzelnes Beispiel mit Metadaten und "Austauschen"-Button |
| `ExampleSwapSheet` | Side-Sheet mit alternativen Beispielen zur Auswahl (Weaviate-Results) |
| `ServiceToggle` | Ein-/Ausblenden eines Service-Blocks im Email-Draft |
| `EmailPreview` | Sandboxed iframe mit gerendertem HTML + Plain-Text-Toggle + Device-Size-Switch |
| `EditableTextBlock` | Inline-editierbarer Textbereich für Anrede/Einleitung/CTA |
| `ApprovalBar` | Sticky-Footer mit "Entwurf speichern", "Zur Freigabe", "Versenden" |
| `CampaignTimeline` | Statushistorie einer Kampagne (erstellt → reviewed → versandt) |

---

## 4. State & Datenflüsse

**Empfehlung:** React Server Components (RSC) als Default, Server Actions für Mutationen, ein kleiner Client-Store (Zustand) für den Review-Flow. Keine globale Redux/Context-Monstrosität.

**Begründung:** Listen (Empfänger, Kampagnen, Beispiele) werden serverseitig gerendert — weniger Client-JS, bessere SEO-irrelevant-aber-Geschwindigkeit, direkter DB-Zugriff in Server-Komponenten. Der Review-Screen hat viel interaktiven State (welche Beispiele sind gerade ausgewählt, welche Toggles sind an, welche Änderungen ungespeichert) — hier braucht es einen Client-Store. Zustand ist leichtgewichtig, passt zu App Router, vermeidet Context-Boilerplate.

**Daten-Quelle je Surface:**

| Surface | Quelle | Cache/Polling |
|---|---|---|
| Kampagnen-Liste | SQL-View (Dummy-Route) | RSC revalidate on mutation |
| Empfänger-Liste | SQL-View (Dummy-Route) | RSC, CSV-Upload triggert Revalidate |
| Beispielauswahl | Weaviate (Dummy-Route) | On-demand pro Service + Swap-Action |
| Email-Draft | Server-Action rendert MJML | Bei Beispieländerung neu rendern |
| Versand-Status | Mailjet-Webhook → SQL | SWR-Polling (alle 10 s) nur auf `/kampagnen/[id]/versand` |

**Client-Store (Zustand) hält nur:**
- aktuelle Kampagnen-ID, ausgewählte Beispiele pro Service, Toggle-Zustände, ungespeicherte Text-Edits, Dirty-Flag

---

## 5. Integrationspunkte (Dummy-Phase)

Alle Calls laufen in Phase 1 über stubbed API-Routen unter `app/api/dummy/*`. Die Response-Shapes sind stabil, Backend-Swap in Phase 2 ersetzt nur die Implementierung.

| Integration | Richtung | Auslösender Screen | Payload (verkürzt) |
|---|---|---|---|
| `POST /api/dummy/weaviate/examples` | Frontend → Weaviate | Review-Screen (Initial-Load, Swap) | `{ recipientId, service, n, filters? }` → `Example[]` |
| `GET /api/dummy/sql/recipients` | Frontend → SQL-View | `/empfaenger`, Picker | `?q=&gewerk=&region=&limit=` → `Recipient[]` |
| `GET /api/dummy/sql/campaigns` | Frontend → SQL | `/kampagnen` | `?status=&limit=` → `Campaign[]` |
| `POST /api/dummy/sql/campaigns` | Frontend → SQL | `/kampagnen/neu` | `{ name, recipientIds }` → `Campaign` |
| `POST /api/dummy/render/mjml` | Frontend → Render-Service | Bei jeder Beispieländerung | `{ templateId, payload }` → `{ html, text }` |
| `POST /api/dummy/mailjet/send` | Frontend → Mailjet | `/kampagnen/[id]/versand` | `{ campaignId }` → `{ jobId, accepted }` |

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
  status: 'draft' | 'review' | 'sending' | 'sent' | 'error';
  createdAt: string;
  createdBy: string;
  items: Array<{
    recipientId: number;
    selectedExamples: Record<Service, number[]>;
    serviceEnabled: Record<Service, boolean>;
    overrides?: { salutation?: string; intro?: string; cta?: string };
  }>;
};
```

**Abgeleitete UI-Regeln aus dem Schema:**

- **Opt-out respektieren.** Empfänger mit `Keine Werbung senden = 1` oder `Aktiv = 0` dürfen im `RecipientPicker` nicht auswählbar sein — hart filtern, nicht nur visuell warnen.
- **Sprache pro Empfänger.** `Sprache` bestimmt, ob `_D`- oder `_I`-Spalten im Mail-Render verwendet werden. Default-Template muss beide Varianten haben.
- **Rollen-Filter.** Beim Picker standardmäßig nur Kontakte mit `Anbieter = 1` zeigen (das sind die typischen Werbeempfänger); `Ausscheiber` sind öffentliche Stellen, `Kunde` sind Bestandskunden — als Filter-Chips anbieten.
- **Geografie-Filter.** `inBezirk_d` und `inProvinz_i` sind die primären Region-Filter für die Matching-Logik.
- **Gewerks-Matching** läuft über die `Unterkategorie`-Join-Tabellen; die Taxonomie wird aus `VectorDB_Oberkategorie_Unterkategorie` abgeleitet.

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

**Zugriff:** nur Bauservice-Mitarbeiter. Öffentlicher Endpoint gibt es nicht.

**Rollen-Vorschlag (minimal):**

| Rolle | Berechtigungen |
|---|---|
| `admin` | Alles. Zusätzlich: Nutzerverwaltung, Template-Management, Service-Defaults |
| `reviewer` | Kampagnen erstellen, reviewen, versenden. Kein Zugriff auf Einstellungen |

**Auth-Verfahren:** In der Konzeptphase offen. Favorit: **Magic-Link via Resend/SMTP** (passwortlos, keine SSO-Integration nötig, DSGVO-unproblematisch). Alternativen: klassisch E-Mail+Passwort, oder SSO falls Bauservice einen IdP hat. Muss im Kickoff geklärt werden.

**Session:** HTTP-only Cookies, 7-Tage-Lifetime, Refresh bei jeder aktiven Nutzung.

---

## 8. Offene Fragen an Bauservice

Durch den Schema-Snapshot vom 20.04.2026 sind einige Ausgangsfragen bereits beantwortet:

- **DBMS:** MySQL, bestätigt.
- **Empfängerdaten:** interne Tabelle `VectorDB_Kontakte`, kein separates CRM nötig. CSV-Upload bleibt als Ergänzung denkbar, ist aber nicht Pflicht.
- **Mehrsprachigkeit:** pro Empfänger über `Kontakte.Sprache` (DE/IT) und `_D`/`_I`-Spalten bereits strukturell vorgesehen. Templates müssen zweisprachig ausgeliefert werden.
- **Opt-out-Handling:** Flag `Keine Werbung senden` in `VectorDB_Kontakte` — muss im Picker hart filtern und im Versand-Audit mitprotokolliert werden.

Diese Punkte bleiben offen und müssen im Kickoff / Discovery geklärt werden:

1. **View-Strategie.** Die `VectorDB_*`-Tabellen sind offenbar Aufbereitungs-Tabellen — werden sie periodisch befüllt (Batch-Job bei Bauservice) oder sind es Views auf Live-Daten? Wie oft aktualisieren? Sync-Intervall für Weaviate-Reindex abhängig davon.
2. **Gewerks-Taxonomie.** Die Tabelle `VectorDB_Oberkategorie_Unterkategorie` strukturiert Gewerke. Gibt es Dokumentation / Anzahl der Kategorien? Für das Matching und die Filter-UI relevant.
3. **Absender-Identität & DKIM.** Welche Absenderadresse(n)? Ist Mailjet-DKIM-Setup für `bauservice.it` bereits vorhanden?
4. **Plain-Text-Fallback.** Muss ein Plain-Text-Part verpflichtend mitgehen (Deliverability-Best-Practice)?
5. **Template-Anzahl bei Launch.** Ein Template mit Variablen oder mehrere (Neu-Akquise vs. Bestandskunden, DE vs. IT separate Templates)?
6. **Auth-Verfahren & IdP.** Gibt es einen bestehenden IdP (Microsoft Entra, Google Workspace)? Sonst: Magic-Link ok?
7. **Matching-Kriterien.** Gewerk/Region (`inBezirk_d`, `inProvinz_i`) sind über das Schema klar. Gibt es weitere (historische Aufträge aus `Ausschreibungen_Teilnehmer`, Umsatzklasse, Netzwerk-Zugehörigkeit)?
8. **Versand-Audit.** Welche Daten müssen aus Compliance-Gründen pro Versand festgehalten werden (Versand-Zeitpunkt, gewählte Beispiele, Mitarbeiter-ID, Opt-out-Status zum Versandzeitpunkt)?
9. **DB-Zugang für Produktion.** MySQL-Port ist von außen blockiert; phpMyAdmin-Scraping ist nur Interims-Lösung. Benötigt: VPN, SSH-Tunnel oder Firewall-Freischaltung plus dediziertes Read-only-Konto (nicht `thaler` — dessen Zugangsdaten über Plain-HTTP liefen, sollten rotiert werden).

---

## 9. Dummy-Endpoints — Hinweis zur Phase 2

Alle Routen unter `app/api/dummy/*` liefern in Phase 1 statische bzw. pseudorandomisierte Responses mit den im Datenmodell (§ 5) beschriebenen Shapes. Das erlaubt, das Frontend komplett zu bauen und zu demonstrieren, ohne dass Weaviate, die Kundendaten-DB oder Mailjet produktiv angeschlossen sind.

**Swap in Phase 2:**
- `dummy/weaviate/examples` → Weaviate-Client mit semantischem Match
- `dummy/sql/*` → Prisma/Drizzle gegen Bestands-Views
- `dummy/render/mjml` → `mjml`-npm-Package serverseitig
- `dummy/mailjet/send` → `node-mailjet`

Die Umstellung geschieht pro Integration isoliert, das Frontend bleibt unverändert.

---

## Verweise

- Projekt-Doku im Vault: `alpino-kb/wiki/clients/bauservice/projects/bauservice-email-automation.md`
- Angebot v2 (2026-01): `alpino-kb/wiki/clients/bauservice/proposals/bauservice-2026-01-email-automation.md`
- Live-Portal (Demo): https://www.bauservice.it/de/intranet/beschluesse-projekte.html

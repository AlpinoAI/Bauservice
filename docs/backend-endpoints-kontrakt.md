# Backend-Endpoints — Kontrakt Frontend ↔ Matching/DB

**Stand 2026-04-22 · Autor: Julian · Adressat: Matthias**

## Start here

**Lies in dieser Reihenfolge:**
1. Diesen Kontrakt komplett durch (§ 1–9), vor allem den § 9 Opt-out-Hartfilter.
2. [`docs/sql-views-ddl-vorschlag.md`](sql-views-ddl-vorschlag.md) — 5 MySQL-View-DDLs + 3 Persistenz-Tabellen + Berechtigungen + Smoke-Tests.
3. Die TypeScript-Schemas unter [`src/lib/db/schema.ts`](../src/lib/db/schema.ts) — Spaltennamen und Typen sind kanonisch für das Frontend.
4. Zum Verhalten: die Dummy-Endpoints unter [`src/app/api/dummy/`](../src/app/api/dummy/) — das ist **der Behavioral-Spec**. JSON-Shapes und Filter-Verhalten dort sind der Gold-Standard; deine Implementierung muss das 1:1 liefern.

**Empfohlene Implementierungsreihenfolge** (jeder Schritt ist einzeln deploybar und unblockiert etwas Frontend-seitig):

| Reihe | Endpoint/View | Unblockt |
|---|---|---|
| 1 | `v_frontend_recipients` + `GET /sql/recipients` | Kontaktliste, Recipient-Picker, Login-Test |
| 2 | `v_frontend_{ausschreibungen,ergebnisse,beschluesse,konzessionen}` + `GET /sql/items` | Services-Tabelle, Item-Picker |
| 3 | `POST /matching/examples` und `POST /matching/recipients` (inkl. `isGewinner`/`isTeilnehmer`/`isKunde`) | Review-Flow, Auto-Klassifikation, Vorschläge |
| 4 | `POST /classify-recipient` (optional, falls Booleans in Matching-Response reichen) | Fallback-Pfad |
| 5 | `GET /sql/suggestions` | Dashboard-Widget |
| 6 | `campaigns` + `campaign_recipients` Persistenz + `GET/POST/PATCH /sql/campaigns[/id]` | Kampagnen-Liste, Draft-Persistenz |
| 7 | `ml_feedback` + `POST /feedback` | ML-Training-Signale |

**Zwei Entscheidungen liegen bei dir:**
- View-Refresh-Strategie: materialized (mit Sync-Job) oder live-view? → bestimmt Weaviate-Reindex-Kadenz.
- Feedback-Persistenz: reicht append-only wie im DDL-Vorschlag, oder brauchst du mehr Struktur fürs ML-Training?

**Was du NICHT brauchst (Julian-Seite oder separat):**
- Mailjet-Integration, DKIM, Auth-Flow, Render-Pipeline, Frontend-Routes.

---

## Überblick

Dieses Dokument beschreibt die HTTP-API zwischen dem Next.js-Frontend und den Matching-/DB-Services, die Matthias in Phase 2 liefert. In Phase 1 existieren alle Endpoints als Dummies unter `app/api/dummy/*` mit Fixture-Daten. **Die Response-Shapes sind der harte Kontrakt** — Matthias' echte Endpoints müssen dieselben Felder liefern, damit das Frontend ohne Änderung umgeschaltet werden kann.

## Inhalt

1. [Architektur-Überblick](#1-architektur-überblick)
2. [Datenmodell — `Recipient`, `Example`-Varianten](#2-datenmodell)
3. [SQL-Views (Matthias baut)](#3-sql-views)
4. [Matching-Endpoints](#4-matching-endpoints)
5. [SQL-Endpoints](#5-sql-endpoints)
6. [Feedback-Endpoint](#6-feedback-endpoint)
7. [Classify-Recipient-Endpoint](#7-classify-recipient-endpoint)
8. [Render + Send (Frontend-lokal)](#8-render--send-frontend-lokal)
9. [Opt-out-Hartfilter-Regel](#9-opt-out-hartfilter-regel)
10. [Offene Punkte](#10-offene-punkte)

---

## 1. Architektur-Überblick

```
Frontend (Next.js, Vercel EU)
   │
   ├─▶  /api/sql/*          → SQL-Views auf Bauservice-DB  (Matthias)
   ├─▶  /api/matching/*     → Weaviate + Matching-Heuristik (Matthias)
   ├─▶  /api/classify-recipient → Logik auf Ausschreibungen_Teilnehmer (Matthias)
   ├─▶  /api/feedback       → Persistenz für ML-Training (Matthias)
   ├─▶  /api/render/mjml    → Frontend-lokal (Julian)
   └─▶  /api/mailjet/send   → Frontend-lokal → Mailjet (Julian, Post-MVP)
```

Alle Calls sind JSON-REST. Basis-URL wird in Phase 2 per `NEXT_PUBLIC_API_BASE` konfigurierbar sein — bis dahin landet alles unter `/api/dummy/*`.

## 2. Datenmodell

### `Recipient`

Canonical TS-Shape ([src/lib/types.ts](../src/lib/types.ts)):

```ts
type Recipient = {
  id: number;                    // VectorDB_Kontakte.id
  nameDe: string;                // Kontakt_full_name_D (Firmenname oder Einzelperson)
  nameIt: string;                // Kontakt_full_name_I
  sprache: "de" | "it";          // Sprache
  email: string;                 // EMailAdresse
  pec?: string;                  // PEC (optional)
  bezirkDe?: string;             // inBezirk_d
  provinz?: string;              // inProvinz_i
  gewerke?: string[];            // aus Unterkategorie_wird_zusammengeführt → Oberkat-Map

  // NEU in Phase 2 (siehe docs/db-exploration.md):
  ansprechpartner?: {
    anrede: "Herr" | "Frau";     // aus Geschlecht abgeleitet
    vorname?: string;            // Vorname (75 % Füllquote)
    nachname: string;            // Nachname (75 %)
    titel?: string;              // Anrede_i — "Ing.", "Arch.", "Geom." (38 %)
  };

  rollen: {
    ausschreiber: boolean;       // Rolle-Flag "Ausscheiber"
    anbieter: boolean;           // Rolle-Flag "Anbieter"
    kunde: boolean;              // Rolle-Flag "Kunde"
  };
  aktiv: boolean;                // Aktiv-Flag
  optOut: boolean;               // "Keine Werbung senden"-Flag
  hatHistorie: boolean;          // Teilnehmer-Historie vorhanden (optional, aus JOIN)
};
```

**Pflicht**: `id`, `nameDe`, `nameIt`, `sprache`, `email`, `rollen`, `aktiv`, `optOut`.
**Nice-to-have**: `ansprechpartner`, `gewerke`, `bezirkDe`, `provinz`, `pec`, `hatHistorie`.

### `Example`-Varianten

Vier Diskriminanten-Typen, unterschieden durch `service`-Feld:

#### `ausschreibungen` → `AusschreibungExample`

```ts
{
  id: number;                        // VectorDB_Ausschreibungen.AusschreibungenID
  service: "ausschreibungen";
  datum?: string;                    // ISO (YYYY-MM-DD)
  bezirk?: string;                   // Bezirk (DE-Variante bevorzugt)
  beschreibungDe: string;            // Beschreibung_D
  beschreibungIt: string;            // Beschreibung_I
  gewerk?: string;                   // aus Hauptarbeiten.Unterkategorie → Oberkat
  ausschreiberId?: number;           // Ausschreiber_id
  ausschreiberName?: string;         // JOIN Kontakte.Kontakt_full_name_D
  nummer?: string;                   // Sichtbar in "(ID 87158)"-Suffix
  kategorien?: string[];             // Multiple Hauptarbeiten
  frist?: string;                    // Datum_Zuschlag wenn offen
  betrag?: number;                   // Vergabe-Betrag
  cig?: string;                      // CIG
  cup?: string;                      // CUP
  gewinnerId?: number;               // erst nach Zuschlag gesetzt
  quelle: { table: "VectorDB_Ausschreibungen"; pk: string };
}
```

#### `ergebnisse` → `ErgebnisExample` (Ausschreibung mit Zuschlag)

```ts
{
  id: number;                        // Fortlaufende Teilnehmer-ID
  service: "ergebnisse";
  datum?: string;                    // Datum_Zuschlag
  bezirk?: string;
  beschreibungDe: string;
  beschreibungIt: string;
  gewerk?: string;
  ausschreibungId: number;           // FK VectorDB_Ausschreibungen.AusschreibungenID
  ausschreiberId?: number;
  ausschreiberName?: string;
  teilnehmerId: number;              // FK Kontakte.id (Gewinner)
  teilnehmerNameDe: string;          // JOIN
  teilnehmerNameIt: string;
  nummer?: string;                   // Bekanntmachungs-ID
  kategorien?: string[];
  ausschreibungBetrag?: number;      // Ursprünglicher Vergabe-Betrag
  betrag?: number;                   // Zuschlag-Betrag
  punkteBewertung?: number;
  prozent?: number;                  // Nachlass in %
  quelle: { table: "VectorDB_Ausschreibungen_Teilnehmer"; pk: string };
}
```

#### `beschluesse` → `BeschlussExample` (Projektierung)

```ts
{
  id: number;                        // ProjektierungenId
  service: "beschluesse";
  datum?: string;                    // Datum
  bezirk?: string;                   // Bezirk_d
  beschreibungDe: string;            // BeschreibungD
  beschreibungIt: string;            // BeschreibungI
  gewerk?: string;
  ausschreiberName?: string;         // Bauherr / Vergabestelle
  nummer?: string;
  kategorien?: string[];
  beschlussNr?: string;              // BeschlussNr
  beschlussDatum?: string;           // BeschlussDatum (ISO)
  betrag?: number;
  geschaetzterBetrag?: number;       // GeschaetzterBetrag
  status?: string;                   // Status
  projekttyp?: string;
  quelle: { table: "VectorDB_Projektierungen"; pk: string };
}
```

#### `baukonzessionen` → `KonzessionExample`

```ts
{
  id: number;                        // KonzessionenID
  service: "baukonzessionen";
  datum?: string;                    // Datum
  bezirk?: string;                   // aus Bezirke_BezeichnungI → DE-Map
  beschreibungDe: string;            // conz_desc_d
  beschreibungIt: string;            // conz_desc_i
  gewerk?: string;                   // aus Konzessionen_Unterkategorie
  kategorien?: string[];
  gemeinde?: string;                 // Gemeinde
  konzessionenTyp?: string;          // KonzessionenTyp
  name?: string;                     // Bauherr-Name
  adresse?: string;
  ort?: string;
  quelle: { table: "VectorDB_Konzessionen"; pk: string };
}
```

### `WithScore<T>`

Matching-Endpoints liefern zusätzlich:

```ts
type WithScore<T> = T & {
  score: number;                     // 0..1 (höher = besser)
  reason?: string;                   // Menschenlesbare Begründung
                                     // z.B. "Passend zu Gewerk Tiefbau und Bezirk Eisacktal"
};
```

**Skala:** 0–1, Frontend zeigt farbigen Score-Bar: ≥0.8 grün, ≥0.6 amber, darunter grau. `reason` wird in ExampleCard + SwapSheet angezeigt.

## 3. SQL-Views

Pro Service eine materialisierte oder echte View, befüllt aus den `VectorDB_*`-Tabellen (siehe Schema-Snapshot in [docs/db-exploration.md](db-exploration.md)).

| View | Quell-Tabellen | Zweck |
|---|---|---|
| `v_frontend_recipients` | `VectorDB_Kontakte` (+ Aggregat aus `Ausschreibungen_Teilnehmer` für `hatHistorie`) | `Recipient`-Shape mit Ansprechpartner-Feldern (Vorname, Nachname, Geschlecht, Anrede_i). Filter: `Aktiv = 1` AND `Keine_Werbung_senden = 0` **serverseitig** (vgl. § 9). |
| `v_frontend_ausschreibungen` | `VectorDB_Ausschreibungen` + `VectorDB_Ausschreibungen_Hauptarbeiten` (Gewerk-Join) + JOIN auf `Kontakte` für `ausschreiberName` | `AusschreibungExample` |
| `v_frontend_ergebnisse` | `VectorDB_Ausschreibungen_Teilnehmer` + JOINs auf `Ausschreibungen` + `Kontakte` (Gewinner-Name), `prozent`/`Punkte` | `ErgebnisExample` |
| `v_frontend_beschluesse` | `VectorDB_Projektierungen` + Kategorien-Join | `BeschlussExample` |
| `v_frontend_konzessionen` | `VectorDB_Konzessionen` + Kategorien-Join + `Bezirke_BezeichnungI` → DE-Map | `KonzessionExample` |

**Aktualisierungsfrequenz:** offen, siehe § 10.

## 4. Matching-Endpoints

### `POST /matching/examples` — Beispiele für einen Empfänger

**Request:**
```json
{
  "recipientId": 2702,
  "service": "ausschreibungen",
  "n": 10
}
```

| Feld | Typ | Pflicht | Bemerkung |
|---|---|---|---|
| `recipientId` | `number` | ja | `VectorDB_Kontakte.id` |
| `service` | `"ausschreibungen" \| "ergebnisse" \| "beschluesse" \| "baukonzessionen"` | ja | |
| `n` | `number` | nein | Default 10. Frontend fordert 10 Items für Pool-Headroom (User kann 1–10 pro Service wählen). |

**Response:**
```json
{
  "items": [
    { /* WithScore<Example> */ }
  ],
  "total": 10
}
```

**Sortierung:** absteigend nach `score`. Frontend nimmt Top-5 als Default-Selection, User kann über Slider (1–10) beliebig viele aus dem Pool in die Mail packen.

### `POST /matching/recipients` — Empfänger für ein Item

**Request:**
```json
{
  "service": "ausschreibungen",
  "itemId": 87158,
  "n": 20
}
```

**Response:**
```json
{
  "items": [
    {
      /* ...Recipient... */
      "score": 0.91,
      "reason": "Passend zu Gewerk Hochbau und Bezirk Bozen",

      "isGewinner": true,
      "isTeilnehmer": true,
      "isKunde": false
    }
  ],
  "total": 42
}
```

**Neu (E.2):** die drei Booleans `isGewinner` / `isTeilnehmer` / `isKunde` pro Empfänger — abgeleitet aus:

- `isGewinner`: Empfänger ist `gewinner_id` einer Ausschreibung im Item-Kontext
- `isTeilnehmer`: Empfänger ist `TeilnehmerID` in `Ausschreibungen_Teilnehmer` dieses Items (kann gleichzeitig `isGewinner = true` sein)
- `isKunde`: `Kontakte.Rolle_Kunde = 1`

Das Frontend ruft `classifyRecipient({isGewinner, isTeilnehmer, isKunde})` clientseitig auf → Szenario B/C/A/D. Kein separater Trigger-Endpoint nötig.

## 5. SQL-Endpoints

### `GET /sql/recipients` — Empfängerstamm (Kontaktliste)

**Query-Parameter:**
| Parameter | Typ | Bemerkung |
|---|---|---|
| `q` | string | Substring-Match auf `nameDe`/`nameIt`/`email` |
| `bezirk` | string | Exact-Match auf `bezirkDe` |
| `rolle` | `anbieter \| ausschreiber \| kunde` | Filter auf Rollen-Flag |
| `segment` | `neu \| bestand \| alle` | `bestand` = `rolle.kunde=true` OR `hatHistorie=true`; `neu` = `rolle.anbieter=true` AND !bestand |
| `limit` | number | Default 50, max 500 |

**Response:** `{ items: Recipient[], total: number }` — gefiltert **serverseitig** um Opt-out + Inaktiv (siehe § 9).

### `GET /sql/items` — Service-spezifische Item-Liste

**Query:** `service` (Pflicht), `q`, `bezirk`, `limit`, optional `ausschreibungId` (für `ergebnisse` → nur Teilnehmer dieser Ausschreibung).

**Response:** `{ items: Example[], total: number, service: Service }`.

### `GET /sql/campaigns` + `POST /sql/campaigns` + `GET/PATCH /sql/campaigns/[id]`

Kampagnen-CRUD. Shape: `Campaign` aus [src/lib/types.ts:104-114](../src/lib/types.ts:104). Status nur `"draft"` oder `"sent"` (Phase 1). In Phase 2 vermutlich Persistenz via Drizzle/Prisma auf dedizierter Tabelle — Matthias entscheidet Schema.

### `GET /sql/suggestions` — Top-N vorausgewählte Empfänger×Item-Kombinationen fürs Dashboard

**Query:** `limit` (default 6), `minScore` (default 0.7).

**Response:**
```json
{
  "suggestions": [
    {
      "id": "2702-ausschreibungen-87158",
      "recipient": { "id": 2702, "nameDe": "...", "nameIt": "...", "sprache": "de", "bezirkDe": "Bozen", "gewerke": ["Planung"] },
      "item": { /* Example */ },
      "score": 0.94,
      "reason": "Passend zu Gewerk Planung und Bezirk Bozen",
      "scenarioId": "A"
    }
  ],
  "total": 42
}
```

Dashboard-Widget „Email-Vorschläge" rendert daraus Klickbare Cards → Campaign-Create mit vorausgefülltem Item+Recipient.

## 6. Feedback-Endpoint

### `POST /feedback` — „Passt"/„Passt nicht" pro Beispiel

**Request:**
```json
{
  "recipientId": 2702,
  "service": "ausschreibungen",
  "exampleId": 87158,
  "verdict": "passt_nicht",
  "note": "Falsches Gewerk"
}
```

| Feld | Pflicht | Bemerkung |
|---|---|---|
| `recipientId`, `service`, `exampleId`, `verdict` | ja | `verdict` in `"passt" \| "passt_nicht"` |
| `note` | nein | Freitext-Begründung |

**Response:** `{ "ok": true, "count": 42 }`.

**Phase-2-Persistenz:** Matthias entscheidet Schema — aus Frontend-Sicht reicht Append-only-Log mit `{at: ISO, mitarbeiterId?: string}`-Metadaten für spätere ML-Auswertung.

**Erwartung:** das Feedback-Signal fließt in den Score der `matching/*`-Endpoints ein (wiederholt als „passt nicht" markierte Items erscheinen seltener als Top-Treffer).

## 7. Classify-Recipient-Endpoint

### `POST /classify-recipient` — Szenario-Klassifikation pro Empfänger

**Request:**
```json
{
  "recipientId": 2702,
  "itemRef": { "service": "ausschreibungen", "itemId": 87158 }
}
```

| Feld | Pflicht | Bemerkung |
|---|---|---|
| `recipientId` | ja | |
| `itemRef` | nein | Wenn gesetzt: Klassifikation relativ zu diesem Item. Wenn weggelassen: global (Historie aller Ausschreibungen). |

**Response:**
```json
{ "scenarioId": "B" }
```

`scenarioId` in `"A" | "B" | "C" | "D"`:
- `B` — Gewinner-Flag für Item (oder global)
- `C` — Teilnehmer-Flag für Item (und nicht Gewinner)
- `A` — `isKunde = true` (Bestandskunde)
- `D` — kein Signal (Kaltakquise)

**Alternative:** Diese Info kann auch direkt in der `POST /matching/recipients`-Response (§ 4) mitgeliefert werden (`isGewinner`/`isTeilnehmer`/`isKunde`). Der Classify-Endpoint ist nur für Einzelabfragen nötig (z.B. pro-Empfänger-Lookup im Draft-Build).

## 8. Render + Send (Frontend-lokal)

Informativ — Julian implementiert, Matthias muss nichts tun.

### `POST /render/mjml`

- Input: `RenderPayload` (scenario + sprache + recipient + examples + serviceEnabled + overrides + pinnedExample)
- Output: `{ html, text, subject }`
- Template-Content in `src/lib/email-template-content/{de,it}.ts` (PR-pflegbar, IT-Sign-off durch Meinrad offen).

### `POST /mailjet/send`

- Input: `{ campaignId, recipientIds }`
- Output: `{ jobId, accepted, rejected, demoMode }`
- **Opt-out-Re-Check** zum Sendzeitpunkt (vgl. § 9) — nicht Matthias' Job, aber gut zu wissen: Frontend prüft nochmal, auch wenn Matchings/SQL-Views bereits filtern.

## 9. Opt-out-Hartfilter-Regel

**Jede Read-Operation auf `Kontakte`-Basis filtert serverseitig auf:**

```sql
WHERE Aktiv = 1
  AND (Keine_Werbung_senden IS NULL OR Keine_Werbung_senden = 0)
```

Das gilt für:
- `/sql/recipients`
- `/sql/suggestions`
- `/matching/recipients`
- Implizit auch `/matching/examples` (Fallback-Logik muss den recipient-lookup ebenfalls filtern)

Das Frontend nimmt `optOut=true`-Empfänger **nicht** mehr an (Klartextprüfung im Send-Stub) — ist aber defensive depth, nicht primäre Filter-Ebene.

**DSGVO-Audit**: Die Filterung MUSS auf DB-Ebene passieren, nicht nur in der API. Gern als VIEW-Constraint fixieren, damit auch ad-hoc-Queries es respektieren.

## 10. Offene Punkte

| Punkt | Besitzer | Kommentar |
|---|---|---|
| View-Refresh-Frequenz (`VectorDB_*` Sync) | Bauservice/Matthias | Batch täglich? Stündlich? Bestimmt Weaviate-Reindex-Kadenz und Dashboard-Freshness. |
| Score-Skala-Interpretation | Matthias | Liefert `0..1` kontinuierlich oder bucketiert (high/med/low)? Frontend kann beides darstellen. |
| Matching-Kriterien jenseits Gewerk/Region | Bauservice | Historische Aufträge (Teilnehmer-Frequenz), Umsatzklasse, Netzwerk? → beeinflusst Score-Formel. |
| Feedback-Persistenz-Schema | Matthias | Append-only-Tabelle `ml_feedback (recipient_id, service, example_id, verdict, note, at, mitarbeiter_id)` als Startpunkt. |
| Versand-Audit-Pflichtfelder | Bauservice | Was MUSS pro Versand geloggt werden (DSGVO/Compliance)? |
| Production-DB-Zugang | Bauservice/Matthias | VPN/SSH-Tunnel + Read-only-Konto. Plain-HTTP-phpMyAdmin ist Interims. |
| Authentifizierungs-Flow | Kickoff | Magic-Link (Resend) vs. Basic-Auth — blockt nicht die API-Kontrakte. |

## Verweise

- Frontend-Konzept Rev 3: [docs/frontendkonzept.md](frontendkonzept.md)
- Schema-Snapshot: [docs/db-exploration.md](db-exploration.md) (inkl. FK-Matrix und ungenutzter `Kontakte`-Felder wie `Vorname`/`Nachname`/`Geschlecht`)
- ClickUp-Task (Backend-Endpoints): [86c9cwn0v](https://app.clickup.com/t/86c9cwn0v)
- ClickUp-Task (Matching Kunde→Auftrag): [86c9cwejx](https://app.clickup.com/t/86c9cwejx)
- ClickUp-Task (Matching Auftrag→Kunde): [86c9cwgfa](https://app.clickup.com/t/86c9cwgfa)

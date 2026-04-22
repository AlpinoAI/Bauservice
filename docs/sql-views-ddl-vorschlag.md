# SQL-Views DDL-Vorschlag — `v_frontend_*` für Matthias

**Stand 2026-04-22 · Companion zu [docs/backend-endpoints-kontrakt.md](backend-endpoints-kontrakt.md)**

Dieses Dokument schlägt die MySQL-View-Definitionen vor, die das Frontend in Phase 2 direkt via Drizzle konsumieren würde. Die Views sind die **Integrations-Schnittstelle**: Shape-Änderungen in `VectorDB_*`-Source-Tabellen werden hier gekapselt, das Frontend bleibt stabil.

Alle Views sind:

- **Read-only** für den Frontend-DB-User (dediziertes Konto empfohlen).
- **Gefiltert** auf DSGVO-Opt-out (`Keine_Werbung_senden = 1` oder `Aktiv = 0` werden bei Empfängern ausgeblendet).
- **Bezirk-normalisiert** auf die deutsche Variante (Frontend-Konvention).
- **Gewerk-aggregiert** via Join auf `VectorDB_Oberkategorie_Unterkategorie`.

## Indexes, Refresh, Performance

- Views sind `CREATE OR REPLACE VIEW` ohne Materialisierung — MySQL plant die Joins jedes Mal neu. Bei gelegentlichen Slow-Queries prüfen:
  - Index auf `VectorDB_Kontakte.Aktiv + Keine_Werbung_senden` kombiniert.
  - Index auf `VectorDB_Ausschreibungen_Teilnehmer.TeilnehmerID`.
  - Index auf `VectorDB_Ausschreibungen_Hauptarbeiten.Ausschreibung`.
- Falls Performance nicht reicht, Wechsel auf **materialized views** oder einen Sync-Job (z.B. `INSERT INTO v_frontend_*_snapshot SELECT ...` nächtlich). Das Frontend-Schema in `src/lib/db/schema.ts` bleibt gleich.

---

## 1. `v_frontend_recipients`

```sql
CREATE OR REPLACE VIEW v_frontend_recipients AS
SELECT
  k.id,
  TRIM(k.Kontakt_full_name_D) AS name_de,
  TRIM(k.Kontakt_full_name_I) AS name_it,
  k.Sprache AS sprache,
  k.EMailAdresse AS email,
  NULLIF(k.PEC, '') AS pec,
  k.inBezirk_d AS bezirk_de,
  k.inProvinz_i AS provinz,

  -- Gewerke als Komma-Liste. Nötiger Map-Join, damit das Frontend
  -- nicht 100 Unterkategorie-Strings kennen muss.
  (
    SELECT GROUP_CONCAT(DISTINCT okuk.oberkategorie_de SEPARATOR ',')
    FROM VectorDB_Oberkategorie_Unterkategorie okuk
    WHERE FIND_IN_SET(okuk.unterkategorie, k.Unterkategorie_wird_zusammengeführt) > 0
  ) AS gewerke,

  NULLIF(TRIM(k.Vorname), '') AS ansprechpartner_vorname,
  NULLIF(TRIM(k.Nachname), '') AS ansprechpartner_nachname,
  NULLIF(k.Geschlecht, '') AS ansprechpartner_geschlecht,
  NULLIF(k.Anrede_i, '') AS ansprechpartner_titel,

  COALESCE(k.Ausscheiber, 0) AS rolle_ausschreiber,
  COALESCE(k.Anbieter, 0) AS rolle_anbieter,
  COALESCE(k.Kunde, 0) AS rolle_kunde,
  COALESCE(k.Aktiv, 0) AS aktiv,
  COALESCE(k.Keine_Werbung_senden, 0) AS opt_out,

  -- Historien-Flag: Empfänger hat jemals als Teilnehmer teilgenommen.
  EXISTS (
    SELECT 1 FROM VectorDB_Ausschreibungen_Teilnehmer t
    WHERE t.TeilnehmerID = k.id
  ) AS hat_historie
FROM VectorDB_Kontakte k
WHERE k.Aktiv = 1
  AND COALESCE(k.Keine_Werbung_senden, 0) = 0;
```

**Anmerkungen:**
- Opt-out-Hartfilter ist auf View-Ebene, nicht in der App. DSGVO-Audit-Argument: auch Ad-hoc-Queries respektieren das.
- `Geschlecht`-Werte sind in der DB „M"/„F"/„D" (oder deutsche Langformen) — das Frontend mappt `"M"` → `"Herr"`, `"F"` → `"Frau"` clientseitig. Alternativ in der View schon mappen.
- Ansprechpartner-Felder (`Vorname`/`Nachname`/`Geschlecht`/`Anrede_i`) existieren in `VectorDB_Kontakte` mit 75 %/75 %/75 %/38 % Füllquote — siehe [docs/db-exploration.md](db-exploration.md).

## 2. `v_frontend_ausschreibungen`

```sql
CREATE OR REPLACE VIEW v_frontend_ausschreibungen AS
SELECT
  a.AusschreibungenID AS id,
  a.Datum AS datum,
  a.Bezirk AS bezirk,

  -- Primäres Gewerk = erste Hauptarbeit-Unterkategorie, auf Oberkat gemappt.
  (
    SELECT okuk.oberkategorie_de
    FROM VectorDB_Ausschreibungen_Hauptarbeiten h
    JOIN VectorDB_Oberkategorie_Unterkategorie okuk
      ON okuk.unterkategorie = h.Unterkategorie
    WHERE h.Ausschreibung = a.AusschreibungenID
    LIMIT 1
  ) AS gewerk,

  a.Beschreibung_D AS beschreibung_de,
  a.Beschreibung_I AS beschreibung_it,

  a.Ausschreiber_id AS ausschreiber_id,
  (SELECT TRIM(Kontakt_full_name_D) FROM VectorDB_Kontakte WHERE id = a.Ausschreiber_id) AS ausschreiber_name,

  CAST(a.AusschreibungenID AS CHAR) AS nummer,

  -- Kategorien als Komma-Liste für die UI-Badge-Row.
  (
    SELECT GROUP_CONCAT(DISTINCT okuk.oberkategorie_de SEPARATOR ',')
    FROM VectorDB_Ausschreibungen_Hauptarbeiten h
    JOIN VectorDB_Oberkategorie_Unterkategorie okuk
      ON okuk.unterkategorie = h.Unterkategorie
    WHERE h.Ausschreibung = a.AusschreibungenID
  ) AS kategorien,

  a.Datum_Zuschlag AS frist,
  a.Betrag AS betrag,
  a.CIG AS cig,
  a.CUP AS cup,
  a.gewinner_id AS gewinner_id
FROM VectorDB_Ausschreibungen a;
```

## 3. `v_frontend_ergebnisse`

```sql
CREATE OR REPLACE VIEW v_frontend_ergebnisse AS
SELECT
  t.rowid AS id,  -- oder CONCAT(t.AusschreibungenID,'-',t.TeilnehmerID) als stabile composite-PK
  a.Datum_Zuschlag AS datum,
  a.Bezirk AS bezirk,
  (
    SELECT okuk.oberkategorie_de
    FROM VectorDB_Ausschreibungen_Hauptarbeiten h
    JOIN VectorDB_Oberkategorie_Unterkategorie okuk
      ON okuk.unterkategorie = h.Unterkategorie
    WHERE h.Ausschreibung = a.AusschreibungenID
    LIMIT 1
  ) AS gewerk,
  a.Beschreibung_D AS beschreibung_de,
  a.Beschreibung_I AS beschreibung_it,
  t.AusschreibungenID AS ausschreibung_id,
  a.Ausschreiber_id AS ausschreiber_id,
  (SELECT TRIM(Kontakt_full_name_D) FROM VectorDB_Kontakte WHERE id = a.Ausschreiber_id) AS ausschreiber_name,
  t.TeilnehmerID AS teilnehmer_id,
  (SELECT TRIM(Kontakt_full_name_D) FROM VectorDB_Kontakte WHERE id = t.TeilnehmerID) AS teilnehmer_name_de,
  (SELECT TRIM(Kontakt_full_name_I) FROM VectorDB_Kontakte WHERE id = t.TeilnehmerID) AS teilnehmer_name_it,
  CAST(t.AusschreibungenID AS CHAR) AS nummer,
  (
    SELECT GROUP_CONCAT(DISTINCT okuk.oberkategorie_de SEPARATOR ',')
    FROM VectorDB_Ausschreibungen_Hauptarbeiten h
    JOIN VectorDB_Oberkategorie_Unterkategorie okuk
      ON okuk.unterkategorie = h.Unterkategorie
    WHERE h.Ausschreibung = a.AusschreibungenID
  ) AS kategorien,
  a.Betrag AS ausschreibung_betrag,
  t.Betrag AS betrag,
  t.PunkteBewertung AS punkte_bewertung,
  t.prozent AS prozent
FROM VectorDB_Ausschreibungen_Teilnehmer t
JOIN VectorDB_Ausschreibungen a ON a.AusschreibungenID = t.AusschreibungenID
WHERE a.gewinner_id = t.TeilnehmerID;  -- nur Gewinner-Zeilen
```

**Anmerkung:** Falls die Teilnehmer-Tabelle keine stabile `rowid` hat, stattdessen eine generierte ID als `HASH(AusschreibungenID, TeilnehmerID)` oder die Primary-Key-Kombination verwenden.

## 4. `v_frontend_beschluesse`

```sql
CREATE OR REPLACE VIEW v_frontend_beschluesse AS
SELECT
  p.ProjektierungenId AS id,
  p.Datum AS datum,
  p.Bezirk AS bezirk,
  (
    SELECT okuk.oberkategorie_de
    FROM VectorDB_Projektierungen_Unterkategorie puk
    JOIN VectorDB_Oberkategorie_Unterkategorie okuk
      ON okuk.unterkategorie = puk.Unterkategorie
    WHERE puk.Projektierung = p.ProjektierungenId
    LIMIT 1
  ) AS gewerk,
  p.BeschreibungD AS beschreibung_de,
  p.BeschreibungI AS beschreibung_it,
  p.Ausschreiber AS ausschreiber_name,
  CAST(p.ProjektierungenId AS CHAR) AS nummer,
  (
    SELECT GROUP_CONCAT(DISTINCT okuk.oberkategorie_de SEPARATOR ',')
    FROM VectorDB_Projektierungen_Unterkategorie puk
    JOIN VectorDB_Oberkategorie_Unterkategorie okuk
      ON okuk.unterkategorie = puk.Unterkategorie
    WHERE puk.Projektierung = p.ProjektierungenId
  ) AS kategorien,
  p.BeschlussNr AS beschluss_nr,
  p.BeschlussDatum AS beschluss_datum,
  p.Betrag AS betrag,
  p.GeschaetzterBetrag AS geschaetzter_betrag,
  p.Status AS status,
  p.Projekttyp AS projekttyp
FROM VectorDB_Projektierungen p;
```

## 5. `v_frontend_konzessionen`

```sql
CREATE OR REPLACE VIEW v_frontend_konzessionen AS
SELECT
  k.KonzessionenID AS id,
  k.Datum AS datum,
  -- Bezirk kommt italienisch aus Konzessionen → DE-Mapping via lookup oder CASE.
  COALESCE(
    (SELECT bezirk_de FROM bezirk_it_to_de WHERE bezirk_it = k.Bezirke_BezeichnungI),
    k.Bezirke_BezeichnungI
  ) AS bezirk,
  (
    SELECT okuk.oberkategorie_de
    FROM VectorDB_Konzessionen_Unterkategorie kuk
    JOIN VectorDB_Oberkategorie_Unterkategorie okuk
      ON okuk.unterkategorie = kuk.Unterkategorie
    WHERE kuk.Konzession = k.KonzessionenID
    LIMIT 1
  ) AS gewerk,
  k.conz_desc_d AS beschreibung_de,
  k.conz_desc_i AS beschreibung_it,
  (
    SELECT GROUP_CONCAT(DISTINCT okuk.oberkategorie_de SEPARATOR ',')
    FROM VectorDB_Konzessionen_Unterkategorie kuk
    JOIN VectorDB_Oberkategorie_Unterkategorie okuk
      ON okuk.unterkategorie = kuk.Unterkategorie
    WHERE kuk.Konzession = k.KonzessionenID
  ) AS kategorien,
  k.Gemeinde AS gemeinde,
  k.KonzessionenTyp AS konzessionen_typ,
  k.Name AS name,
  k.adresse AS adresse,
  k.Ort AS ort
FROM VectorDB_Konzessionen k;
```

**Lookup-Tabelle** `bezirk_it_to_de` (statisch, ~10 Zeilen) erleichtert die Frontend-Arbeit erheblich. Aktuelle Zuordnung aus `src/lib/filter-options.ts`:

```sql
CREATE TABLE IF NOT EXISTS bezirk_it_to_de (
  bezirk_it varchar(50) PRIMARY KEY,
  bezirk_de varchar(50) NOT NULL
);

INSERT INTO bezirk_it_to_de VALUES
  ('Val Pusteria',       'Pustertal'),
  ('Valle Isarco',       'Eisacktal'),
  ('Val Venosta',        'Vinschgau'),
  ('Burgraviato',        'Burggrafenamt'),
  ('Oltradige Bassa Atesina', 'Überetsch Unterland'),
  ('Bolzano',            'Bozen'),
  ('Salto Sciliar',      'Salten-Schlern'),
  ('Alta Valle Isarco',  'Wipptal');
```

## 6. Persistente Tabellen (nicht Views, sondern read+write)

Neben den Read-only-Views braucht Phase 2 zwei neue Tabellen, die das Frontend **schreibt**:

```sql
CREATE TABLE campaigns (
  id varchar(64) PRIMARY KEY,
  name varchar(255) NOT NULL,
  status varchar(20) NOT NULL,           -- draft | sent
  origin varchar(20) NOT NULL,           -- recipient | item
  item_ref_service varchar(30),
  item_ref_item_id int,
  scenario_id varchar(4),                -- A | B | C | D
  created_by varchar(100) NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at timestamp NULL
);

CREATE TABLE campaign_recipients (
  campaign_id varchar(64) NOT NULL,
  recipient_id int NOT NULL,
  PRIMARY KEY (campaign_id, recipient_id),
  INDEX (recipient_id)
);

CREATE TABLE ml_feedback (
  id int AUTO_INCREMENT PRIMARY KEY,
  recipient_id int NOT NULL,
  service varchar(30) NOT NULL,          -- ausschreibungen | ergebnisse | ...
  example_id int NOT NULL,
  verdict varchar(20) NOT NULL,          -- passt | passt_nicht
  note text,
  mitarbeiter_id varchar(100),
  at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (recipient_id, service),
  INDEX (example_id)
);
```

`campaigns` + `campaign_recipients` können entweder in der bestehenden `bauservice`-DB leben oder in einer eigenen Kampagnen-DB (Empfehlung: eigene, damit Read-only-Semantik der Bauservice-Daten klar bleibt).

`ml_feedback` ist Append-only; Matthias' Matching liest davon beim Score-Berechnen (z.B. Treffer mit ≥3× „Passt nicht"-Votes bei demselben Recipient-Service-Paar werden depriorisiert).

## 7. Berechtigungen

```sql
-- Read-only-User für das Frontend:
CREATE USER 'frontend_reader'@'%' IDENTIFIED BY '<strong-password>';
GRANT SELECT ON bauservice.v_frontend_recipients TO 'frontend_reader'@'%';
GRANT SELECT ON bauservice.v_frontend_ausschreibungen TO 'frontend_reader'@'%';
GRANT SELECT ON bauservice.v_frontend_ergebnisse TO 'frontend_reader'@'%';
GRANT SELECT ON bauservice.v_frontend_beschluesse TO 'frontend_reader'@'%';
GRANT SELECT ON bauservice.v_frontend_konzessionen TO 'frontend_reader'@'%';

-- Schreibrechte für Kampagnen + Feedback (separat, falls eigene DB):
GRANT INSERT, UPDATE, DELETE ON kampagnen.campaigns TO 'frontend_reader'@'%';
GRANT INSERT, DELETE ON kampagnen.campaign_recipients TO 'frontend_reader'@'%';
GRANT INSERT ON kampagnen.ml_feedback TO 'frontend_reader'@'%';
GRANT SELECT ON kampagnen.* TO 'frontend_reader'@'%';

FLUSH PRIVILEGES;
```

## 8. Test-Queries

Nach dem Anlegen der Views lohnen diese Smoke-Tests:

```sql
-- Plausibilitäten
SELECT COUNT(*) AS total_recipients FROM v_frontend_recipients;       -- sollte ~22k sein
SELECT COUNT(*) FROM v_frontend_recipients WHERE opt_out = 1;         -- MUSS 0 sein (Hartfilter)
SELECT COUNT(*) FROM v_frontend_recipients WHERE aktiv = 0;           -- MUSS 0 sein

-- Ansprechpartner-Coverage
SELECT
  SUM(ansprechpartner_vorname IS NOT NULL) * 100.0 / COUNT(*) AS pct_vorname,
  SUM(ansprechpartner_titel IS NOT NULL)   * 100.0 / COUNT(*) AS pct_titel
FROM v_frontend_recipients;
-- Erwartung: ~75 % Vorname, ~38 % Titel (aus docs/db-exploration.md)

-- Gewerk-Verteilung
SELECT gewerke, COUNT(*) FROM v_frontend_recipients
WHERE gewerke IS NOT NULL GROUP BY gewerke ORDER BY 2 DESC LIMIT 20;

-- Ein konkreter Empfänger mit Ansprechpartner + Gewerk
SELECT id, name_de, ansprechpartner_vorname, ansprechpartner_nachname,
       ansprechpartner_titel, ansprechpartner_geschlecht, gewerke
FROM v_frontend_recipients
WHERE ansprechpartner_vorname IS NOT NULL
LIMIT 5;
```

## Referenzen

- Schema-Snapshot: [docs/db-exploration.md](db-exploration.md)
- Endpoint-Kontrakt: [docs/backend-endpoints-kontrakt.md](backend-endpoints-kontrakt.md)
- Drizzle-Schemas: [src/lib/db/schema.ts](../src/lib/db/schema.ts)
- Drizzle-Client: [src/lib/db/client.ts](../src/lib/db/client.ts)

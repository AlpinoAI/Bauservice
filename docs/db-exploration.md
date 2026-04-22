# DB-Exploration `bauservice` (Snapshot 2026-04-21)

Explorativer Auszug aus `http://167.235.240.105` (phpMyAdmin, Login `thaler`).
Grundlage für Phase 2 / das Endpoint-Kontrakt-Gespräch mit Matthias.

## 1 Bestand

10 `VectorDB_*`-Tabellen. Relevante Kerntabellen:

| Tabelle | Rows | Pflicht-Feldbefüllung |
|---|---:|---|
| `VectorDB_Kontakte` | 23 322 | 13 622 mit Email, aktiv, nicht opt-out |
| `VectorDB_Ausschreibungen` | 84 923 | 100 % Beschreibung + Bezirk |
| `VectorDB_Ausschreibungen_Teilnehmer` | 378 064 | 14 020 distinkte Teilnehmer |
| `VectorDB_Ausschreibungen_Hauptarbeiten` | 194 120 | FK auf Unterkategorie |
| `VectorDB_Ausschreibungen_AbtrennbareArbeiten` | 46 774 | optional, `SOA` als Sekundär-Klassifikation |
| `VectorDB_Projektierungen` | 100 645 | 100 % Beschreibung |
| `VectorDB_Projektierungen_Unterkategorie` | 147 104 | FK auf Unterkategorie |
| `VectorDB_Konzessionen` | 239 734 | 99,9 % Beschreibung |
| `VectorDB_Konzessionen_Unterkategorie` | 242 666 | FK auf Unterkategorie |
| `VectorDB_Oberkategorie_Unterkategorie` | 152 | Trade-Taxonomie (nur IT) |

**Daten-Stand:** Jüngste `Datum`-Werte liegen bei 2012 (Demo-DB = historischer Snapshot). Für das Frontend-Testing
unkritisch, die Beschreibungen und CIG/CUP-Referenzen wirken wie aus 2025/2026 aktualisiert.

## 2 Mapping-Vorschlag (Endpoint → Frontend-Typ)

Mit der aktuellen Frontend-Typisierung (`src/lib/types.ts`) abgeglichen.

### 2.1 `Recipient` ← `VectorDB_Kontakte`

| Frontend | DB-Spalte | Hinweis |
|---|---|---|
| `id` | `id` (int) | **Nicht unique**: 23 322 Rows / 11 388 distinkte IDs — Endpoint sollte `GROUP BY id` liefern. |
| `nameDe` | `TRIM(Kontakt_full_name_D)` | Trailing-Whitespace trimmen. |
| `nameIt` | `TRIM(Kontakt_full_name_I)` | Bei Einzelpersonen identisch mit `nameDe`. |
| `sprache` | `Sprache` | Werte `Deutsch`/`Italiano`/`English` → `de`/`it`/`de` (Fallback). |
| `email` | `EMailAdresse` | Teilweise mit führendem `\t` — trimmen. |
| `pec` | `PEC` | Optional. |
| `bezirkDe` | `inBezirk_d` | Bereits auf Deutsch (`Pustertal`, `Eisacktal`, …). |
| `bezirkIt` | `inBezirk_i` | Optional — aktuell nicht in Frontend-Typ, wäre sinnvoll. |
| `provinz` | `inProvinz_i` | `Prov. BZ`, `Prov. TN`, … |
| `rollen.ausschreiber` | `Ausscheiber` (sic) | Tippfehler in DB, Endpoint-Feld sollte `ausschreiber` heissen. |
| `rollen.anbieter` | `Anbieter` | |
| `rollen.kunde` | `Kunde` | |
| `aktiv` | `Aktiv` | Hartfilter schon bei SQL anwenden. |
| `optOut` | `` `Keine Werbung senden` `` | Spaltenname mit Leerzeichen → Backticks. Hartfilter schon bei SQL anwenden. |
| `hatHistorie` | abgeleitet | `EXISTS (SELECT 1 FROM VectorDB_Ausschreibungen_Teilnehmer t WHERE t.TeilnehmerID = k.id)` |
| `gewerke` | `Unterkategorie_wird_zusammengeführt` | Freitext-String mit Oberkategorien-Namen (IT); optional als Array zurückliefern. |

### 2.2 `AusschreibungExample` ← `VectorDB_Ausschreibungen` (+ Joins)

| Frontend | DB-Spalte | Hinweis |
|---|---|---|
| `id` | `AusschreibungenID` (PK) | |
| `datum` | `Datum` | |
| `bezirk` | `Bezirk` | Italienisch, teilweise auch Nicht-Südtirol (`Treviso`, `Belluno`). |
| `beschreibungDe` | `Beschreibung_D` | |
| `beschreibungIt` | `Beschreibung_I` | |
| `ausschreiberId` | `Ausschreiber_id` | FK → Kontakte. |
| `gewinnerId` | `gewinner_id` | `0` wenn kein Zuschlag. |
| `betrag` | `Betrag` | Euro, float. |
| `cig` / `cup` | `CIG` / `CUP` | Vergabe-Codes. |
| `gewerk` | via Join | `VectorDB_Ausschreibungen_Hauptarbeiten h JOIN VectorDB_Oberkategorie_Unterkategorie ou ON ou.UnterkategorieID = h.Unterkategorie` → `Oberkat` (nur IT). Bei mehreren: die mit grösstem `h.Betrag`. |

Weitere interessante Felder in `VectorDB_Ausschreibungen`, die aktuell **nicht** im Frontend-Typ sind, aber für spätere Matching-Kriterien relevant sein könnten: `Datum_Zuschlag`, `Ausgang_i`, `AnzahlTeilnehmer`, `Projektant_id`, `Vergabestelle_id`, `Vergabeart_i`, `Zuschlagskriterien_i`, `Kodex`, `RUP`.

### 2.3 `ErgebnisExample` ← `VectorDB_Ausschreibungen_Teilnehmer` + Ausschreibungen + Kontakte

| Frontend | DB-Spalte | Hinweis |
|---|---|---|
| `id` | synthetisch `CONCAT(AusschreibungenID, '-', TeilnehmerID)` | Es gibt keinen PK. |
| `ausschreibungId` | `t.AusschreibungenID` | |
| `teilnehmerId` | `t.TeilnehmerID` | |
| `teilnehmerNameDe/It` | Join Kontakte | |
| `betrag` | `t.Betrag` | Angebotssumme des Teilnehmers. |
| `punkteBewertung` | `t.PunkteBewertung` | Oft `0` (nur bei ökon.-technischer Vergabe gefüllt). |
| `prozent` | `t.prozent` | Prozentueller Abschlag. |
| `datum`, `bezirk`, `beschreibung*`, `gewerk` | aus Parent-Ausschreibung | Gleiche Join-Logik wie 2.2. |

Zusätzlich nützlich: `Ausschlussgrund`, `BemerkungI`.

### 2.4 `BeschlussExample` ← `VectorDB_Projektierungen` (+ Unterkategorie-Join)

| Frontend | DB-Spalte | Hinweis |
|---|---|---|
| `id` | `ProjektierungenId` (PK) | |
| `datum` | `Datum` | |
| `bezirk` | `Bezirk` | **Nur Italienisch** (`Valle Isarco`, `Oltradige Bassa Atesina`, …). |
| `beschreibungDe` | `BeschreibungD` | |
| `beschreibungIt` | `BeschreibungI` | |
| `beschlussNr` | `TRIM(BeschlussNr)` | **Trailing-Whitespace-Padding (~250 Zeichen)** — Endpoint muss trimmen. |
| `beschlussDatum` | `BeschlussDatum` | Kann `0000-00-00` sein → auf `NULL` normalisieren. |
| `betrag` | `Betrag` | |
| `geschaetzterBetrag` | `GeschaetzterBetrag` | |
| `status` | `Status` | Werte wie `Procedure negoziate`, `In Planung`, …  Nur IT, kleines Vokabular. |
| `gewerk` | via Join | `VectorDB_Projektierungen_Unterkategorie → Oberkategorie` (IT). |

Weitere Felder mit potenziellem Matching-Wert: `Projektyp`, `ProjektArt`, `Quelle`, `Projektant`, `Bauleiter`, `HSLPlaner`, `ElektroPlaner`, `RUP`, `CUP`, `CIG`, `Kodex`.

### 2.5 `KonzessionExample` ← `VectorDB_Konzessionen` (+ Unterkategorie-Join)

| Frontend | DB-Spalte | Hinweis |
|---|---|---|
| `id` | `KonzessionenID` (PK) | |
| `datum` | `Datum` | |
| `bezirk` | `Bezirke_BezeichnungI` | **Nur Italienisch**. |
| `provinz` | `Provinzen_BezeichnungI` | Optional. |
| `beschreibungDe` | `conz_desc_d` | |
| `beschreibungIt` | `conz_desc_i` | |
| `gemeinde` | `Gemeinde` | |
| `konzessionenTyp` | `KonzessionenTyp` | z. B. `Concessione edile`. |
| `name` | `Name` | Bauherr. |
| `adresse` | `adresse` | |
| `ort` | `Ort` | |
| `gewerk` | via Join | `VectorDB_Konzessionen_Unterkategorie → Oberkategorie` (IT). |

## 3 Sprach-Lücken

Folgende Felder liegen in der DB **nur italienisch** vor — Endpoint sollte entweder DE-Übersetzung mitliefern oder eine Lookup-Tabelle pflegen:

- `VectorDB_Projektierungen.Bezirk`
- `VectorDB_Konzessionen.Bezirke_BezeichnungI`
- `VectorDB_Oberkategorie_Unterkategorie.Oberkat` (28 Werte, z. B. `Opere edili sottosuolo` → `Tiefbau`)
- `VectorDB_Projektierungen.Status`

Temporäre Lösung im Frontend: `src/lib/fixtures/matching.ts` hält jetzt `bezirkItToDe` für Südtiroler Bezirke. Für `Oberkat` wird ebenfalls im Fixture-Generator gemappt (siehe Abschnitt 5).

## 4 Daten-Qualität

- **Dubletten in `VectorDB_Kontakte`**: 23 322 Rows, nur 11 388 distinkte IDs. Duplikate sind zeilenidentisch. → Endpoint muss `GROUP BY id` (oder `DISTINCT`) liefern.
- **Trailing-Whitespace** auf `Kontakt_full_name_D/I`, `BeschlussNr`.
- **Führender Tab** in manchen `EMailAdresse`-Werten.
- **`0000-00-00`-Datumswerte** in `BeschlussDatum`.
- **Sprache-Werte** sind natürliche Sprachnamen (`Deutsch`/`Italiano`/`English`), nicht ISO-Codes.
- **Bezirk-Ausreisser** in `VectorDB_Ausschreibungen.Bezirk`: Neben Südtirol auch `Treviso`, `Belluno`, `Val d'Adige`, `Rotaliana-Königsberg` — reales Einzugsgebiet von Bauservice ist also nicht auf Südtirol beschränkt.

## 5 Was jetzt im Frontend lebt

- `src/lib/fixtures/recipients.ts`: **80 echte anonymisierte Kontakte** (15 Ausschreiber, 18 Kunden, 78 Anbieter; 48 DE / 32 IT; Bezirke Bozen, Überetsch Unterland, Pustertal, Eisacktal, Burggrafenamt). Emails auf `demo-<id>@example.test` umgestellt, damit der Demo-Send-Flow niemanden real erreicht. Namen, Bezirke und Rollen-Flags sind original.
- `src/lib/fixtures/items.ts`: **15 echte Ausschreibungen** mit Gewerk aus Oberkategorie-Join. Bezirk übersetzt (Südtirol) bzw. im Original belassen (Veneto/Trentino). Ergebnisse/Beschlüsse/Konzessionen bleiben **vorerst auf je 4 Fixtures** — der DB-Server (`167.235.240.105`) war beim Pull länger nicht erreichbar. Wenn wieder verfügbar, per gleicher Query-Logik auf 12–15 Stück heben.
- `src/lib/fixtures/matching.ts`: Gewerk-Zuordnung leitet sich aus Keyword-Matching auf Firmenname ab, bis der Endpoint `gewerke[]` pro Kontakt liefert. Bezirk-Matching nutzt IT→DE-Map.

## 6 Offene Fragen an Matthias

1. **Dedup-Strategie** für `VectorDB_Kontakte` — welche Zeile ist die "Wahrheit"? Leichte Tests zeigen zeilenidentische Duplikate, ein `GROUP BY id` wäre unkritisch.
2. **Deutsch-Übersetzung** für `Oberkat`, `Projektierungen.Bezirk`, `Konzessionen.Bezirke_*`, `Status` — Mitliefern oder bleibt das Frontend-Aufgabe?
3. **`Unterkategorie_wird_zusammengeführt`** (Kontakt-Feld): Ist das der gewünschte Proxy für "Gewerke des Anbieters" oder gibt es eine normalisierte Liste (z. B. `VectorDB_Kontakte_Unterkategorie`)?
4. **Aktualisierung**: Sind die `VectorDB_*`-Tabellen batchbefüllte Snapshots oder Views auf die Produktion? Frequenz?
5. **`hatHistorie`**-Definition: Reicht "Teilnehmer bei ≥ 1 Ausschreibung"? Oder soll auch "Gewinner bei ≥ 1" / "als Projektant/Bauleiter/… in Projektierungen geführt" zählen?
6. **Audit-Felder**: Endpoint sollte optional `last_updated`, `source_ts` mitliefern, damit das Frontend im UI klar macht, wie alt ein Datensatz ist.

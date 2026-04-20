import type {
  AusschreibungExample,
  BeschlussExample,
  ErgebnisExample,
  Example,
  KonzessionExample,
  Service,
} from "@/lib/types";

export const ausschreibungenFixture: AusschreibungExample[] = [
  {
    id: 50001,
    service: "ausschreibungen",
    datum: "2026-04-12",
    bezirk: "Eisacktal",
    gewerk: "Tiefbau",
    beschreibungDe:
      "Vergabe der Tiefbauarbeiten zur Verbreiterung der Staatsstraße SS12 zwischen Brixen und Vahrn, einschließlich Straßenentwässerung, Stützmauern und Asphaltierung. Ausführungsfrist 18 Monate.",
    beschreibungIt:
      "Appalto dei lavori di genio civile per l'allargamento della strada statale SS12 tra Bressanone e Varna, inclusi drenaggio stradale, muri di sostegno e asfaltatura. Termine di esecuzione 18 mesi.",
    ausschreiberId: 2001,
    betrag: 850000,
    cig: "CIG-9A8B7C6D5E",
    cup: "CUP-F12E34567890",
    quelle: { table: "VectorDB_Ausschreibungen", pk: "50001" },
  },
  {
    id: 50002,
    service: "ausschreibungen",
    datum: "2026-04-08",
    bezirk: "Burggrafenamt",
    gewerk: "Hochbau",
    beschreibungDe:
      "Gesamtsanierung des Schulgebäudes der Grundschule Meran-West inklusive Fassade, Fenster, Heizungsanlage und Innenausbau. Arbeiten in zwei Bauabschnitten während der Sommerferien 2026 und 2027.",
    beschreibungIt:
      "Risanamento completo dell'edificio scolastico della scuola elementare Merano-Ovest, incluso facciata, serramenti, impianto di riscaldamento e finiture interne. Lavori in due lotti durante le ferie estive 2026 e 2027.",
    ausschreiberId: 2002,
    betrag: 2400000,
    cig: "CIG-1D2E3F4G5H",
    quelle: { table: "VectorDB_Ausschreibungen", pk: "50002" },
  },
  {
    id: 50003,
    service: "ausschreibungen",
    datum: "2026-04-15",
    bezirk: "Pustertal",
    gewerk: "Tiefbau",
    beschreibungDe:
      "Neubau des Abwasserkanals im Gewerbegebiet Bruneck-Süd mit einer Gesamtlänge von 1.850 Metern, inklusive Anschlussschächten und Pumpstation. Koordinierung mit laufendem Straßenbau erforderlich.",
    beschreibungIt:
      "Costruzione del nuovo collettore fognario nella zona artigianale Brunico-Sud per una lunghezza totale di 1.850 metri, inclusi pozzetti di raccordo e stazione di pompaggio. Coordinamento con i lavori stradali in corso richiesto.",
    ausschreiberId: 2001,
    betrag: 1200000,
    cig: "CIG-5A6B7C8D9E",
    quelle: { table: "VectorDB_Ausschreibungen", pk: "50003" },
  },
  {
    id: 50004,
    service: "ausschreibungen",
    datum: "2026-03-28",
    bezirk: "Bozen",
    gewerk: "Hochbau",
    beschreibungDe:
      "Modernisierung des historischen Rathauses Bozen: Elektroinstallation, Brandschutz, energetische Sanierung der Fassade unter Einhaltung der Denkmalschutzauflagen. Fertigstellung bis Ende 2027.",
    beschreibungIt:
      "Ammodernamento dello storico palazzo comunale di Bolzano: impianto elettrico, antincendio, risanamento energetico della facciata nel rispetto dei vincoli di tutela dei beni culturali. Completamento entro fine 2027.",
    ausschreiberId: 2002,
    betrag: 3100000,
    cig: "CIG-ABC123DEF4",
    quelle: { table: "VectorDB_Ausschreibungen", pk: "50004" },
  },
  {
    id: 50005,
    service: "ausschreibungen",
    datum: "2026-04-02",
    bezirk: "Vinschgau",
    gewerk: "Sanitär",
    beschreibungDe:
      "Erneuerung der Wasserversorgungsleitung zwischen Schlanders und Goldrain, Gesamtlänge 3,2 km, DN 250 Gussrohr. Baugrubenherstellung in felsigem Untergrund, Koordinierung mit der Gemeinde erforderlich.",
    beschreibungIt:
      "Rinnovo della condotta idrica tra Silandro e Coldrano, lunghezza totale 3,2 km, tubo in ghisa DN 250. Scavo in terreno roccioso, coordinamento con il comune richiesto.",
    ausschreiberId: 2002,
    betrag: 680000,
    quelle: { table: "VectorDB_Ausschreibungen", pk: "50005" },
  },
  {
    id: 50006,
    service: "ausschreibungen",
    datum: "2026-04-18",
    bezirk: "Eisacktal",
    gewerk: "Hochbau",
    beschreibungDe:
      "Neubau der Umkleide- und Sanitäranlagen beim Sportplatz Sterzing, Holzriegelbau mit extensiver Dachbegrünung. Inklusive Zufahrts- und Außenanlagen.",
    beschreibungIt:
      "Nuova costruzione degli spogliatoi e servizi igienici presso il campo sportivo di Vipiteno, struttura in legno con tetto a verde estensivo. Inclusi accesso e sistemazioni esterne.",
    ausschreiberId: 2001,
    betrag: 450000,
    quelle: { table: "VectorDB_Ausschreibungen", pk: "50006" },
  },
];

export const ergebnisseFixture: ErgebnisExample[] = [
  {
    id: 60001,
    service: "ergebnisse",
    datum: "2026-03-20",
    bezirk: "Eisacktal",
    gewerk: "Tiefbau",
    beschreibungDe:
      "Zuschlag an Gruber Tiefbau KG für den Bau der Ortsumfahrung Vahrn, Gesamtauftragswert 620.000 EUR. Bewertungspunkte 87/100.",
    beschreibungIt:
      "Aggiudicazione a Gruber Genio Civile Sas per la costruzione della circonvallazione di Varna, valore contrattuale totale 620.000 EUR. Punteggio di valutazione 87/100.",
    ausschreibungId: 50003,
    teilnehmerId: 1003,
    teilnehmerNameDe: "Gruber Tiefbau KG",
    teilnehmerNameIt: "Gruber Genio Civile Sas",
    betrag: 620000,
    punkteBewertung: 87,
    prozent: 27.3,
    quelle: { table: "VectorDB_Ausschreibungen_Teilnehmer", pk: "60001" },
  },
  {
    id: 60002,
    service: "ergebnisse",
    datum: "2026-03-05",
    bezirk: "Bozen",
    gewerk: "Hochbau",
    beschreibungDe:
      "Zuschlag an Bianchi Impresa Edile für die Sanierung des Gemeindehauses Leifers. Bewertungspunkte 91/100, Prozentualer Rabatt 24,8%.",
    beschreibungIt:
      "Aggiudicazione a Bianchi Impresa Edile per il risanamento della casa comunale di Laives. Punteggio di valutazione 91/100, ribasso percentuale 24,8%.",
    ausschreibungId: 50004,
    teilnehmerId: 1002,
    teilnehmerNameDe: "Bianchi Impresa Edile",
    teilnehmerNameIt: "Bianchi Impresa Edile",
    betrag: 2330000,
    punkteBewertung: 91,
    prozent: 24.8,
    quelle: { table: "VectorDB_Ausschreibungen_Teilnehmer", pk: "60002" },
  },
  {
    id: 60003,
    service: "ergebnisse",
    datum: "2026-02-28",
    bezirk: "Burggrafenamt",
    gewerk: "Elektro",
    beschreibungDe:
      "Zuschlag an Rossi Elettrica Sud für die Elektroinstallation Altenwohnheim Lana, Punkte 84/100. Ausführungsbeginn Mai 2026.",
    beschreibungIt:
      "Aggiudicazione a Rossi Elettrica Sud per l'impianto elettrico della casa di riposo di Lana, punteggio 84/100. Inizio lavori maggio 2026.",
    ausschreibungId: 50002,
    teilnehmerId: 1004,
    teilnehmerNameDe: "Rossi Elettrica Sud",
    teilnehmerNameIt: "Rossi Elettrica Sud",
    betrag: 410000,
    punkteBewertung: 84,
    prozent: 21.5,
    quelle: { table: "VectorDB_Ausschreibungen_Teilnehmer", pk: "60003" },
  },
  {
    id: 60004,
    service: "ergebnisse",
    datum: "2026-03-12",
    bezirk: "Pustertal",
    gewerk: "Hochbau",
    beschreibungDe:
      "Zuschlag an Lanz Bau GmbH für den Erweiterungsbau der Feuerwehr Innichen. Punkte 89/100, Auftragswert 780.000 EUR.",
    beschreibungIt:
      "Aggiudicazione a Lanz Costruzioni Srl per l'ampliamento dei vigili del fuoco di San Candido. Punteggio 89/100, valore contrattuale 780.000 EUR.",
    ausschreibungId: 50001,
    teilnehmerId: 1008,
    teilnehmerNameDe: "Lanz Bau GmbH",
    teilnehmerNameIt: "Lanz Costruzioni Srl",
    betrag: 780000,
    punkteBewertung: 89,
    prozent: 18.2,
    quelle: { table: "VectorDB_Ausschreibungen_Teilnehmer", pk: "60004" },
  },
];

export const beschluesseFixture: BeschlussExample[] = [
  {
    id: 70001,
    service: "beschluesse",
    datum: "2026-04-10",
    bezirk: "Bozen",
    gewerk: "Tiefbau",
    beschreibungDe:
      "Projekt Ausbau der Straßenbahnlinie Bozen-Oberau: Genehmigung der Vorplanung für Trasse und Haltestellen, Einleitung der UVP-Prüfung. Geschätzter Gesamtbetrag 28 Mio. EUR.",
    beschreibungIt:
      "Progetto ampliamento linea tranviaria Bolzano-Oltrisarco: approvazione del progetto preliminare per tracciato e fermate, avvio della VIA. Importo totale stimato 28 mln EUR.",
    beschlussNr: "B-2026-0419",
    beschlussDatum: "2026-04-10",
    geschaetzterBetrag: 28000000,
    status: "Beschlossen",
    quelle: { table: "VectorDB_Projektierungen", pk: "70001" },
  },
  {
    id: 70002,
    service: "beschluesse",
    datum: "2026-03-22",
    bezirk: "Pustertal",
    gewerk: "Hochbau",
    beschreibungDe:
      "Neubau Schulzentrum Bruneck-Nord mit Grundschule, Mittelschule und Dreifachsporthalle. Planungsphase 2026–2027, Ausschreibung voraussichtlich Q3/2027. Projektvolumen ca. 14 Mio. EUR.",
    beschreibungIt:
      "Nuova costruzione del polo scolastico Brunico-Nord con scuola primaria, secondaria e palestra tripla. Fase di progettazione 2026–2027, gara prevista Q3/2027. Volume progetto circa 14 mln EUR.",
    beschlussNr: "B-2026-0311",
    beschlussDatum: "2026-03-22",
    geschaetzterBetrag: 14000000,
    status: "In Planung",
    quelle: { table: "VectorDB_Projektierungen", pk: "70002" },
  },
  {
    id: 70003,
    service: "beschluesse",
    datum: "2026-02-17",
    bezirk: "Vinschgau",
    gewerk: "Tiefbau",
    beschreibungDe:
      "Hochwasserschutz-Maßnahmen entlang der Etsch im Gemeindegebiet Laas: Uferbefestigung, Retentionsbecken, Hochwasserrückhaltungen. Finanzierung teilweise über EU-Mittel gesichert.",
    beschreibungIt:
      "Interventi di protezione dalle piene lungo l'Adige nel territorio comunale di Lasa: consolidamento sponde, bacini di laminazione, trattenimento piene. Finanziamento in parte tramite fondi UE.",
    beschlussNr: "B-2026-0205",
    beschlussDatum: "2026-02-17",
    geschaetzterBetrag: 4600000,
    status: "Beschlossen",
    quelle: { table: "VectorDB_Projektierungen", pk: "70003" },
  },
  {
    id: 70004,
    service: "beschluesse",
    datum: "2026-03-30",
    bezirk: "Vinschgau",
    gewerk: "Hochbau",
    beschreibungDe:
      "Umbau und Erweiterung des Gemeindehauses Laas zur barrierefreien Erschließung sämtlicher Verwaltungsbereiche. Aufzugseinbau, energetische Sanierung, Anbau Bürgerservice.",
    beschreibungIt:
      "Ristrutturazione e ampliamento della casa comunale di Lasa per l'accesso senza barriere a tutti i settori amministrativi. Installazione ascensore, risanamento energetico, ampliamento servizi al cittadino.",
    beschlussNr: "B-2026-0341",
    beschlussDatum: "2026-03-30",
    geschaetzterBetrag: 1850000,
    status: "In Planung",
    quelle: { table: "VectorDB_Projektierungen", pk: "70004" },
  },
];

export const konzessionenFixture: KonzessionExample[] = [
  {
    id: 80001,
    service: "baukonzessionen",
    datum: "2026-04-16",
    bezirk: "Eisacktal",
    beschreibungDe:
      "Baukonzession für Wohnbauprojekt Brixen-Süd: 18 Wohneinheiten auf drei Geschossen mit Tiefgarage. Baubeginn voraussichtlich Herbst 2026, Bauzeit 24 Monate.",
    beschreibungIt:
      "Concessione edilizia per progetto residenziale Bressanone-Sud: 18 unità abitative su tre piani con garage interrato. Inizio lavori previsto autunno 2026, durata 24 mesi.",
    gemeinde: "Brixen",
    konzessionenTyp: "Wohnbau",
    name: "Wohnanlage Bahnhof-Süd",
    adresse: "Bahnhofstraße 45",
    ort: "Brixen",
    quelle: { table: "VectorDB_Konzessionen", pk: "80001" },
  },
  {
    id: 80002,
    service: "baukonzessionen",
    datum: "2026-04-05",
    bezirk: "Burggrafenamt",
    beschreibungDe:
      "Baukonzession Gewerbezone Meran-Nord für zwei Hallen für Lagerung und leichte Produktion. Gesamtnutzfläche 3.400 m². Bauherr: Konsortium Meraner Unternehmer.",
    beschreibungIt:
      "Concessione edilizia zona artigianale Merano-Nord per due capannoni destinati a magazzino e produzione leggera. Superficie utile totale 3.400 m². Committente: consorzio imprenditori di Merano.",
    gemeinde: "Meran",
    konzessionenTyp: "Gewerbebau",
    name: "Gewerbezone Ost",
    adresse: "Industriestraße 12",
    ort: "Meran",
    quelle: { table: "VectorDB_Konzessionen", pk: "80002" },
  },
  {
    id: 80003,
    service: "baukonzessionen",
    datum: "2026-03-25",
    bezirk: "Eisacktal",
    beschreibungDe:
      "Hotelerweiterung Seiser Alm: Anbau Wellness-Bereich 850 m², Erweiterung Restaurant, zusätzliche 12 Zimmer. Bauzeit während der Zwischensaison 2026/2027.",
    beschreibungIt:
      "Ampliamento hotel Alpe di Siusi: aggiunta area wellness 850 m², ampliamento ristorante, 12 camere aggiuntive. Durata lavori nei periodi di bassa stagione 2026/2027.",
    gemeinde: "Kastelruth",
    konzessionenTyp: "Tourismus",
    name: "Hotel Sonnenberg",
    adresse: "Dorfzentrum 8",
    ort: "Seiser Alm",
    quelle: { table: "VectorDB_Konzessionen", pk: "80003" },
  },
  {
    id: 80004,
    service: "baukonzessionen",
    datum: "2026-04-01",
    bezirk: "Eisacktal",
    beschreibungDe:
      "Baukonzession für Wohnprojekt Sterzing-West mit sechs Reihenhäusern und gemeinschaftlicher Tiefgarage. Nachhaltige Bauweise, KlimaHaus-A-Standard angestrebt.",
    beschreibungIt:
      "Concessione edilizia per progetto residenziale Vipiteno-Ovest con sei case a schiera e autorimessa interrata comune. Costruzione sostenibile, standard CasaClima-A.",
    gemeinde: "Sterzing",
    konzessionenTyp: "Wohnbau",
    name: "Siedlung Sonnhang",
    adresse: "Sonnenstraße 22",
    ort: "Sterzing",
    quelle: { table: "VectorDB_Konzessionen", pk: "80004" },
  },
];

export function itemsForService(service: Service): Example[] {
  switch (service) {
    case "ausschreibungen":
      return ausschreibungenFixture;
    case "ergebnisse":
      return ergebnisseFixture;
    case "beschluesse":
      return beschluesseFixture;
    case "baukonzessionen":
      return konzessionenFixture;
  }
}

export function findItem(service: Service, id: number): Example | undefined {
  return itemsForService(service).find((it) => it.id === id);
}

import type { ContentPack } from "./types";

const valueProps = [
  "Überwachung relevanter Ausschreibungen für Ihre Branche.",
  "Priorisierter Zugang zu entscheidenden Informationen für eine frühzeitige Vorbereitung.",
  "Individuelle Beratung, um Ihre Erfolgsquote bei Bewerbungen zu steigern.",
  "Analyse vergangener Ausschreibungen, um Trends zu erkennen und Strategien zu optimieren.",
  "Unterstützung bei der Erstellung der Unterlagen, um Konformität und Wettbewerbsfähigkeit sicherzustellen.",
  "Personalisierter Benachrichtigungsdienst, damit Sie keine Gelegenheit verpassen.",
];

const urgency =
  "Die sogenannten Verhandlungsverfahren auf Einladung sehen eine durchschnittliche Wartezeit von 1-3 Monaten vor der endgültigen Vergabe vor. Daher ist es wichtig, sich rechtzeitig zu bewerben.";

const optOutDisclaimer =
  "Wir informieren Sie, dass Ihre Emailadresse aus öffentlich zugänglichen Archiven stammt. Sie können die vom Datenschutzgesetz L.D. Nr. 196/2003 vorgesehenen Rechte ausüben und sich von unseren Archiven streichen lassen, indem Sie eine Email an info@bauservice.it mit dem Betreff REMOVE schicken.";

const ctaOpeningWithPhone =
  "Wenn Sie Interesse haben, antworten Sie kurz auf diese E-Mail oder rufen Sie uns unter 0472 208308 an.";

export const deContent: ContentPack = {
  sprache: "de",
  locale: "de-DE",
  valueProps,
  urgency,
  optOutDisclaimer,
  signature: {
    senderName: "Meinrad Kerschbaumer",
    companyLine: "Bauservice KG",
    streetLine: "Julius-Durst-Str. 70 – HOUSE70",
    cityLine: "39042 Brixen",
    tel: "0472 208308",
    fax: "0472 835051",
    email: "info@bauservice.it",
    website: "www.bauservice.it",
  },
  serviceLabels: {
    ausschreibungen: "Aktuelle Ausschreibungen",
    ergebnisse: "Ergebnisse & Zuschläge",
    beschluesse: "Beschlüsse & Projekte",
    baukonzessionen: "Baukonzessionen",
  },
  personSalutation: {
    herr: "Sehr geehrter Herr",
    frau: "Sehr geehrte Frau",
  },
  metaLabels: {
    datum: "Datum",
    bezirk: "Bezirk",
    betrag: "Betrag",
    gewerk: "Gewerk",
    ausschreiber: "Ausschreiber",
    vergabeBetrag: "Vergabe-Betrag",
    zuschlagAn: "Zuschlag an",
    nachlass: "Nachlass",
    bekanntmachung: "Bekanntmachung",
    beschlussNr: "Beschluss-Nr.",
    beschlussDatum: "Beschluss-Datum",
    geschaetzterBetrag: "Geschätzter Betrag",
    status: "Status",
    projekttyp: "Projekt-Typ",
    gemeinde: "Gemeinde",
    konzessionsTyp: "Konzessions-Typ",
    bauherr: "Bauherr",
  },
  scenarios: {
    A: {
      preview: "Neue Chancen aus Ihrem Informationsdienst",
      subject: "Aktuelle Gelegenheiten aus Ihrem Gewerk",
      salutationPrefix: "Sehr geehrter Ansprechpartner bei",
      salutationFallback: "Sehr geehrte Damen und Herren,",
      hook:
        "als langjähriger Kunde kennen Sie unseren Informationsdienst bereits. Hier kommt Ihr persönlicher Auszug relevanter Neuigkeiten der letzten Tage.",
      bridge:
        "Wir haben für Sie aus Ausschreibungen, Ergebnissen und Projektierungen die passendsten Einträge zusammengestellt:",
      examplesHeading: "Aktuell für Sie relevant",
      ctaOpening:
        "Bei Fragen oder Wunsch nach vertiefter Analyse melden Sie sich gerne direkt — wir kennen Ihr Profil und erreichen Sie jederzeit unter 0472 208308.",
      ctaClosing: "Kontaktieren Sie uns noch heute!",
    },
    B: {
      preview: "Herzlichen Glückwunsch zum Zuschlag",
      subject: "Vergabe: {itemTitle}",
      salutationPrefix: "Sehr geehrte Damen und Herren bei",
      salutationFallback: "Sehr geehrte Damen und Herren,",
      hook:
        "Herzlichen Glückwunsch zum Zuschlag. Der nächste Auftrag kommt oft nicht zufällig, sondern durch frühe Information und konsequente Auswahl der richtigen Verfahren.",
      bridge:
        "Bauservice informiert Sie laufend über Ausschreibungen, die zu Ihrem Gewerk und Ihrem Einsatzgebiet passen, damit Sie Ihre Erfolgsquote weiter steigern. Hier ein paar Beispiele:",
      examplesHeading: "Aktuelle Gelegenheiten",
      ctaOpening: ctaOpeningWithPhone,
      ctaClosing:
        "Nutzen Sie diesen Vorteil und werden Sie unser Kunde — kontaktieren Sie uns noch heute!",
    },
    C: {
      preview: "Ähnliche Ausschreibungen für Ihr Gewerk",
      subject: "Vergabe: {itemTitle}",
      salutationPrefix: "Sehr geehrte Damen und Herren bei",
      salutationFallback: "Sehr geehrte Damen und Herren,",
      hook:
        "die oben genannte Vergabe ist genau die Art Verfahren, an der teilzunehmen sich oft lohnt. Der Zuschlag ging diesmal an einen Mitbewerber.",
      bridge:
        "Damit Sie rechtzeitig ähnliche Ausschreibungen erhalten, haben wir hier einige aktuelle Beispiele aus Ihrem Gewerk:",
      examplesHeading: "Ähnliche Gelegenheiten",
      ctaOpening: ctaOpeningWithPhone,
      ctaClosing:
        "Werden Sie unser Kunde und sichern Sie sich einen Wissensvorsprung — kontaktieren Sie uns noch heute!",
    },
    D: {
      preview: "Neue Ausschreibungen in Ihrer Region",
      subject: "Ihr Informationsvorsprung bei Ausschreibungen",
      salutationPrefix: "Sehr geehrte Damen und Herren bei",
      salutationFallback: "Sehr geehrte Damen und Herren,",
      hook:
        "wir informieren Handwerks- und Bauunternehmen laufend über neue öffentliche Ausschreibungen, die zu ihrem Gewerk und Einsatzgebiet passen — damit Sie Ihre Erfolgsquote steigern.",
      bridge: "Hier ein paar aktuelle Beispiele aus unserem Netzwerk:",
      examplesHeading: "Beispiele",
      ctaOpening: ctaOpeningWithPhone,
      ctaClosing:
        "Bauservice verfügt über die notwendigen Informationen, um Ihnen einen entscheidenden Wissensvorsprung zu verschaffen — kontaktieren Sie uns noch heute!",
    },
  },
};

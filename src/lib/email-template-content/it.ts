import type { ContentPack } from "./types";

// IT-Wortlaut ist Ausgangsbasis für Abnahme durch IT-Muttersprachler (Meinrad / Bauservice).
// Quelle: alpino-kb/sources/clients/bauservice/werbemail-beispiel-it-2026-02-02.md — wörtlich
// übernommen wo möglich, idiomatisch angepasst wo die DE-Version nur übersetzt war.
const valueProps = [
  "Servizio di alert personalizzato per non perdere nessuna opportunità.",
  "Monitoraggio avanzato delle gare d'appalto più adatte al Vostro settore.",
  "Accesso prioritario alle informazioni chiave per prepararVi in tempo.",
  "Consulenza personalizzata per aumentare il tasso di successo nelle candidature.",
  "Analisi delle gare passate per individuare trend e migliorare le strategie future.",
  "Supporto nella preparazione della documentazione per garantire conformità e competitività.",
];

const urgency =
  "Le procedure degli appalti pubblici prevedono un tempo di attesa media di 4-6 mesi prima dell'assegnazione del contratto. È fondamentale candidarsi tempestivamente.";

const optOutDisclaimer =
  "La informiamo che la sua e-mail è stata trovata su internet che è un ambito pubblico. È Sua facoltà esercitare i diritti della legge sulla tutela dei dati personali D.L. N° 196/2003. Se non desidera ricevere ulteriori comunicazioni ci invii una e-mail a info@bauservice.it con la parola REMOVE nell'oggetto.";

const ctaOpeningWithPhone =
  "Se siete interessati, rispondete brevemente a questa e-mail o chiamateci allo 0472 208308.";

export const itContent: ContentPack = {
  sprache: "it",
  locale: "it-IT",
  valueProps,
  urgency,
  optOutDisclaimer,
  signature: {
    senderName: "Meinrad Kerschbaumer",
    companyLine: "Bauservice SAS",
    streetLine: "Via Julius Durst 70 – HOUSE70",
    cityLine: "39042 Bressanone",
    tel: "0472 208308",
    fax: "0472 835051",
    email: "info@bauservice.it",
    website: "www.bauservice.it",
  },
  serviceLabels: {
    ausschreibungen: "Gare in corso",
    ergebnisse: "Esiti e aggiudicazioni",
    beschluesse: "Delibere e progetti",
    baukonzessionen: "Concessioni edilizie",
  },
  personSalutation: {
    herr: "Egregio Sig.",
    frau: "Gentile Sig.ra",
  },
  metaLabels: {
    datum: "Data",
    bezirk: "Zona",
    betrag: "Importo",
    gewerk: "Categoria",
    ausschreiber: "Stazione appaltante",
    vergabeBetrag: "Importo a base di gara",
    zuschlagAn: "Aggiudicato a",
    nachlass: "Ribasso",
    bekanntmachung: "Pubblicazione",
    beschlussNr: "Nr. delibera",
    beschlussDatum: "Data delibera",
    geschaetzterBetrag: "Importo stimato",
    status: "Stato",
    projekttyp: "Tipo progetto",
    gemeinde: "Comune",
    konzessionsTyp: "Tipo concessione",
    bauherr: "Committente",
  },
  scenarios: {
    A: {
      preview: "Nuove opportunità dal Vostro servizio informazioni",
      subject: "Opportunità attuali dal Vostro settore",
      salutationPrefix: "Egregio referente presso",
      salutationFallback: "Gentili signori,",
      hook:
        "in qualità di cliente di lunga data, conoscete già il nostro servizio. Ecco il Vostro estratto personalizzato delle novità degli ultimi giorni.",
      bridge:
        "Abbiamo selezionato per Voi gare, esiti e progetti più rilevanti:",
      examplesHeading: "Rilevanti per Voi",
      ctaOpening:
        "Per domande o analisi più approfondite contattateci direttamente allo 0472 208308 — conosciamo il Vostro profilo.",
      ctaClosing: "Contattateci oggi stesso!",
    },
    B: {
      preview: "Congratulazioni per l'aggiudicazione",
      subject: "Aggiudicazione: {itemTitle}",
      salutationPrefix: "Spett.le",
      salutationFallback: "Gentili signori,",
      hook:
        "Congratulazioni per l'aggiudicazione. Il prossimo contratto non arriva per caso, ma grazie a informazioni tempestive e alla scelta coerente delle procedure giuste.",
      bridge:
        "Bauservice Vi segnala costantemente le gare più adatte al Vostro settore e alla Vostra zona, per aumentare il tasso di successo. Ecco alcuni esempi:",
      examplesHeading: "Opportunità attuali",
      ctaOpening: ctaOpeningWithPhone,
      ctaClosing:
        "Approfittate di questo vantaggio e diventate nostri clienti — contattateci oggi stesso!",
    },
    C: {
      preview: "Gare simili per la Vostra categoria",
      subject: "Aggiudicazione: {itemTitle}",
      salutationPrefix: "Spett.le",
      salutationFallback: "Gentili signori,",
      hook:
        "la procedura indicata in oggetto è esattamente il tipo di gara a cui, per molte imprese, vale la pena partecipare. L'aggiudicazione è andata a un concorrente.",
      bridge:
        "Per ricevere in tempo utile gare simili e adatte alla Vostra impresa, ecco alcuni esempi attuali del Vostro settore:",
      examplesHeading: "Opportunità simili",
      ctaOpening: ctaOpeningWithPhone,
      ctaClosing:
        "Diventate nostri clienti e assicuratevi un vantaggio informativo — contattateci oggi stesso!",
    },
    D: {
      preview: "Nuove gare nella Vostra zona",
      subject: "Il Vostro vantaggio informativo sulle gare",
      salutationPrefix: "Spett.le",
      salutationFallback: "Gentili signori,",
      hook:
        "informiamo imprese artigiane ed edili su nuove gare pubbliche adatte al loro settore e zona — per aumentare il tasso di successo.",
      bridge: "Ecco alcuni esempi attuali dalla nostra rete:",
      examplesHeading: "Esempi",
      ctaOpening: ctaOpeningWithPhone,
      ctaClosing:
        "Bauservice dispone delle informazioni necessarie per farVi ottenere un vantaggio competitivo — contattateci oggi stesso!",
    },
  },
};

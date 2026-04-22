import type { ScenarioId, Service, Sprache } from "@/lib/types";

export type ScenarioMeta = {
  id: ScenarioId;
  labelDe: string;
  labelIt: string;
  descriptionDe: string;
  descriptionIt: string;
};

export const scenariosOrder: ScenarioId[] = ["A", "B", "C", "D"];

export const scenarios: Record<ScenarioId, ScenarioMeta> = {
  A: {
    id: "A",
    labelDe: "Bestandskunde",
    labelIt: "Cliente esistente",
    descriptionDe: "Empfänger ist bereits Bauservice-Kunde. Follow-up-Ton, keine Cold-Intro.",
    descriptionIt: "Il destinatario è già cliente Bauservice. Tono follow-up, niente cold intro.",
  },
  B: {
    id: "B",
    labelDe: "Neukunde · Zuschlag-Gewinner",
    labelIt: "Nuovo cliente · Aggiudicatario",
    descriptionDe:
      "Neukunde hat soeben eine Ausschreibung gewonnen. Trigger wie Goldstandard DE: Glückwunsch zum Zuschlag.",
    descriptionIt:
      "Nuovo cliente aggiudicatario di una gara. Trigger come goldstandard DE: Congratulazioni per l aggiudicazione.",
  },
  C: {
    id: "C",
    labelDe: "Neukunde · Ausschreibungs-Teilnehmer",
    labelIt: "Nuovo cliente · Partecipante",
    descriptionDe:
      "Neukunde hat teilgenommen, aber nicht gewonnen. Trigger wie Goldstandard IT: Der Zuschlag ging an X, hier kommen ähnliche Gelegenheiten.",
    descriptionIt:
      "Nuovo cliente partecipante ma non aggiudicatario. Trigger come goldstandard IT: aggiudicazione andata a X, ecco opportunità simili.",
  },
  D: {
    id: "D",
    labelDe: "Neukunde · Kaltakquise",
    labelIt: "Nuovo cliente · Contatto freddo",
    descriptionDe:
      "Kein spezifischer Trigger. Generische Werbemail mit Beispiel-Ausschreibungen und Value-Proposition.",
    descriptionIt:
      "Nessun trigger specifico. Email generica con esempi di gare e value proposition.",
  },
};

export type ScenarioCopy = {
  preview: string;
  subject: string;
  salutationPrefix: string;
  salutationFallback: string;
  /** Opener-Absatz direkt unter der Anrede — der kampagnenspezifische Aufhänger. */
  hook: string;
  /** Bridge-Absatz nach Hook — leitet zur Beispielliste über. */
  bridge: string;
  /** Heading der Beispielliste. */
  examplesHeading: string;
  /** Value-Proposition als Liste (6 Punkte laut Goldstandard). */
  valueProps: string[];
  /** Urgency-Absatz. */
  urgency: string;
  /** Abschluss-CTA. */
  cta: string;
  /** Footer-Absenderinfo. */
  footer: string;
};

type ScenarioCopyByLang = Record<Sprache, ScenarioCopy>;

const valuePropsDe = [
  "Überwachung relevanter Ausschreibungen für Ihre Branche.",
  "Priorisierter Zugang zu entscheidenden Informationen für eine frühzeitige Vorbereitung.",
  "Individuelle Beratung, um Ihre Erfolgsquote bei Bewerbungen zu steigern.",
  "Analyse vergangener Ausschreibungen, um Trends zu erkennen und Strategien zu optimieren.",
  "Unterstützung bei der Erstellung der Unterlagen, um Konformität und Wettbewerbsfähigkeit sicherzustellen.",
  "Personalisierter Benachrichtigungsdienst, damit Sie keine Gelegenheit verpassen.",
];

const valuePropsIt = [
  "Servizio di alert personalizzato per non perdere nessuna opportunità.",
  "Monitoraggio avanzato delle gare d'appalto più adatte al Vostro settore.",
  "Accesso prioritario alle informazioni chiave per prepararVi in tempo.",
  "Consulenza personalizzata per aumentare il tasso di successo nelle candidature.",
  "Analisi delle gare passate per individuare trend e migliorare le strategie future.",
  "Supporto nella preparazione della documentazione per garantire conformità e competitività.",
];

const urgencyDe =
  "Die sogenannten Verhandlungsverfahren auf Einladung sehen eine durchschnittliche Wartezeit von 1-3 Monaten vor der endgültigen Vergabe vor. Daher ist es wichtig, sich rechtzeitig zu bewerben.";

const urgencyIt =
  "Le procedure degli appalti pubblici prevedono un tempo di attesa media di 4-6 mesi prima dell'assegnazione del contratto. È fondamentale candidarsi tempestivamente.";

const ctaDe =
  "Gerne stellen wir Ihnen weitere Details vor, wie wir Sie unterstützen können. Kontaktieren Sie uns noch heute!";
const ctaIt =
  "Saremo lieti di fornirVi maggiori dettagli. Contattateci oggi stesso!";

const footerDe = "Bauservice KG · Am Thalhofer Graben 2 · I-39042 Brixen · 0472 208308 · info@bauservice.it";
const footerIt = "Bauservice SAS · Via Lungo Thalhofer 2 · I-39042 Bressanone · 0472 208308 · info@bauservice.it";

export const scenarioCopy: Record<ScenarioId, ScenarioCopyByLang> = {
  A: {
    de: {
      preview: "Neue Chancen aus Ihrem Informationsdienst",
      subject: "Aktuelle Gelegenheiten aus Ihrem Gewerk",
      salutationPrefix: "Sehr geehrter Ansprechpartner bei",
      salutationFallback: "Sehr geehrte Damen und Herren,",
      hook:
        "als langjähriger Kunde kennen Sie unseren Informationsdienst bereits. Hier kommt Ihr persönlicher Auszug relevanter Neuigkeiten der letzten Tage.",
      bridge:
        "Wir haben für Sie aus Ausschreibungen, Ergebnissen und Projektierungen die passendsten Einträge zusammengestellt:",
      examplesHeading: "Aktuell für Sie relevant",
      valueProps: valuePropsDe,
      urgency: urgencyDe,
      cta: "Bei Fragen oder Wunsch nach vertiefter Analyse melden Sie sich gerne direkt — wir kennen Ihr Profil.",
      footer: footerDe,
    },
    it: {
      preview: "Nuove opportunità dal Vostro servizio informazioni",
      subject: "Opportunità attuali dal Vostro settore",
      salutationPrefix: "Egregio referente presso",
      salutationFallback: "Gentili signori,",
      hook:
        "in qualità di cliente di lunga data, conoscete già il nostro servizio. Ecco il Vostro estratto personalizzato delle novità degli ultimi giorni.",
      bridge:
        "Abbiamo selezionato per Voi gare, esiti e progetti più rilevanti:",
      examplesHeading: "Rilevanti per Voi",
      valueProps: valuePropsIt,
      urgency: urgencyIt,
      cta: "Per domande o analisi più approfondite, contattateci direttamente — conosciamo il Vostro profilo.",
      footer: footerIt,
    },
  },
  B: {
    de: {
      preview: "Herzlichen Glückwunsch zum Zuschlag",
      subject: "Vergabe: {itemTitle}",
      salutationPrefix: "Sehr geehrte Damen und Herren bei",
      salutationFallback: "Sehr geehrte Damen und Herren,",
      hook:
        "Herzlichen Glückwunsch zum Zuschlag. Der nächste Auftrag kommt oft nicht zufällig, sondern durch frühe Information und konsequente Auswahl der richtigen Verfahren.",
      bridge:
        "Bauservice informiert Sie laufend über Ausschreibungen, die zu Ihrem Gewerk und Ihrem Einsatzgebiet passen, damit Sie Ihre Erfolgsquote weiter steigern. Hier ein paar Beispiele:",
      examplesHeading: "Aktuelle Gelegenheiten",
      valueProps: valuePropsDe,
      urgency: urgencyDe,
      cta:
        "Wenn Sie Interesse haben, antworten Sie kurz auf diese E-Mail oder rufen Sie uns unter 0472 208308 an. Nutzen Sie diesen Vorteil und werden Sie unser Kunde!",
      footer: footerDe,
    },
    it: {
      preview: "Congratulazioni per l'aggiudicazione",
      subject: "Aggiudicazione: {itemTitle}",
      salutationPrefix: "Egregio Signor",
      salutationFallback: "Egregi signori,",
      hook:
        "Congratulazioni per l'aggiudicazione. Il prossimo contratto non arriva per caso, ma grazie a informazioni tempestive e alla scelta coerente delle procedure giuste.",
      bridge:
        "Bauservice Vi segnala costantemente le gare più adatte al Vostro settore e alla Vostra zona, per aumentare il tasso di successo. Ecco alcuni esempi:",
      examplesHeading: "Opportunità attuali",
      valueProps: valuePropsIt,
      urgency: urgencyIt,
      cta:
        "Se siete interessati, rispondete brevemente a questa e-mail o chiamateci allo 0472 208308. Approfittate e diventate nostri clienti!",
      footer: footerIt,
    },
  },
  C: {
    de: {
      preview: "Ähnliche Ausschreibungen für Ihr Gewerk",
      subject: "Vergabe: {itemTitle}",
      salutationPrefix: "Sehr geehrte Damen und Herren bei",
      salutationFallback: "Sehr geehrte Damen und Herren,",
      hook:
        "die oben genannte Vergabe ist genau die Art Verfahren, an der teilzunehmen sich oft lohnt. Der Zuschlag ging diesmal an einen Mitbewerber.",
      bridge:
        "Damit Sie rechtzeitig ähnliche Ausschreibungen erhalten, haben wir hier einige aktuelle Beispiele aus Ihrem Gewerk:",
      examplesHeading: "Ähnliche Gelegenheiten",
      valueProps: valuePropsDe,
      urgency: urgencyDe,
      cta:
        "Antworten Sie kurz auf diese E-Mail oder rufen Sie uns unter 0472 208308 an, wenn Sie laufend über passende Gelegenheiten informiert werden wollen.",
      footer: footerDe,
    },
    it: {
      preview: "Gare simili per la Vostra categoria",
      subject: "Aggiudicazione: {itemTitle}",
      salutationPrefix: "Egregio Signor",
      salutationFallback: "Egregi signori,",
      hook:
        "la procedura indicata in oggetto è esattamente il tipo di gara a cui, per molte imprese, vale la pena partecipare. L'aggiudicazione è andata a un concorrente.",
      bridge:
        "Per ricevere in tempo utile gare simili e adatte alla Vostra impresa, ecco alcuni esempi attuali del Vostro settore:",
      examplesHeading: "Opportunità simili",
      valueProps: valuePropsIt,
      urgency: urgencyIt,
      cta:
        "Rispondete brevemente a questa e-mail o contattateci allo 0472 208308 per ricevere regolarmente le opportunità più adatte.",
      footer: footerIt,
    },
  },
  D: {
    de: {
      preview: "Neue Ausschreibungen in Ihrer Region",
      subject: "Ihr Informationsvorsprung bei Ausschreibungen",
      salutationPrefix: "Sehr geehrte Damen und Herren bei",
      salutationFallback: "Sehr geehrte Damen und Herren,",
      hook:
        "wir informieren Handwerks- und Bauunternehmen laufend über neue öffentliche Ausschreibungen, die zu ihrem Gewerk und Einsatzgebiet passen — damit Sie Ihre Erfolgsquote steigern.",
      bridge: "Hier ein paar aktuelle Beispiele aus unserem Netzwerk:",
      examplesHeading: "Beispiele",
      valueProps: valuePropsDe,
      urgency: urgencyDe,
      cta:
        "Bauservice verfügt über die notwendigen Informationen, um Ihnen einen entscheidenden Wissensvorsprung zu verschaffen. Kontaktieren Sie uns noch heute!",
      footer: footerDe,
    },
    it: {
      preview: "Nuove gare nella Vostra zona",
      subject: "Il Vostro vantaggio informativo sulle gare",
      salutationPrefix: "Egregi signori di",
      salutationFallback: "Egregi signori,",
      hook:
        "informiamo imprese artigiane ed edili su nuove gare pubbliche adatte al loro settore e zona — per aumentare il tasso di successo.",
      bridge: "Ecco alcuni esempi attuali dalla nostra rete:",
      examplesHeading: "Esempi",
      valueProps: valuePropsIt,
      urgency: urgencyIt,
      cta:
        "Bauservice dispone delle informazioni necessarie per farVi ottenere un vantaggio competitivo. Contattateci oggi stesso!",
      footer: footerIt,
    },
  },
};

/**
 * Klassifiziert einen Kontakt in ein Kunden-Typ-Szenario.
 * Priorität (nach User-Feedback 2026-04-22): Gewinner/Teilnehmer schlägt Bestand,
 * damit der Item-Trigger auch bei Bestandskunden im Mittelpunkt steht.
 */
export function classifyRecipient(params: {
  isGewinner: boolean;
  isTeilnehmer: boolean;
  isKunde: boolean;
}): ScenarioId {
  if (params.isGewinner) return "B";
  if (params.isTeilnehmer) return "C";
  if (params.isKunde) return "A";
  return "D";
}

import type { ScenarioId, Service, Sprache } from "@/lib/types";

export type ScenarioMeta = {
  id: ScenarioId;
  service: Service;
  labelDe: string;
  labelIt: string;
  descriptionDe: string;
  descriptionIt: string;
};

export const scenariosOrder: ScenarioId[] = ["A", "B", "C", "D"];

export const scenarios: Record<ScenarioId, ScenarioMeta> = {
  A: {
    id: "A",
    service: "ausschreibungen",
    labelDe: "Szenario A · Ausschreibungen",
    labelIt: "Scenario A · Gare",
    descriptionDe:
      "Fokus auf neu veröffentlichte öffentliche Ausschreibungen im Netzwerk.",
    descriptionIt:
      "Focalizzato sulle nuove gare pubblicate nella rete.",
  },
  B: {
    id: "B",
    service: "ergebnisse",
    labelDe: "Szenario B · Ergebnisse & Zuschläge",
    labelIt: "Scenario B · Esiti e aggiudicazioni",
    descriptionDe:
      "Erfolge der Mitbewerber, frisch vergebene Aufträge, Preisniveaus.",
    descriptionIt:
      "Successi della concorrenza, contratti aggiudicati, livelli di prezzo.",
  },
  C: {
    id: "C",
    service: "beschluesse",
    labelDe: "Szenario C · Beschlüsse & Projekte",
    labelIt: "Scenario C · Delibere e progetti",
    descriptionDe:
      "Kommende Projekte in der Vorplanungsphase, Signale für zukünftige Ausschreibungen.",
    descriptionIt:
      "Progetti in fase preliminare, segnali per gare future.",
  },
  D: {
    id: "D",
    service: "baukonzessionen",
    labelDe: "Szenario D · Baukonzessionen",
    labelIt: "Scenario D · Concessioni edilizie",
    descriptionDe:
      "Genehmigte Bauvorhaben in der Region, private und gewerbliche Projekte.",
    descriptionIt:
      "Interventi edilizi autorizzati, progetti privati e commerciali.",
  },
};

export type ScenarioCopy = {
  preview: string;
  subject: string;
  salutationPrefix: string;
  salutationFallback: string;
  intro: string;
  cta: string;
  footer: string;
  focusHeading: string;
};

type ScenarioCopyByLang = Record<Sprache, ScenarioCopy>;

export const scenarioCopy: Record<ScenarioId, ScenarioCopyByLang> = {
  A: {
    de: {
      preview: "Neue öffentliche Ausschreibungen in Ihrer Region",
      subject: "Aktuelle Ausschreibungen — frische Möglichkeiten für Ihr Gewerk",
      salutationPrefix: "Sehr geehrte Damen und Herren bei",
      salutationFallback: "Sehr geehrte Damen und Herren,",
      intro:
        "neue Ausschreibungen wurden in Ihrem Gewerk und Ihrer Region veröffentlicht — wir haben die relevantesten für Sie zusammengestellt.",
      cta: "Benötigen Sie Unterstützung bei Kalkulation oder Teilnahme? Melden Sie sich gerne direkt bei uns.",
      footer: "Bauservice KG · Brixen · Ausschreibungsservice",
      focusHeading: "Neue Ausschreibungen",
    },
    it: {
      preview: "Nuove gare pubbliche nella vostra zona",
      subject: "Gare attuali — nuove opportunità per la vostra categoria",
      salutationPrefix: "Gentili signori di",
      salutationFallback: "Gentili signori,",
      intro:
        "sono state pubblicate nuove gare nella vostra categoria e zona — abbiamo selezionato quelle più rilevanti per voi.",
      cta: "Avete bisogno di supporto nel calcolo o nella partecipazione? Contattateci pure direttamente.",
      footer: "Bauservice KG · Bressanone · Servizio Gare",
      focusHeading: "Nuove gare",
    },
  },
  B: {
    de: {
      preview: "Frische Zuschlags-Ergebnisse aus Ihrem Netzwerk",
      subject: "Ergebnisse & Zuschläge — das Preisniveau der letzten Wochen",
      salutationPrefix: "Sehr geehrte Damen und Herren bei",
      salutationFallback: "Sehr geehrte Damen und Herren,",
      intro:
        "anbei ein Überblick über die aktuellsten Zuschläge aus Ihrem Tätigkeitsfeld — inklusive Preisniveau und Wettbewerbssituation.",
      cta: "Möchten Sie tiefere Ergebnis-Auswertungen? Wir erstellen gerne individuelle Analysen für Sie.",
      footer: "Bauservice KG · Brixen · Marktmonitoring",
      focusHeading: "Aktuelle Zuschläge",
    },
    it: {
      preview: "Nuovi esiti di gara dalla vostra rete",
      subject: "Esiti e aggiudicazioni — i livelli di prezzo recenti",
      salutationPrefix: "Gentili signori di",
      salutationFallback: "Gentili signori,",
      intro:
        "di seguito una panoramica delle aggiudicazioni più recenti nel vostro settore — inclusi livelli di prezzo e concorrenza.",
      cta: "Desiderate analisi più approfondite? Prepariamo volentieri valutazioni personalizzate per voi.",
      footer: "Bauservice KG · Bressanone · Monitoraggio Mercato",
      focusHeading: "Aggiudicazioni recenti",
    },
  },
  C: {
    de: {
      preview: "Kommende Beschlüsse & Projekte in Südtirol",
      subject: "Beschlüsse & Projekte — Signale für zukünftige Ausschreibungen",
      salutationPrefix: "Sehr geehrte Damen und Herren bei",
      salutationFallback: "Sehr geehrte Damen und Herren,",
      intro:
        "kommende Projekte werfen ihre Schatten voraus — hier eine Auswahl aktuell beschlossener Vorhaben, die bald in die Ausschreibungsphase gehen dürften.",
      cta: "Interessiert an einer frühen Positionierung? Wir erklären gerne, wie unser Frühwarn-Service funktioniert.",
      footer: "Bauservice KG · Brixen · Projektradar",
      focusHeading: "Beschlüsse & kommende Projekte",
    },
    it: {
      preview: "Delibere e progetti in arrivo in Alto Adige",
      subject: "Delibere e progetti — segnali per gare future",
      salutationPrefix: "Gentili signori di",
      salutationFallback: "Gentili signori,",
      intro:
        "progetti in arrivo anticipano le gare di domani — ecco una selezione di delibere recenti che a breve potrebbero entrare in fase di gara.",
      cta: "Interessati a posizionarvi anticipatamente? Vi illustriamo volentieri il nostro servizio di early-warning.",
      footer: "Bauservice KG · Bressanone · Radar Progetti",
      focusHeading: "Delibere e progetti in arrivo",
    },
  },
  D: {
    de: {
      preview: "Neue Baukonzessionen in Ihrer Region",
      subject: "Baukonzessionen — private und gewerbliche Vorhaben",
      salutationPrefix: "Sehr geehrte Damen und Herren bei",
      salutationFallback: "Sehr geehrte Damen und Herren,",
      intro:
        "frisch genehmigte Bauvorhaben in Ihrer Region — eine Ausgangsbasis für Direktansprache privater und gewerblicher Bauherren.",
      cta: "Unterstützung bei der Ansprache gewünscht? Wir liefern gerne Kontaktinformationen und Hintergrund.",
      footer: "Bauservice KG · Brixen · Konzessionsservice",
      focusHeading: "Neue Baukonzessionen",
    },
    it: {
      preview: "Nuove concessioni edilizie nella vostra zona",
      subject: "Concessioni edilizie — progetti privati e commerciali",
      salutationPrefix: "Gentili signori di",
      salutationFallback: "Gentili signori,",
      intro:
        "nuovi interventi edilizi autorizzati nella vostra zona — una base di partenza per contattare direttamente committenti privati e commerciali.",
      cta: "Desiderate supporto nel contatto? Forniamo volentieri informazioni e contesto.",
      footer: "Bauservice KG · Bressanone · Servizio Concessioni",
      focusHeading: "Nuove concessioni edilizie",
    },
  },
};

export function scenarioFromService(service: Service): ScenarioId {
  for (const id of scenariosOrder) {
    if (scenarios[id].service === service) return id;
  }
  return "A";
}

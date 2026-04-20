import mjml2html from "mjml";
import { convert as htmlToText } from "html-to-text";
import type { Example, RenderPayload, Service } from "@/lib/types";
import { servicesOrder } from "@/lib/filter-options";

const TEMPLATE_VERSION = "v1";

const serviceLabelDe: Record<Service, string> = {
  ausschreibungen: "Aktuelle Ausschreibungen",
  ergebnisse: "Ergebnisse & Zuschläge",
  beschluesse: "Beschlüsse & Projekte",
  baukonzessionen: "Baukonzessionen",
};

const serviceLabelIt: Record<Service, string> = {
  ausschreibungen: "Gare in corso",
  ergebnisse: "Esiti e aggiudicazioni",
  beschluesse: "Delibere e progetti",
  baukonzessionen: "Concessioni edilizie",
};

const defaults = {
  de: {
    preview: "Aktuelle Informationen aus dem Bauservice-Netzwerk",
    salutation: "Sehr geehrte Damen und Herren,",
    intro: "nachfolgend eine persönliche Auswahl passender Informationen für Sie.",
    cta: "Für weitere Details kontaktieren Sie uns gerne.",
    footer: "Bauservice KG · Brixen",
  },
  it: {
    preview: "Informazioni aggiornate dalla rete Bauservice",
    salutation: "Gentile cliente,",
    intro:
      "di seguito trovate una selezione personalizzata basata sui vostri interessi.",
    cta: "Contattateci per ulteriori informazioni.",
    footer: "Bauservice KG · Bressanone",
  },
} as const;

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function describe(it: Example, sprache: "de" | "it"): string {
  return sprache === "it" ? it.beschreibungIt : it.beschreibungDe;
}

function buildServiceSection(
  label: string,
  items: Example[],
  sprache: "de" | "it"
): string {
  if (items.length === 0) return "";
  const rows = items
    .map(
      (it) =>
        `<mj-text padding="4px 0" color="#334155" line-height="1.5">• ${escape(describe(it, sprache))}</mj-text>`
    )
    .join("");
  return `
    <mj-text padding-top="24px" font-size="16px" font-weight="600" color="#0f172a">${escape(label)}</mj-text>
    ${rows}
  `;
}

function buildMjml(payload: RenderPayload["payload"], sprache: "de" | "it"): string {
  const d = defaults[sprache];
  const salutation = escape(payload.overrides?.salutation || d.salutation);
  const intro = escape(payload.overrides?.intro || d.intro);
  const cta = escape(payload.overrides?.cta || d.cta);
  const labels = sprache === "it" ? serviceLabelIt : serviceLabelDe;

  const sections = servicesOrder
    .filter((s) => payload.serviceEnabled[s])
    .map((s) => buildServiceSection(labels[s], payload.examples[s] ?? [], sprache))
    .join("");

  return `
<mjml>
  <mj-head>
    <mj-title>Bauservice</mj-title>
    <mj-preview>${escape(d.preview)}</mj-preview>
    <mj-attributes>
      <mj-all font-family="Inter, Arial, sans-serif" />
      <mj-text color="#0f172a" font-size="14px" line-height="1.5" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#fafafa">
    <mj-section padding="24px 0">
      <mj-column>
        <mj-text align="left" font-size="12px" color="#2563eb" font-weight="600" padding-bottom="0">BAUSERVICE</mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#ffffff" padding="32px" border="1px solid #e4e4e7" border-radius="8px">
      <mj-column>
        <mj-text>${salutation}</mj-text>
        <mj-text color="#334155">${intro}</mj-text>
        ${sections}
        <mj-text padding-top="28px" color="#334155">${cta}</mj-text>
        <mj-divider border-color="#e4e4e7" padding="24px 0 8px 0" />
        <mj-text font-size="11px" color="#71717a">${escape(d.footer)}</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`.trim();
}

type RenderResult = { html: string; text: string };

const cache = new Map<string, RenderResult>();
const MAX_CACHE = 200;

function cacheKey(payload: RenderPayload): string {
  return `${TEMPLATE_VERSION}|${payload.sprache}|${JSON.stringify(payload.payload)}`;
}

export function render(payload: RenderPayload): RenderResult {
  const key = cacheKey(payload);
  const hit = cache.get(key);
  if (hit) return hit;

  const mjmlString = buildMjml(payload.payload, payload.sprache);
  const { html, errors } = mjml2html(mjmlString, { validationLevel: "soft" });

  if (errors && errors.length > 0) {
    // Soft errors logged but non-fatal
    console.warn("[mjml] warnings:", errors.slice(0, 3));
  }

  const text = htmlToText(html, {
    wordwrap: 78,
    selectors: [
      { selector: "img", format: "skip" },
      { selector: "a", options: { ignoreHref: true } },
    ],
  });

  const result: RenderResult = { html, text };
  if (cache.size >= MAX_CACHE) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(key, result);
  return result;
}

export const templateVersion = TEMPLATE_VERSION;

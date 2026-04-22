import { convert as htmlToText } from "html-to-text";
import type { Example, RenderPayload, ScenarioId, Service } from "@/lib/types";
import { servicesOrder } from "@/lib/filter-options";
import { scenarioCopy } from "@/lib/scenarios";

const TEMPLATE_VERSION = "v5-customer-type";

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

function formatCurrency(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function exampleMeta(
  it: Example,
  sprache: "de" | "it"
): { label: string; value: string }[] {
  const locale = sprache === "it" ? "it-IT" : "de-DE";
  const meta: { label: string; value: string }[] = [];
  if (it.datum) {
    meta.push({
      label: sprache === "it" ? "Data" : "Datum",
      value: it.datum,
    });
  }
  if (it.bezirk) {
    meta.push({
      label: sprache === "it" ? "Zona" : "Bezirk",
      value: it.bezirk,
    });
  }
  if ("betrag" in it && typeof it.betrag === "number") {
    meta.push({
      label: sprache === "it" ? "Importo" : "Betrag",
      value: formatCurrency(it.betrag, locale),
    });
  }
  if (it.gewerk) {
    meta.push({
      label: sprache === "it" ? "Categoria" : "Gewerk",
      value: it.gewerk,
    });
  }
  return meta;
}

function buildExampleCard(it: Example, sprache: "de" | "it"): string {
  const meta = exampleMeta(it, sprache);
  const metaRow = meta.length
    ? `<div style="margin-bottom:6px;font-size:12px;color:#64748b;">${meta
        .map(
          (m) =>
            `<span style="display:inline-block;margin-right:14px;"><strong style="color:#475569;">${escape(m.label)}:</strong> ${escape(m.value)}</span>`
        )
        .join("")}</div>`
    : "";
  return `
      <tr>
        <td style="padding:6px 0 10px 0;">
          <div style="border-left:3px solid #2563eb;padding:10px 14px;background:#f8fafc;border-radius:4px;">
            ${metaRow}
            <div style="font-size:14px;line-height:1.55;color:#0f172a;">${escape(describe(it, sprache))}</div>
          </div>
        </td>
      </tr>`;
}

function buildSection(
  label: string,
  items: Example[],
  sprache: "de" | "it"
): string {
  if (items.length === 0) return "";
  const cards = items.map((it) => buildExampleCard(it, sprache)).join("");
  return `
    <tr>
      <td style="padding-top:22px;padding-bottom:8px;font-size:14px;font-weight:600;color:#0f172a;letter-spacing:-0.01em;">${escape(label)}</td>
    </tr>
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${cards}
        </table>
      </td>
    </tr>`;
}

function buildSalutation(
  payload: RenderPayload["payload"],
  sprache: "de" | "it",
  scenarioId: ScenarioId
): string {
  const override = payload.overrides?.salutation;
  if (override) return escape(override);
  const copy = scenarioCopy[scenarioId][sprache];
  const recipient =
    sprache === "it" ? payload.recipient.nameIt : payload.recipient.nameDe;
  if (recipient && recipient.trim().length > 0) {
    return `${escape(copy.salutationPrefix)} <strong>${escape(recipient)}</strong>,`;
  }
  return escape(copy.salutationFallback);
}

function buildValuePropsList(items: string[]): string {
  const lis = items
    .map(
      (text, idx) =>
        `<li style="margin:4px 0;padding:0;color:#334155;"><strong style="color:#2563eb;">${idx + 1}.</strong> ${escape(text)}</li>`
    )
    .join("");
  return `
    <tr>
      <td style="padding-top:22px;">
        <ol style="margin:0;padding:0;list-style:none;font-size:13px;line-height:1.55;">
          ${lis}
        </ol>
      </td>
    </tr>`;
}

function wrapDocument(sprache: string, innerBody: string): string {
  return `<!doctype html>
<html lang="${sprache}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Bauservice</title>
  </head>
  <body style="margin:0;padding:0;background:#fafafa;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;">
    ${innerBody}
  </body>
</html>`;
}

function buildHtml(
  payload: RenderPayload["payload"],
  sprache: "de" | "it",
  scenarioId: ScenarioId
): string {
  if (payload.overrides?.bodyHtml) {
    return wrapDocument(sprache, payload.overrides.bodyHtml);
  }

  const copy = scenarioCopy[scenarioId][sprache];
  const salutation = buildSalutation(payload, sprache, scenarioId);
  const hook = escape(payload.overrides?.hook || copy.hook);
  const bridge = escape(payload.overrides?.bridge || copy.bridge);
  const cta = escape(payload.overrides?.cta || copy.cta);
  const labels = sprache === "it" ? serviceLabelIt : serviceLabelDe;

  const exampleSections = servicesOrder
    .filter((s) => payload.serviceEnabled[s])
    .map((s) => buildSection(labels[s], payload.examples[s] ?? [], sprache))
    .join("");

  const valueProps = buildValuePropsList(copy.valueProps);
  const optOutDe =
    "Wir informieren Sie, dass Ihre Emailadresse aus öffentlich zugänglichen Archiven stammt. Betreff REMOVE an info@bauservice.it streicht Sie aus unseren Archiven.";
  const optOutIt =
    "La informiamo che la sua e-mail è stata trovata su internet. Inviando una e-mail a info@bauservice.it con oggetto REMOVE verrà rimossa dai nostri archivi.";

  const inner = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;">
            <tr>
              <td style="padding-bottom:18px;font-size:12px;font-weight:700;letter-spacing:0.06em;color:#2563eb;">
                BAUSERVICE
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border:1px solid #e4e4e7;border-radius:10px;padding:32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:14px;line-height:1.55;padding-bottom:10px;">${salutation}</td>
                  </tr>
                  <tr>
                    <td style="font-size:14px;line-height:1.55;color:#334155;">${hook}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:16px;font-size:14px;line-height:1.55;color:#334155;">${bridge}</td>
                  </tr>
                  ${exampleSections}
                  ${valueProps}
                  <tr>
                    <td style="padding-top:22px;font-size:13px;line-height:1.55;color:#475569;font-style:italic;">${escape(copy.urgency)}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:20px;font-size:14px;line-height:1.55;color:#0f172a;font-weight:500;">${cta}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:24px;border-top:1px solid #e4e4e7;padding-bottom:6px;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td style="padding-top:4px;font-size:11px;color:#71717a;">${escape(copy.footer)}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:12px;font-size:10px;line-height:1.5;color:#a1a1aa;">${escape(sprache === "it" ? optOutIt : optOutDe)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
  return wrapDocument(sprache, inner);
}

type RenderResult = { html: string; text: string };

const cache = new Map<string, RenderResult>();
const MAX_CACHE = 200;

function cacheKey(payload: RenderPayload): string {
  return `${TEMPLATE_VERSION}|${payload.sprache}|${payload.scenarioId ?? "D"}|${JSON.stringify(payload.payload)}`;
}

export function render(payload: RenderPayload): RenderResult {
  const key = cacheKey(payload);
  const hit = cache.get(key);
  if (hit) return hit;

  const scenarioId: ScenarioId = payload.scenarioId ?? "D";
  const html = buildHtml(payload.payload, payload.sprache, scenarioId);

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

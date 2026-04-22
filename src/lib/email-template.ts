import { convert as htmlToText } from "html-to-text";
import type {
  AusschreibungExample,
  BeschlussExample,
  ErgebnisExample,
  Example,
  KonzessionExample,
  RenderPayload,
  RenderResult,
  ScenarioId,
  Service,
  Sprache,
} from "@/lib/types";
import { DEFAULT_SCENARIO_ID } from "@/lib/types";
import { servicesOrder } from "@/lib/filter-options";
import { formatCurrency } from "@/lib/format";
import {
  DESCRIPTION_CUT_CHARS,
  getContent,
  type ContentPack,
  type MetaLabels,
  type ScenarioContent,
  type Signature,
} from "@/lib/email-template-content";

const TEMPLATE_VERSION = "v6-polish";

type MetaRow = { label: string; value: string };

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function describe(ex: Example, sprache: Sprache): string {
  const raw = sprache === "it" ? ex.beschreibungIt : ex.beschreibungDe;
  if (raw.length <= DESCRIPTION_CUT_CHARS) return raw;
  return raw.slice(0, DESCRIPTION_CUT_CHARS).trimEnd() + "…";
}

function percent(value: number | undefined, locale: string): string | null {
  if (typeof value !== "number") return null;
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(value / 100);
}

function pushMeta(
  meta: MetaRow[],
  label: string,
  value: string | undefined | null
): void {
  if (value === undefined || value === null || value === "") return;
  meta.push({ label, value });
}

function metaForAusschreibung(
  ex: AusschreibungExample,
  labels: MetaLabels,
  locale: string
): MetaRow[] {
  const meta: MetaRow[] = [];
  pushMeta(meta, labels.ausschreiber, ex.ausschreiberName);
  pushMeta(meta, labels.gewerk, ex.gewerk);
  pushMeta(meta, labels.bezirk, ex.bezirk);
  pushMeta(meta, labels.vergabeBetrag, formatCurrency(ex.betrag, locale));
  return meta;
}

function metaForErgebnis(
  ex: ErgebnisExample,
  sprache: Sprache,
  labels: MetaLabels,
  locale: string
): MetaRow[] {
  const meta: MetaRow[] = [];
  pushMeta(meta, labels.ausschreiber, ex.ausschreiberName);
  pushMeta(meta, labels.gewerk, ex.gewerk);
  pushMeta(meta, labels.bezirk, ex.bezirk);
  pushMeta(meta, labels.vergabeBetrag, formatCurrency(ex.ausschreibungBetrag, locale));
  const gewinner = sprache === "it" ? ex.teilnehmerNameIt : ex.teilnehmerNameDe;
  const zuschlagBetrag = formatCurrency(ex.betrag, locale);
  const nachlass = percent(ex.prozent, locale);
  if (gewinner) {
    const suffix = [zuschlagBetrag, nachlass].filter(Boolean).join(" · ");
    pushMeta(
      meta,
      labels.zuschlagAn,
      suffix ? `${gewinner} (${suffix})` : gewinner
    );
  }
  if (ex.datum) {
    const idSuffix = ex.nummer ? ` (ID ${ex.nummer})` : "";
    pushMeta(meta, labels.bekanntmachung, `${ex.datum}${idSuffix}`);
  }
  return meta;
}

function metaForBeschluss(
  ex: BeschlussExample,
  labels: MetaLabels,
  locale: string
): MetaRow[] {
  const meta: MetaRow[] = [];
  pushMeta(meta, labels.ausschreiber, ex.ausschreiberName);
  pushMeta(meta, labels.status, ex.status);
  pushMeta(meta, labels.beschlussNr, ex.beschlussNr);
  pushMeta(meta, labels.beschlussDatum, ex.beschlussDatum);
  pushMeta(meta, labels.gewerk, ex.gewerk);
  pushMeta(meta, labels.bezirk, ex.bezirk);
  pushMeta(
    meta,
    labels.geschaetzterBetrag,
    formatCurrency(ex.geschaetzterBetrag ?? ex.betrag, locale)
  );
  return meta;
}

function metaForKonzession(
  ex: KonzessionExample,
  labels: MetaLabels
): MetaRow[] {
  const meta: MetaRow[] = [];
  pushMeta(meta, labels.gemeinde, ex.gemeinde);
  pushMeta(meta, labels.konzessionsTyp, ex.konzessionenTyp);
  pushMeta(meta, labels.bauherr, ex.name);
  pushMeta(meta, labels.bezirk, ex.bezirk);
  pushMeta(meta, labels.datum, ex.datum);
  return meta;
}

function metaFor(
  ex: Example,
  sprache: Sprache,
  labels: MetaLabels,
  locale: string
): MetaRow[] {
  switch (ex.service) {
    case "ausschreibungen":
      return metaForAusschreibung(ex, labels, locale);
    case "ergebnisse":
      return metaForErgebnis(ex, sprache, labels, locale);
    case "beschluesse":
      return metaForBeschluss(ex, labels, locale);
    case "baukonzessionen":
      return metaForKonzession(ex, labels);
  }
}

function buildExampleBlock(
  ex: Example,
  sprache: Sprache,
  pack: ContentPack
): string {
  const meta = metaFor(ex, sprache, pack.metaLabels, pack.locale);
  const metaLines = meta
    .map(
      (m) =>
        `<div style="font-size:12px;line-height:1.5;color:#475569;"><strong style="color:#334155;font-weight:600;">${escape(m.label)}:</strong> ${escape(m.value)}</div>`
    )
    .join("");
  return `
      <tr>
        <td style="padding:10px 0 6px 0;">
          ${metaLines}
          <div style="margin-top:6px;font-size:14px;line-height:1.55;color:#0f172a;">${escape(describe(ex, sprache))}</div>
        </td>
      </tr>`;
}

function buildSection(
  heading: string,
  examples: Example[],
  sprache: Sprache,
  pack: ContentPack
): string {
  if (examples.length === 0) return "";
  const blocks: string[] = [];
  examples.forEach((ex, idx) => {
    if (idx > 0) {
      blocks.push(
        `<tr><td style="padding:8px 0;"><hr style="border:0;border-top:1px solid #e4e4e7;margin:0;" /></td></tr>`
      );
    }
    blocks.push(buildExampleBlock(ex, sprache, pack));
  });
  return `
    <tr>
      <td style="padding-top:22px;padding-bottom:4px;font-size:14px;font-weight:600;color:#0f172a;letter-spacing:-0.01em;">${escape(heading)}</td>
    </tr>
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${blocks.join("")}
        </table>
      </td>
    </tr>`;
}

function buildSalutation(
  payload: RenderPayload["payload"],
  sprache: Sprache,
  scenario: ScenarioContent
): string {
  const override = payload.overrides?.salutation;
  if (override) return escape(override);
  const recipient =
    sprache === "it" ? payload.recipient.nameIt : payload.recipient.nameDe;
  if (recipient && recipient.trim().length > 0) {
    return `${escape(scenario.salutationPrefix)} <strong>${escape(recipient)}</strong>,`;
  }
  return escape(scenario.salutationFallback);
}

function buildValueProps(items: string[]): string {
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

function buildSignature(signature: Signature, senderName: string): string {
  const lines = [
    senderName,
    "",
    signature.companyLine,
    signature.streetLine,
    signature.cityLine,
    `Tel. ${signature.tel} · Fax ${signature.fax}`,
    `${signature.email} · ${signature.website}`,
  ];
  return lines
    .map((line) =>
      line === ""
        ? `<div style="height:8px;">&nbsp;</div>`
        : `<div style="font-size:12px;line-height:1.55;color:#475569;">${escape(line)}</div>`
    )
    .join("");
}

function resolveSubject(
  scenario: ScenarioContent,
  pinnedExample: Example | undefined,
  sprache: Sprache,
  overrideSubject: string | undefined
): string {
  if (overrideSubject && overrideSubject.trim().length > 0) return overrideSubject;
  if (!scenario.subject.includes("{itemTitle}")) return scenario.subject;
  const fallback = scenario.preview;
  const title = pinnedExample ? describe(pinnedExample, sprache) : fallback;
  return scenario.subject.replace("{itemTitle}", title);
}

function buildPreheader(text: string): string {
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:#fafafa;">${escape(text)}</div>`;
}

function wrapDocument(sprache: Sprache, preheader: string, inner: string): string {
  return `<!doctype html>
<html lang="${sprache}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Bauservice</title>
  </head>
  <body style="margin:0;padding:0;background:#fafafa;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;">
    ${preheader}
    ${inner}
  </body>
</html>`;
}

function buildHtml(
  payload: RenderPayload["payload"],
  sprache: Sprache,
  scenarioId: ScenarioId
): { html: string; subject: string } {
  const pack = getContent(sprache);
  const scenario = pack.scenarios[scenarioId];
  const subject = resolveSubject(
    scenario,
    payload.pinnedExample,
    sprache,
    payload.overrides?.subject
  );

  if (payload.overrides?.bodyHtml) {
    const html = wrapDocument(
      sprache,
      buildPreheader(scenario.preview),
      payload.overrides.bodyHtml
    );
    return { html, subject };
  }

  const salutation = buildSalutation(payload, sprache, scenario);
  const hook = escape(payload.overrides?.hook || scenario.hook);
  const bridge = escape(payload.overrides?.bridge || scenario.bridge);
  const ctaOpening = escape(scenario.ctaOpening);
  const ctaClosing = escape(payload.overrides?.cta || scenario.ctaClosing);
  const senderName =
    payload.overrides?.senderName?.trim() || pack.signature.senderName;

  const activeServices: Service[] = servicesOrder.filter(
    (s) => payload.serviceEnabled[s]
  );
  const anyExamples = activeServices.some(
    (s) => (payload.examples[s] ?? []).length > 0
  );
  const sections = anyExamples
    ? activeServices
        .map((s) =>
          buildSection(
            pack.serviceLabels[s],
            payload.examples[s] ?? [],
            sprache,
            pack
          )
        )
        .join("")
    : "";

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
                    <td style="padding-top:16px;font-size:14px;line-height:1.55;color:#0f172a;font-weight:500;">${ctaOpening}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:16px;font-size:14px;line-height:1.55;color:#334155;">${bridge}</td>
                  </tr>
                  ${sections}
                  ${buildValueProps(pack.valueProps)}
                  <tr>
                    <td style="padding-top:22px;font-size:13px;line-height:1.55;color:#475569;font-style:italic;">${escape(pack.urgency)}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:20px;font-size:14px;line-height:1.55;color:#0f172a;font-weight:500;">${ctaClosing}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:24px;border-top:1px solid #e4e4e7;padding-bottom:6px;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td style="padding-top:4px;">${buildSignature(pack.signature, senderName)}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:14px;font-size:10px;line-height:1.5;color:#a1a1aa;">${escape(pack.optOutDisclaimer)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;

  return {
    html: wrapDocument(sprache, buildPreheader(scenario.preview), inner),
    subject,
  };
}

const cache = new Map<string, RenderResult>();
const MAX_CACHE = 200;

function cacheKey(payload: RenderPayload): string {
  // Shrink pinnedExample to an identity pair — the same Example object repeats
  // across every recipient in an item-origin campaign, so serializing the full
  // shape per key would explode the key strings without adding any distinction.
  const { pinnedExample, ...rest } = payload.payload;
  const pinnedKey = pinnedExample
    ? { id: pinnedExample.id, service: pinnedExample.service }
    : null;
  return `${TEMPLATE_VERSION}|${payload.sprache}|${payload.scenarioId ?? DEFAULT_SCENARIO_ID}|${JSON.stringify({ ...rest, pinnedKey })}`;
}

export function render(payload: RenderPayload): RenderResult {
  const key = cacheKey(payload);
  const hit = cache.get(key);
  if (hit) return hit;

  const scenarioId: ScenarioId = payload.scenarioId ?? DEFAULT_SCENARIO_ID;
  const { html, subject } = buildHtml(payload.payload, payload.sprache, scenarioId);

  const text = htmlToText(html, {
    wordwrap: 78,
    selectors: [
      { selector: "img", format: "skip" },
      { selector: "a", options: { ignoreHref: true } },
    ],
  });

  const result: RenderResult = { html, text, subject };
  if (cache.size >= MAX_CACHE) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(key, result);
  return result;
}

export const templateVersion = TEMPLATE_VERSION;

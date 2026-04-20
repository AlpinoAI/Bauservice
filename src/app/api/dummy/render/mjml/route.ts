import { NextResponse } from "next/server";
import type { RenderPayload, Service, Sprache } from "@/lib/types";

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

function salutation(sprache: Sprache, override?: string): string {
  if (override) return override;
  return sprache === "it" ? "Gentile cliente," : "Sehr geehrte Damen und Herren,";
}

function intro(sprache: Sprache, override?: string): string {
  if (override) return override;
  return sprache === "it"
    ? "di seguito trovate una selezione personalizzata basata sui vostri interessi."
    : "nachfolgend eine persönliche Auswahl passender Informationen für Sie.";
}

function cta(sprache: Sprache, override?: string): string {
  if (override) return override;
  return sprache === "it"
    ? "Contattateci per ulteriori informazioni."
    : "Für weitere Details kontaktieren Sie uns gerne.";
}

function describe(sprache: Sprache, beschrDe: string, beschrIt: string): string {
  return sprache === "it" ? beschrIt : beschrDe;
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<RenderPayload>;
  if (!body.sprache || !body.payload) {
    return NextResponse.json(
      { error: "sprache and payload required" },
      { status: 400 }
    );
  }
  const { sprache, payload } = body;

  const services: Service[] = [
    "ausschreibungen",
    "ergebnisse",
    "beschluesse",
    "baukonzessionen",
  ];
  const labels = sprache === "it" ? serviceLabelIt : serviceLabelDe;

  const blocks = services
    .filter((s) => payload.serviceEnabled[s])
    .map((s) => {
      const items = payload.examples[s] ?? [];
      if (items.length === 0) return "";
      const list = items
        .map(
          (it) =>
            `<li style="margin-bottom:8px;">${describe(sprache, it.beschreibungDe, it.beschreibungIt)}</li>`
        )
        .join("");
      return `
        <section style="margin-top:24px;">
          <h2 style="font-size:16px;font-weight:600;color:#0f172a;">${labels[s]}</h2>
          <ul style="padding-left:20px;color:#334155;font-size:14px;line-height:1.5;">${list}</ul>
        </section>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="${sprache}">
  <body style="font-family:Inter,system-ui,sans-serif;background:#fafafa;padding:24px;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;background:#fff;padding:32px;border-radius:8px;border:1px solid #e4e4e7;">
      <p style="font-size:14px;">${salutation(sprache, payload.overrides?.salutation)}</p>
      <p style="font-size:14px;color:#334155;">${intro(sprache, payload.overrides?.intro)}</p>
      ${blocks}
      <p style="margin-top:32px;font-size:14px;color:#334155;">${cta(sprache, payload.overrides?.cta)}</p>
      <hr style="margin-top:32px;border:none;border-top:1px solid #e4e4e7;"/>
      <p style="margin-top:16px;font-size:11px;color:#71717a;">
        ${sprache === "it" ? "Bauservice KG · Bressanone" : "Bauservice KG · Brixen"}
      </p>
    </div>
  </body>
</html>`;

  const textLines: string[] = [];
  textLines.push(salutation(sprache, payload.overrides?.salutation));
  textLines.push("");
  textLines.push(intro(sprache, payload.overrides?.intro));
  for (const s of services) {
    if (!payload.serviceEnabled[s]) continue;
    const items = payload.examples[s] ?? [];
    if (items.length === 0) continue;
    textLines.push("");
    textLines.push(labels[s].toUpperCase());
    for (const it of items) {
      textLines.push(
        `- ${describe(sprache, it.beschreibungDe, it.beschreibungIt)}`
      );
    }
  }
  textLines.push("");
  textLines.push(cta(sprache, payload.overrides?.cta));
  const text = textLines.join("\n");

  return NextResponse.json({ html, text });
}

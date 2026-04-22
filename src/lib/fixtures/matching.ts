import type { Example, Recipient, Service, WithScore } from "@/lib/types";
import {
  ausschreibungenFixture,
  beschluesseFixture,
  ergebnisseFixture,
  itemsForService,
  konzessionenFixture,
} from "@/lib/fixtures/items";
import { recipientsFixture, visibleRecipients } from "@/lib/fixtures/recipients";
import { bezirkItToDe, type Gewerk } from "@/lib/filter-options";

// Grobe Gewerk-Heuristik bis der echte Endpoint Kategorien pro Kontakt liefert.
// Stichworte aus dem Firmennamen (deutsch + italienisch) auf den Gewerk-Katalog
// aus filter-options.ts mappen.
const gewerkKeywords: Array<[RegExp, Gewerk]> = [
  [/elektr|elettric/i, "Elektro"],
  [/sanit[aä]r|idraulic|impianti sanit|riscaldamento|termo/i, "Sanitär"],
  [/tiefbau|stradal|sottosuolo|genio civil|scavi/i, "Tiefbau"],
  [/hochbau|edil|costruz|bau gmbh|bau kg|bauunternehm/i, "Hochbau"],
  [/holzbau|zimmer|carpent|dach|copertur|lattonier/i, "Zimmerei"],
  [/tischler|arreda|falegn/i, "Tischlerei"],
  [/schlosser|fabbro|metall/i, "Schlosserei"],
  [/maler|imbianc|restaur/i, "Maler"],
  [/architekt|arch\.|geom\.|ingenieur|planer|progett|servizi tecnici/i, "Planung"],
  [/hotel|tourism/i, "Hotellerie"],
];

function gewerkFor(recipient: Recipient): string[] {
  const name = `${recipient.nameDe} ${recipient.nameIt}`;
  const hits = new Set<Gewerk>();
  for (const [re, gewerk] of gewerkKeywords) {
    if (re.test(name)) hits.add(gewerk);
  }
  return Array.from(hits);
}

function normalizeBezirk(b: string | undefined): string | undefined {
  if (!b) return undefined;
  return bezirkItToDe[b] ?? b;
}

function scoreValue(gewerkMatch: boolean, regionMatch: boolean): number {
  if (gewerkMatch && regionMatch) return 0.88 + Math.random() * 0.1;
  if (gewerkMatch) return 0.7 + Math.random() * 0.15;
  if (regionMatch) return 0.5 + Math.random() * 0.15;
  return 0.25 + Math.random() * 0.2;
}

function reasonText(
  gewerkMatch: boolean,
  regionMatch: boolean,
  gewerk?: string,
  bezirk?: string
): string {
  if (gewerkMatch && regionMatch) {
    return `Passend zu Gewerk ${gewerk} und Bezirk ${bezirk}`;
  }
  if (gewerkMatch) {
    return `Gleiches Gewerk (${gewerk}), anderer Bezirk`;
  }
  if (regionMatch) {
    return `Gleicher Bezirk (${bezirk}), anderes Gewerk`;
  }
  return "Nur nach Aktualität sortiert";
}

export function matchExamplesForRecipient(
  recipientId: number,
  service: Service,
  n: number
): WithScore<Example>[] {
  const recipient = recipientsFixture.find((r) => r.id === recipientId);
  if (!recipient || !recipient.aktiv || recipient.optOut) return [];

  const gewerkeRec = gewerkFor(recipient);
  const items = itemsForService(service);

  const scored = items.map<WithScore<Example>>((item) => {
    const gewerkMatch = item.gewerk
      ? gewerkeRec.includes(item.gewerk)
      : false;
    const regionMatch =
      !!recipient.bezirkDe && recipient.bezirkDe === normalizeBezirk(item.bezirk);
    return {
      ...item,
      score: Number(scoreValue(gewerkMatch, regionMatch).toFixed(3)),
      reason: reasonText(gewerkMatch, regionMatch, item.gewerk, item.bezirk),
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, n);
}

export function matchRecipientsForItem(
  service: Service,
  itemId: number,
  n: number
): WithScore<Recipient>[] {
  const pool =
    service === "ausschreibungen"
      ? ausschreibungenFixture
      : service === "ergebnisse"
        ? ergebnisseFixture
        : service === "beschluesse"
          ? beschluesseFixture
          : konzessionenFixture;
  const item = pool.find((it) => it.id === itemId);
  if (!item) return [];

  const candidates = visibleRecipients().filter((r) => r.rollen.anbieter);

  const scored = candidates.map<WithScore<Recipient>>((r) => {
    const gewerkeRec = gewerkFor(r);
    const gewerkMatch = item.gewerk ? gewerkeRec.includes(item.gewerk) : false;
    const regionMatch = !!r.bezirkDe && r.bezirkDe === normalizeBezirk(item.bezirk);
    return {
      ...r,
      score: Number(scoreValue(gewerkMatch, regionMatch).toFixed(3)),
      reason: reasonText(gewerkMatch, regionMatch, item.gewerk, item.bezirk),
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, n);
}

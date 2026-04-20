import type { Example, Recipient, Service, WithScore } from "@/lib/types";
import {
  ausschreibungenFixture,
  beschluesseFixture,
  ergebnisseFixture,
  itemsForService,
  konzessionenFixture,
} from "@/lib/fixtures/items";
import { recipientsFixture, visibleRecipients } from "@/lib/fixtures/recipients";

const recipientGewerkHints: Record<number, string[]> = {
  1001: ["Hochbau"],
  1002: ["Hochbau"],
  1003: ["Tiefbau"],
  1004: ["Elektro"],
  1005: ["Sanitär"],
  1008: ["Hochbau"],
};

function gewerkFor(recipient: Recipient): string[] {
  return recipientGewerkHints[recipient.id] ?? [];
}

function score(gewerkMatch: boolean, regionMatch: boolean): number {
  if (gewerkMatch && regionMatch) return 0.88 + Math.random() * 0.1;
  if (gewerkMatch) return 0.7 + Math.random() * 0.15;
  if (regionMatch) return 0.5 + Math.random() * 0.15;
  return 0.25 + Math.random() * 0.2;
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
      !!recipient.bezirkDe && recipient.bezirkDe === item.bezirk;
    return { ...item, score: Number(score(gewerkMatch, regionMatch).toFixed(3)) };
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
    const regionMatch = !!r.bezirkDe && r.bezirkDe === item.bezirk;
    return { ...r, score: Number(score(gewerkMatch, regionMatch).toFixed(3)) };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, n);
}

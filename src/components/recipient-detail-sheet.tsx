"use client";

import { X } from "lucide-react";
import type { Recipient } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RollenBadges } from "./rollen-badges";

type Props = {
  open: boolean;
  recipient: Recipient | null;
  onClose: () => void;
  onStartCampaign?: (r: Recipient) => void;
  starting?: boolean;
};

export function RecipientDetailSheet({
  open,
  recipient,
  onClose,
  onStartCampaign,
  starting,
}: Props) {
  if (!open || !recipient) return null;

  const name =
    recipient.sprache === "it" ? recipient.nameIt : recipient.nameDe;
  const ap = recipient.ansprechpartner;
  const apLine = ap
    ? [ap.anrede, ap.titel, ap.vorname, ap.nachname]
        .filter(Boolean)
        .join(" ")
    : null;
  const webseiteHref = recipient.webseite
    ? recipient.webseite.startsWith("http")
      ? recipient.webseite
      : `https://${recipient.webseite}`
    : null;

  return (
    <div className="fixed inset-0 z-40 flex" aria-modal role="dialog">
      <div
        className="flex-1 bg-zinc-900/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside className="flex h-full w-full max-w-xl flex-col bg-white shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <RollenBadges rollen={recipient.rollen} />
              <span className="text-xs uppercase text-zinc-500">
                {recipient.sprache}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-zinc-900">{name}</h2>
            {apLine && (
              <p className="mt-0.5 text-sm text-zinc-600">{apLine}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <Section title="Kontakt">
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
              <Row label="Email" value={recipient.email} />
              {recipient.pec && <Row label="PEC" value={recipient.pec} />}
              {recipient.telefon && (
                <Row label="Telefon" value={recipient.telefon} />
              )}
              {recipient.handynummer && (
                <Row label="Handy" value={recipient.handynummer} />
              )}
              {webseiteHref && (
                <Row
                  label="Webseite"
                  value={
                    <a
                      href={webseiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline-offset-2 hover:underline"
                    >
                      {recipient.webseite}
                    </a>
                  }
                />
              )}
            </dl>
          </Section>

          {(recipient.anschrift || recipient.gemeindeDe || recipient.bezirkDe) && (
            <Section title="Adresse">
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
                {recipient.anschrift && (
                  <Row label="Anschrift" value={recipient.anschrift} />
                )}
                {recipient.gemeindeDe && (
                  <Row
                    label="Gemeinde"
                    value={
                      recipient.plz
                        ? `${recipient.plz} ${recipient.gemeindeDe}`
                        : recipient.gemeindeDe
                    }
                  />
                )}
                {recipient.bezirkDe && (
                  <Row label="Bezirk" value={recipient.bezirkDe} />
                )}
                {recipient.provinz && (
                  <Row label="Provinz" value={recipient.provinz} />
                )}
              </dl>
            </Section>
          )}

          {recipient.gewerke && recipient.gewerke.length > 0 && (
            <Section title="Gewerke">
              <div className="flex flex-wrap gap-1">
                {recipient.gewerke.map((g) => (
                  <Badge key={g} variant="neutral">
                    {g}
                  </Badge>
                ))}
              </div>
            </Section>
          )}

          <Section title="Status">
            <div className="flex flex-wrap gap-1 text-xs">
              {recipient.hatHistorie ? (
                <Badge variant="green">Historie</Badge>
              ) : (
                <Badge variant="gray">Keine Historie</Badge>
              )}
              {recipient.optOut && <Badge variant="red">Opt-out</Badge>}
              {!recipient.aktiv && <Badge variant="gray">Inaktiv</Badge>}
            </div>
          </Section>
        </div>

        <footer className="flex gap-2 border-t border-zinc-100 px-6 py-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Schließen
          </Button>
          {onStartCampaign && (
            <Button
              onClick={() => onStartCampaign(recipient)}
              disabled={starting}
              className="flex-1"
            >
              {starting ? "Lege an…" : "Kampagne starten"}
            </Button>
          )}
        </footer>
      </aside>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="contents">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-900">{value}</dd>
    </div>
  );
}

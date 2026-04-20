"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/top-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCampaignStore } from "@/lib/campaign-store";
import { EmailPreview } from "@/components/review/email-preview";

type SendResult = {
  jobId: string;
  accepted: number[];
  rejected: Array<{ recipientId: number; reason: string }>;
  demoMode: true;
};

export default function VersandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const campaign = useCampaignStore((s) => s.campaign);
  const drafts = useCampaignStore((s) => s.drafts);
  const activeId = useCampaignStore((s) => s.activeRecipientId);
  const storeCampaignId = useCampaignStore((s) => s.campaignId);
  const setActive = useCampaignStore((s) => s.setActiveRecipient);

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storeCampaignId !== id) {
      router.replace(`/kampagnen/${id}`);
    }
  }, [storeCampaignId, id, router]);

  if (storeCampaignId !== id || !campaign) {
    return (
      <>
        <TopNav />
        <main className="mx-auto max-w-5xl px-6 py-10">
          <div className="rounded-lg border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
            Lade Kampagne …
          </div>
        </main>
      </>
    );
  }

  const list = Object.values(drafts);
  const toSend = list.filter((d) => !d.skip);

  async function onSend() {
    if (toSend.length === 0) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/dummy/mailjet/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: id,
          recipientIds: toSend.map((d) => d.recipientId),
        }),
      });
      if (!res.ok) throw new Error(`Versand fehlgeschlagen (${res.status})`);
      const data = (await res.json()) as SendResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setSending(false);
    }
  }

  const activeDraft = activeId ? drafts[activeId] : null;

  if (result) {
    return (
      <>
        <TopNav />
        <main className="mx-auto max-w-3xl px-6 py-10">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-2">
              <Badge variant="green">Demo-Versand abgeschlossen</Badge>
              <span className="text-xs text-emerald-800">
                Job-ID: {result.jobId}
              </span>
            </div>
            <p className="mt-3 text-sm text-emerald-900">
              <strong>{result.accepted.length}</strong> E-Mails akzeptiert,{" "}
              <strong>{result.rejected.length}</strong> abgelehnt. Kein echter
              Mailversand — Mailjet-Anbindung folgt nach Phase 1.
            </p>
          </div>

          {result.rejected.length > 0 && (
            <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
              <h2 className="text-sm font-semibold text-amber-900">
                Abgelehnte Empfänger (Opt-out-Re-Check)
              </h2>
              <ul className="mt-2 space-y-1 text-sm text-amber-900">
                {result.rejected.map((r) => {
                  const d = drafts[r.recipientId];
                  const name = d
                    ? d.sprache === "it"
                      ? d.recipient.nameIt
                      : d.recipient.nameDe
                    : `ID ${r.recipientId}`;
                  return (
                    <li key={r.recipientId}>
                      <strong>{name}</strong>: {r.reason}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <div className="mt-6 flex gap-2">
            <Link href="/kampagnen">
              <Button>Zurück zur Kampagnen-Liste</Button>
            </Link>
            <Link href="/">
              <Button variant="secondary">Zum Dashboard</Button>
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-4 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="blue">
                Richtung {campaign.origin === "recipient" ? "A" : "B"}
              </Badge>
              <Badge variant="gray">Entwurf</Badge>
            </div>
            <h1 className="text-xl font-semibold">{campaign.name}</h1>
            <p className="mt-1 text-xs text-zinc-500">
              Letzte Prüfung vor Demo-Versand.
            </p>
          </div>
          <Link
            href={`/kampagnen/${id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Zurück zum Review
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_520px]">
          <div className="space-y-4">
            <section className="rounded-lg border border-zinc-200 bg-white">
              <header className="border-b border-zinc-100 px-4 py-3">
                <h2 className="text-sm font-semibold">
                  Empfängerliste ({toSend.length} von {list.length})
                </h2>
                <p className="text-xs text-zinc-500">
                  Gestrichene Empfänger werden nicht versandt. Beim Versand wird
                  Opt-out serverseitig nochmal geprüft.
                </p>
              </header>
              <ul className="divide-y divide-zinc-100">
                {list.map((d) => {
                  const name =
                    d.sprache === "it" ? d.recipient.nameIt : d.recipient.nameDe;
                  const isActive = d.recipientId === activeId;
                  return (
                    <li key={d.recipientId}>
                      <button
                        type="button"
                        onClick={() => setActive(d.recipientId)}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition ${
                          isActive ? "bg-blue-50" : "hover:bg-zinc-50"
                        } ${d.skip ? "opacity-50" : ""}`}
                      >
                        <div>
                          <div className="font-medium">{name}</div>
                          <div className="text-xs text-zinc-500">
                            {d.recipient.email}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="neutral">
                            {d.sprache.toUpperCase()}
                          </Badge>
                          {d.skip && <Badge variant="amber">skip</Badge>}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <strong>Demo-Modus.</strong> Kein echter Versand — die
              Mailjet-Anbindung folgt nach Phase 1. Der Server prüft beim Klick
              trotzdem den Opt-out-Status nochmal und liefert ein
              Accept/Reject-Resultat.
            </div>

            <div className="flex items-center justify-end gap-2">
              {error && <span className="text-sm text-red-600">{error}</span>}
              <Button
                variant="secondary"
                onClick={() => router.push(`/kampagnen/${id}`)}
              >
                Zurück
              </Button>
              <Button onClick={onSend} disabled={sending || toSend.length === 0}>
                {sending
                  ? "Versende …"
                  : `Demo-Versand (${toSend.length})`}
              </Button>
            </div>
          </div>

          <div className="lg:sticky lg:top-4 lg:self-start">
            {activeDraft ? (
              <EmailPreview recipientId={activeDraft.recipientId} />
            ) : (
              <div className="rounded-lg border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
                Empfänger auswählen, um die Vorschau zu sehen.
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

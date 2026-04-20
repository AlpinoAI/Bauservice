"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ItemPicker } from "@/components/item-picker";
import { Button } from "@/components/ui/button";
import { serviceLabels } from "@/lib/filter-options";
import type { Recipient, Service, WithScore } from "@/lib/types";

type Selection = { service: Service; itemId: number };

export default function NeuAusItemPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Selection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onNext() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const matchRes = await fetch("/api/dummy/matching/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: selected.service,
          itemId: selected.itemId,
          n: 20,
        }),
      });
      if (!matchRes.ok) throw new Error(`Matching fehlgeschlagen (${matchRes.status})`);
      const matchData = (await matchRes.json()) as {
        items: WithScore<Recipient>[];
      };
      const recipientIds = matchData.items.map((r) => r.id);

      const now = new Date();
      const name = `Kampagne ${now.toISOString().slice(0, 10)} · ${serviceLabels[selected.service]} · ID ${selected.itemId}`;

      const res = await fetch("/api/dummy/sql/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          origin: "item",
          itemRef: selected,
          recipientIds,
        }),
      });
      if (!res.ok) throw new Error(`Campaign-Erstellung fehlgeschlagen (${res.status})`);
      const campaign = (await res.json()) as { id: string };
      router.push(`/kampagnen/${campaign.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-8">
        <header className="mb-6">
          <div className="text-xs font-medium uppercase tracking-wide text-blue-600">
            Richtung B · Schritt 1
          </div>
          <h1 className="mt-1 text-2xl font-semibold">
            Ausschreibung, Projekt oder Konzession wählen
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Neue Einträge chronologisch. Das ausgewählte Item bleibt im Review
            das dominierende — passende Empfänger werden automatisch vorgeschlagen.
          </p>
        </header>

        <ItemPicker selected={selected} onSelectionChange={setSelected} />

        <div className="sticky bottom-6 mt-8 flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-zinc-700">
            {selected ? (
              <span>
                Ausgewählt: <strong>{serviceLabels[selected.service]}</strong>{" "}
                · ID {selected.itemId}
              </span>
            ) : (
              <span className="text-zinc-500">Noch kein Item ausgewählt.</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {error && <span className="text-xs text-red-600">{error}</span>}
            <Button disabled={!selected || loading} onClick={onNext}>
              {loading ? "Lege an…" : "Weiter zu Empfängern"}
            </Button>
          </div>
        </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RecipientPicker } from "@/components/recipient-picker";
import { Button } from "@/components/ui/button";

export default function NeuAusKontaktPage() {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onNext() {
    if (selectedIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const name = `Kampagne ${now.toISOString().slice(0, 10)} · ${selectedIds.length} Empfänger`;
      const res = await fetch("/api/dummy/sql/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          origin: "recipient",
          recipientIds: selectedIds,
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
            Richtung A · Schritt 1
          </div>
          <h1 className="mt-1 text-2xl font-semibold">Empfänger wählen</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Gezielte Suche im Empfänger-Stamm. Segment-Toggle filtert Neue,
            Bestandskunden oder alle werbbaren Kontakte.
          </p>
        </header>

        <RecipientPicker
          mode="select"
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />

        <div className="sticky bottom-6 mt-8 flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-zinc-700">
            {selectedIds.length === 0 ? (
              <span className="text-zinc-500">Keine Empfänger ausgewählt.</span>
            ) : (
              <span>
                <strong>{selectedIds.length}</strong>{" "}
                {selectedIds.length === 1 ? "Empfänger" : "Empfänger"} ausgewählt.
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {error && <span className="text-xs text-red-600">{error}</span>}
            <Button
              disabled={selectedIds.length === 0 || loading}
              onClick={onNext}
            >
              {loading ? "Lege an…" : "Weiter zur Auswahl"}
            </Button>
          </div>
        </div>
    </main>
  );
}

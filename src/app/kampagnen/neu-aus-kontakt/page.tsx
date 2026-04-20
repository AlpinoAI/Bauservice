"use client";

import { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { RecipientPicker } from "@/components/recipient-picker";
import { Button } from "@/components/ui/button";

export default function NeuAusKontaktPage() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [nextClicked, setNextClicked] = useState(false);

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-6xl px-6 py-10">
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
            {nextClicked && (
              <span className="text-xs text-amber-700">
                Review-Screen folgt in Subtask 4.
              </span>
            )}
            <Button
              disabled={selectedIds.length === 0}
              onClick={() => setNextClicked(true)}
            >
              Weiter zur Auswahl
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}

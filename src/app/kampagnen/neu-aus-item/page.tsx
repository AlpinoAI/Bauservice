"use client";

import { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { ItemPicker } from "@/components/item-picker";
import { Button } from "@/components/ui/button";
import { serviceLabels } from "@/lib/filter-options";
import type { Service } from "@/lib/types";

type Selection = { service: Service; itemId: number };

export default function NeuAusItemPage() {
  const [selected, setSelected] = useState<Selection | null>(null);
  const [nextClicked, setNextClicked] = useState(false);

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-6xl px-6 py-10">
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
            {nextClicked && (
              <span className="text-xs text-amber-700">
                Empfänger-Vorschlag + Review-Screen folgen in Subtask 4.
              </span>
            )}
            <Button disabled={!selected} onClick={() => setNextClicked(true)}>
              Weiter zu Empfängern
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}

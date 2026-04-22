"use client";

import { RecipientPicker } from "@/components/recipient-picker";
import { useStartCampaign } from "@/lib/use-start-campaign";
import type { Recipient } from "@/lib/types";

export default function EmpfaengerPage() {
  const { start, startingId } = useStartCampaign();
  const starting = typeof startingId === "number" ? startingId : null;

  function startFrom(r: Recipient) {
    void start(r.id, {
      name: `Kampagne für ${r.sprache === "it" ? r.nameIt : r.nameDe}`,
      origin: "recipient",
      recipientIds: [r.id],
    });
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Kontakte</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Read-only aus <code>VectorDB_Kontakte</code>. Opt-out und inaktive
          Kontakte sind serverseitig ausgeblendet. Pro Zeile kannst du direkt
          eine Kampagne für diesen Kontakt starten.
        </p>
      </header>
      <RecipientPicker
        mode="browse"
        onStartCampaign={startFrom}
        startingId={starting}
      />
    </main>
  );
}

"use client";

import { use } from "react";
import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";

export default function VersandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Demo-Modus:</strong> Versand-Screen folgt in Subtask 6. Die
          Kampagne <code>{id}</code> liegt als Draft vor — Mailjet ist
          in Phase 1 als No-Op-Stub verdrahtet.
        </div>
        <div className="mt-4 flex gap-2">
          <Link href={`/kampagnen/${id}`}>
            <Button variant="secondary">Zurück zum Review</Button>
          </Link>
          <Link href="/kampagnen">
            <Button>Alle Kampagnen</Button>
          </Link>
        </div>
      </main>
    </>
  );
}

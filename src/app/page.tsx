import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { LatestCampaigns } from "@/components/latest-campaigns";

export default function DashboardPage() {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Willkommen</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Starte eine neue Kampagne — entweder aus einem Kontakt oder aus einer
          neuen Ausschreibung, einem Projekt oder einer Konzession.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Link
            href="/kampagnen/neu-aus-kontakt"
            className="rounded-lg border border-zinc-200 bg-white p-6 transition hover:border-blue-500 hover:shadow-sm"
          >
            <div className="text-xs font-medium uppercase tracking-wide text-blue-600">
              Richtung A
            </div>
            <h2 className="mt-1 text-lg font-medium">Aus Kontakt</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Ich habe einen Kunden im Kopf — gezielte Suche im Empfänger-Stamm.
            </p>
          </Link>

          <Link
            href="/kampagnen/neu-aus-item"
            className="rounded-lg border border-zinc-200 bg-white p-6 transition hover:border-blue-500 hover:shadow-sm"
          >
            <div className="text-xs font-medium uppercase tracking-wide text-blue-600">
              Richtung B
            </div>
            <h2 className="mt-1 text-lg font-medium">Aus Item</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Neue Ausschreibungen, Projekte und Konzessionen chronologisch
              durchstöbern.
            </p>
          </Link>
        </div>

        <section className="mt-12">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Letzte Kampagnen
            </h2>
            <Link
              href="/kampagnen"
              className="text-sm text-blue-600 hover:underline"
            >
              Alle ansehen
            </Link>
          </div>
          <div className="mt-3">
            <LatestCampaigns limit={5} />
          </div>
        </section>
      </main>
    </>
  );
}

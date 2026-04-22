import Link from "next/link";
import { DashboardKpis } from "@/components/dashboard-kpis";
import { LatestCampaigns } from "@/components/latest-campaigns";
import { SuggestedCampaigns } from "@/components/suggested-campaigns";

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Übersicht deiner Bauservice-Aktivitäten.
        </p>
      </header>

      <SuggestedCampaigns />

      <DashboardKpis />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Letzte Kampagnen
          </h2>
          <LatestCampaigns limit={5} />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Schnellzugriff
          </h2>
          <div className="grid gap-2">
            <Link
              href="/kampagnen/neu-aus-item"
              className="rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-blue-500 hover:shadow-sm"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-blue-600">
                Empfohlen
              </div>
              <h3 className="mt-1 text-sm font-medium">Kampagne aus Service</h3>
              <p className="mt-1 text-xs text-zinc-600">
                Neue Ausschreibungen, Projekte oder Konzessionen durchstöbern.
                Empfänger kommen per Matching.
              </p>
            </Link>
            <Link
              href="/services"
              className="rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-blue-500 hover:shadow-sm"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Browse
              </div>
              <h3 className="mt-1 text-sm font-medium">Services-Übersicht</h3>
              <p className="mt-1 text-xs text-zinc-600">
                Alle vier Service-Quellen in einer Tabelle. Pro Zeile direkt
                starten.
              </p>
            </Link>
            <Link
              href="/empfaenger"
              className="rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-blue-500 hover:shadow-sm"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Browse
              </div>
              <h3 className="mt-1 text-sm font-medium">Empfänger-Stamm</h3>
              <p className="mt-1 text-xs text-zinc-600">
                Kontakte durchsuchen und filtern (read-only).
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

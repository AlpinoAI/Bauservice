import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-8 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Kampagnen-Performance und Statistiken.
        </p>
      </header>

      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center">
        <BarChart3 className="mx-auto text-zinc-400" size={40} />
        <h2 className="mt-4 text-lg font-medium">Kommt in Phase 2</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
          Öffnungs- und Click-Raten benötigen Tracking-Pixel und
          Mailjet-Webhooks. Beides wird nach der Phase-1-Abnahme angebunden.
        </p>
      </div>
    </main>
  );
}

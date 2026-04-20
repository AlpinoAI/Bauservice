import { TopNav } from "@/components/top-nav";

export default function NeuAusItemPage() {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Neue Kampagne — aus Item</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Schritt 1: Chronologische Liste neuer Items (Ausschreibung / Ergebnis
          / Projekt / Konzession).
        </p>
        <div className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          ItemPicker folgt in Subtask 3.
        </div>
      </main>
    </>
  );
}

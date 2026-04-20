import { TopNav } from "@/components/top-nav";

export default function EmpfaengerPage() {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Empfänger</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Read-only aus <code>VectorDB_Kontakte</code>.
        </p>
        <div className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          Empfänger-Liste folgt in Subtask 3.
        </div>
      </main>
    </>
  );
}

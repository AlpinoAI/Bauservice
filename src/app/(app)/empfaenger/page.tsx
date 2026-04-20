import { RecipientPicker } from "@/components/recipient-picker";

export default function EmpfaengerPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Kontakte</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Read-only aus <code>VectorDB_Kontakte</code>. Opt-out und inaktive
          Kontakte sind serverseitig ausgeblendet.
        </p>
      </header>
      <RecipientPicker mode="browse" />
    </main>
  );
}

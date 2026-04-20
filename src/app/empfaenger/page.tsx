import { TopNav } from "@/components/top-nav";
import { RecipientPicker } from "@/components/recipient-picker";

export default function EmpfaengerPage() {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Empfänger</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Read-only aus <code>VectorDB_Kontakte</code>. Opt-out und inaktive
            Kontakte sind serverseitig ausgeblendet.
          </p>
        </header>
        <RecipientPicker mode="browse" />
      </main>
    </>
  );
}

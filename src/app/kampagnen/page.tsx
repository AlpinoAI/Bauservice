import { TopNav } from "@/components/top-nav";

export default function KampagnenPage() {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Kampagnen</h1>
        <p className="mt-2 text-sm text-zinc-600">Status: Draft / Versandt.</p>
        <div className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          Kampagnen-Liste folgt in Subtask 6.
        </div>
      </main>
    </>
  );
}

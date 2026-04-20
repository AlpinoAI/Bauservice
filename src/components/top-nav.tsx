import Link from "next/link";

export function TopNav() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-sm font-semibold">
          Bauservice <span className="text-blue-600">Email</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/kampagnen"
            className="text-zinc-600 transition hover:text-zinc-900"
          >
            Kampagnen
          </Link>
          <Link
            href="/empfaenger"
            className="text-zinc-600 transition hover:text-zinc-900"
          >
            Empfänger
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-zinc-600 transition hover:text-zinc-900"
            >
              Abmelden
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}

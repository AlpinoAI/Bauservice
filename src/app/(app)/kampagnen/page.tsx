"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Campaign } from "@/lib/types";
import { serviceLabels } from "@/lib/filter-options";
import { cn } from "@/lib/utils";

type Tab = "alle" | "draft" | "sent";

export default function KampagnenPage() {
  const [tab, setTab] = useState<Tab>("alle");
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = tab === "alle" ? "" : `?status=${tab}`;
    fetch(`/api/dummy/sql/campaigns${q}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tab]);

  const tabs: { value: Tab; label: string }[] = [
    { value: "alle", label: "Alle" },
    { value: "draft", label: "Entwurf" },
    { value: "sent", label: "Versandt" },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-8">
        <header className="mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Kampagnen</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Alle erstellten Kampagnen in dieser Session.
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/kampagnen/neu-aus-item"
              className="group flex items-start gap-3 rounded-lg border-2 border-blue-600 bg-blue-600 p-4 text-white transition hover:bg-blue-700"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/15">
                <Building2 size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
                    Empfohlen
                  </span>
                  <Badge variant="amber" className="bg-amber-400 text-amber-900">
                    Szenario wählbar
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-2 font-semibold">
                  Aus Services
                  <ArrowRight
                    size={14}
                    className="transition group-hover:translate-x-0.5"
                  />
                </div>
                <p className="mt-0.5 text-xs text-white/85">
                  Ausschreibung, Ergebnis, Beschluss oder Baukonzession
                  auswählen. Empfänger kommen automatisch aus dem Matching.
                </p>
              </div>
            </Link>
            <Link
              href="/kampagnen/neu-aus-kontakt"
              className="group flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-blue-500 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600">
                <Users size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Gezielt
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 font-semibold text-zinc-900">
                  Aus Kontakt
                  <ArrowRight
                    size={14}
                    className="text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
                  />
                </div>
                <p className="mt-0.5 text-xs text-zinc-600">
                  Einzelne Empfänger im Stamm suchen und zusammenstellen. Nur
                  sinnvoll bei gezielter Ansprache weniger Firmen.
                </p>
              </div>
            </Link>
          </div>
        </header>

        <div className="mb-4 inline-flex gap-1 rounded-md border border-zinc-200 bg-white p-1">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={cn(
                "rounded px-3 py-1.5 text-sm font-medium transition",
                tab === t.value
                  ? "bg-blue-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white">
          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-500">
              Lade …
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-500">
              Keine Kampagnen in dieser Kategorie.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {items.map((c) => (
                <li key={c.id}>
                  <Link
                    href={
                      c.status === "draft"
                        ? `/kampagnen/${c.id}`
                        : `/kampagnen/${c.id}/versand`
                    }
                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition hover:bg-zinc-50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={c.status === "sent" ? "green" : "gray"}>
                          {c.status === "sent" ? "Versandt" : "Entwurf"}
                        </Badge>
                        <Badge variant="blue">
                          {c.origin === "recipient" ? "Aus Kontakt" : "Aus Services"}
                        </Badge>
                        {c.origin === "item" && c.itemRef && (
                          <Badge variant="amber">
                            {serviceLabels[c.itemRef.service]} · ID{" "}
                            {c.itemRef.itemId}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 font-medium text-zinc-900">
                        {c.name}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {new Date(c.createdAt).toLocaleString("de-DE")} ·{" "}
                        {c.recipientIds.length} Empfänger
                      </div>
                    </div>
                    <span className="text-xs text-zinc-400">
                      {c.status === "draft" ? "Bearbeiten →" : "Details →"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TopNav } from "@/components/top-nav";
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
    <>
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Kampagnen</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Alle erstellten Kampagnen in dieser Session.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/kampagnen/neu-aus-kontakt"
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium transition hover:border-blue-500"
            >
              Aus Kontakt
            </Link>
            <Link
              href="/kampagnen/neu-aus-item"
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Aus Item
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
                          Richtung {c.origin === "recipient" ? "A" : "B"}
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
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { BarChart3, Mails, Send, Users } from "lucide-react";
import type { Campaign, Recipient } from "@/lib/types";

type Kpi = {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number }>;
  sub?: string;
};

function Card({ kpi, loading }: { kpi: Kpi; loading: boolean }) {
  const Icon = kpi.icon;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-2 text-zinc-500">
        <Icon size={16} />
        <span className="text-xs font-medium uppercase tracking-wide">
          {kpi.label}
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-zinc-900">
        {loading ? "…" : kpi.value}
      </div>
      {kpi.sub && !loading && (
        <div className="mt-1 text-xs text-zinc-500">{kpi.sub}</div>
      )}
    </div>
  );
}

export function DashboardKpis() {
  const [loading, setLoading] = useState(true);
  const [recipients, setRecipients] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/dummy/sql/recipients?limit=200").then((r) => r.json()),
      fetch("/api/dummy/sql/campaigns").then((r) => r.json()),
    ])
      .then(([r, c]) => {
        setRecipients((r.items as Recipient[])?.length ?? 0);
        setCampaigns((c.items as Campaign[]) ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const draft = campaigns.filter((c) => c.status === "draft").length;
  const sent = campaigns.filter((c) => c.status === "sent").length;
  const sentEmails = campaigns
    .filter((c) => c.status === "sent")
    .reduce((acc, c) => acc + c.recipientIds.length, 0);

  const kpis: Kpi[] = [
    { label: "Kontakte", value: String(recipients), icon: Users, sub: "sichtbar (Opt-out gefiltert)" },
    { label: "Kampagnen", value: String(campaigns.length), icon: Mails, sub: `${draft} Entwurf · ${sent} Versandt` },
    { label: "E-Mails versandt", value: String(sentEmails), icon: Send, sub: "Demo-Versand, keine echten Mails" },
    { label: "Analytics", value: "—", icon: BarChart3, sub: "Öffnungs-/Click-Rate folgt in Phase 2" },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k) => (
        <Card key={k.label} kpi={k} loading={loading} />
      ))}
    </div>
  );
}

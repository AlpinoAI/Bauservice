import type { Campaign } from "@/lib/types";

const store: Campaign[] = [];

export function listCampaigns(filter?: { status?: "draft" | "sent" }): Campaign[] {
  if (!filter?.status) return store;
  return store.filter((c) => c.status === filter.status);
}

export function createCampaign(input: Omit<Campaign, "id" | "createdAt">): Campaign {
  const campaign: Campaign = {
    ...input,
    id: `camp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  store.push(campaign);
  return campaign;
}

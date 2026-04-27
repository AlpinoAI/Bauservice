import type { Campaign } from "@/lib/types";

const globalForCampaigns = globalThis as unknown as {
  __bauserviceCampaignStore?: Campaign[];
};
const store: Campaign[] =
  globalForCampaigns.__bauserviceCampaignStore ??
  (globalForCampaigns.__bauserviceCampaignStore = []);

export function listCampaigns(filter?: { status?: "draft" | "sent" }): Campaign[] {
  if (!filter?.status) return store;
  return store.filter((c) => c.status === filter.status);
}

export function findCampaign(id: string): Campaign | undefined {
  return store.find((c) => c.id === id);
}

export function createCampaign(
  input: Omit<Campaign, "id" | "createdAt">
): Campaign {
  const campaign: Campaign = {
    ...input,
    id: `camp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  store.push(campaign);
  return campaign;
}

export function markCampaignSent(id: string): Campaign | undefined {
  const c = findCampaign(id);
  if (!c) return undefined;
  c.status = "sent";
  return c;
}

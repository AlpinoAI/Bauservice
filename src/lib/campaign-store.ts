"use client";

import { create } from "zustand";
import type {
  Campaign,
  Example,
  Recipient,
  Service,
  Sprache,
} from "@/lib/types";

export type RecipientDraft = {
  recipientId: number;
  recipient: Recipient;
  sprache: Sprache;
  selectedExamples: Record<Service, number[]>;
  serviceEnabled: Record<Service, boolean>;
  overrides: { salutation?: string; intro?: string; cta?: string };
  skip: boolean;
};

type CampaignState = {
  campaignId: string | null;
  campaign: Campaign | null;
  drafts: Record<number, RecipientDraft>;
  examplesByService: Record<Service, Example[]>;
  activeRecipientId: number | null;
  renderCache: Record<number, { html: string; text: string }>;
  isDirty: boolean;
  loading: boolean;
};

type CampaignActions = {
  setCampaign: (c: Campaign) => void;
  setLoading: (loading: boolean) => void;
  addDraft: (draft: RecipientDraft) => void;
  setActiveRecipient: (id: number) => void;
  toggleService: (recipientId: number, service: Service) => void;
  setExamplesFor: (
    recipientId: number,
    service: Service,
    exampleIds: number[]
  ) => void;
  removeExample: (
    recipientId: number,
    service: Service,
    exampleId: number
  ) => void;
  addExample: (
    recipientId: number,
    service: Service,
    exampleId: number
  ) => void;
  setOverride: (
    recipientId: number,
    key: "salutation" | "intro" | "cta",
    value: string
  ) => void;
  toggleSkip: (recipientId: number) => void;
  addToPool: (service: Service, examples: Example[]) => void;
  setRender: (recipientId: number, html: string, text: string) => void;
  reset: () => void;
};

const emptyByService = <T,>(): Record<Service, T[]> => ({
  ausschreibungen: [],
  ergebnisse: [],
  beschluesse: [],
  baukonzessionen: [],
});

const emptyEnabled = (): Record<Service, boolean> => ({
  ausschreibungen: true,
  ergebnisse: true,
  beschluesse: true,
  baukonzessionen: true,
});

const initialState: CampaignState = {
  campaignId: null,
  campaign: null,
  drafts: {},
  examplesByService: emptyByService<Example>(),
  activeRecipientId: null,
  renderCache: {},
  isDirty: false,
  loading: false,
};

export const useCampaignStore = create<CampaignState & CampaignActions>(
  (set) => ({
    ...initialState,

    setCampaign: (c) => set({ campaignId: c.id, campaign: c }),
    setLoading: (loading) => set({ loading }),

    addDraft: (draft) =>
      set((s) => ({
        drafts: { ...s.drafts, [draft.recipientId]: draft },
        activeRecipientId: s.activeRecipientId ?? draft.recipientId,
      })),

    setActiveRecipient: (id) => set({ activeRecipientId: id }),

    toggleService: (rid, svc) =>
      set((s) => {
        const d = s.drafts[rid];
        if (!d) return s;
        return {
          drafts: {
            ...s.drafts,
            [rid]: {
              ...d,
              serviceEnabled: {
                ...d.serviceEnabled,
                [svc]: !d.serviceEnabled[svc],
              },
            },
          },
          isDirty: true,
        };
      }),

    setExamplesFor: (rid, svc, ids) =>
      set((s) => {
        const d = s.drafts[rid];
        if (!d) return s;
        return {
          drafts: {
            ...s.drafts,
            [rid]: {
              ...d,
              selectedExamples: { ...d.selectedExamples, [svc]: ids },
            },
          },
          isDirty: true,
        };
      }),

    removeExample: (rid, svc, exId) =>
      set((s) => {
        const d = s.drafts[rid];
        if (!d) return s;
        return {
          drafts: {
            ...s.drafts,
            [rid]: {
              ...d,
              selectedExamples: {
                ...d.selectedExamples,
                [svc]: d.selectedExamples[svc].filter((x) => x !== exId),
              },
            },
          },
          isDirty: true,
        };
      }),

    addExample: (rid, svc, exId) =>
      set((s) => {
        const d = s.drafts[rid];
        if (!d || d.selectedExamples[svc].includes(exId)) return s;
        return {
          drafts: {
            ...s.drafts,
            [rid]: {
              ...d,
              selectedExamples: {
                ...d.selectedExamples,
                [svc]: [...d.selectedExamples[svc], exId],
              },
            },
          },
          isDirty: true,
        };
      }),

    setOverride: (rid, key, value) =>
      set((s) => {
        const d = s.drafts[rid];
        if (!d) return s;
        const next = { ...d.overrides, [key]: value };
        if (!value) delete next[key];
        return {
          drafts: { ...s.drafts, [rid]: { ...d, overrides: next } },
          isDirty: true,
        };
      }),

    toggleSkip: (rid) =>
      set((s) => {
        const d = s.drafts[rid];
        if (!d) return s;
        return {
          drafts: { ...s.drafts, [rid]: { ...d, skip: !d.skip } },
          isDirty: true,
        };
      }),

    addToPool: (svc, examples) =>
      set((s) => {
        const existing = s.examplesByService[svc];
        const existingIds = new Set(existing.map((e) => e.id));
        const fresh = examples.filter((e) => !existingIds.has(e.id));
        return {
          examplesByService: {
            ...s.examplesByService,
            [svc]: [...existing, ...fresh],
          },
        };
      }),

    setRender: (rid, html, text) =>
      set((s) => ({ renderCache: { ...s.renderCache, [rid]: { html, text } } })),

    reset: () => set(initialState),
  })
);

export function buildEmptyDraft(recipient: Recipient): RecipientDraft {
  return {
    recipientId: recipient.id,
    recipient,
    sprache: recipient.sprache,
    selectedExamples: emptyByService<number>(),
    serviceEnabled: emptyEnabled(),
    overrides: {},
    skip: false,
  };
}

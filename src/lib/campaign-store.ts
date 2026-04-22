"use client";

import { create } from "zustand";
import type {
  Campaign,
  EmailOverrides,
  Example,
  Recipient,
  ScenarioId,
  Service,
  Sprache,
  WithScore,
} from "@/lib/types";

export type PoolExample = WithScore<Example>;

export type RecipientDraft = {
  recipientId: number;
  recipient: Recipient;
  sprache: Sprache;
  scenarioId: ScenarioId;
  selectedExamples: Record<Service, number[]>;
  serviceEnabled: Record<Service, boolean>;
  overrides: EmailOverrides;
  skip: boolean;
};

export type FeedbackVerdict = "passt" | "passt_nicht";

/** feedback[recipientId][service][exampleId] = "passt" | "passt_nicht" */
export type FeedbackMap = Record<
  number,
  Partial<Record<Service, Record<number, FeedbackVerdict>>>
>;

type CampaignState = {
  campaignId: string | null;
  campaign: Campaign | null;
  drafts: Record<number, RecipientDraft>;
  examplesByService: Record<Service, PoolExample[]>;
  activeRecipientId: number | null;
  renderCache: Record<number, { html: string; text: string; subject: string }>;
  feedback: FeedbackMap;
  isDirty: boolean;
  loading: boolean;
};

type CampaignActions = {
  setCampaign: (c: Campaign) => void;
  setDraftScenario: (recipientId: number, id: ScenarioId) => void;
  setLoading: (loading: boolean) => void;
  addDraft: (draft: RecipientDraft) => void;
  setActiveRecipient: (id: number) => void;
  toggleService: (recipientId: number, service: Service) => void;
  setExamplesFor: (
    recipientId: number,
    service: Service,
    exampleIds: number[]
  ) => void;
  setExampleCount: (
    recipientId: number,
    service: Service,
    count: number
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
  setOverride: <K extends keyof EmailOverrides>(
    recipientId: number,
    key: K,
    value: EmailOverrides[K]
  ) => void;
  toggleSkip: (recipientId: number) => void;
  addToPool: (service: Service, examples: PoolExample[]) => void;
  setRender: (
    recipientId: number,
    html: string,
    text: string,
    subject: string
  ) => void;
  setFeedback: (
    recipientId: number,
    service: Service,
    exampleId: number,
    verdict: FeedbackVerdict | null
  ) => void;
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
  examplesByService: emptyByService<PoolExample>(),
  activeRecipientId: null,
  renderCache: {},
  feedback: {},
  isDirty: false,
  loading: false,
};

export const useCampaignStore = create<CampaignState & CampaignActions>(
  (set) => ({
    ...initialState,

    setCampaign: (c) => set({ campaignId: c.id, campaign: c }),
    setDraftScenario: (rid, id) =>
      set((s) => {
        const d = s.drafts[rid];
        if (!d || d.scenarioId === id) return s;
        const { [rid]: _removed, ...rest } = s.renderCache;
        return {
          drafts: { ...s.drafts, [rid]: { ...d, scenarioId: id } },
          renderCache: rest,
          isDirty: true,
        };
      }),
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

    setExampleCount: (rid, svc, count) =>
      set((s) => {
        const d = s.drafts[rid];
        if (!d || !d.serviceEnabled[svc]) return s;
        const clamped = Math.max(0, Math.min(count, s.examplesByService[svc].length));
        const current = d.selectedExamples[svc];
        if (clamped === current.length) return s;
        let next: number[];
        if (clamped < current.length) {
          next = current.slice(0, clamped);
        } else {
          const seen = new Set(current);
          const topUp = s.examplesByService[svc]
            .filter((e) => !seen.has(e.id))
            .slice(0, clamped - current.length)
            .map((e) => e.id);
          next = [...current, ...topUp];
        }
        return {
          drafts: {
            ...s.drafts,
            [rid]: {
              ...d,
              selectedExamples: { ...d.selectedExamples, [svc]: next },
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
        const next: EmailOverrides = { ...d.overrides };
        if (value === undefined || value === "") {
          delete next[key];
        } else {
          next[key] = value;
        }
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

    setRender: (rid, html, text, subject) =>
      set((s) => ({
        renderCache: { ...s.renderCache, [rid]: { html, text, subject } },
      })),

    setFeedback: (rid, svc, exId, verdict) =>
      set((s) => {
        const byRecipient = s.feedback[rid] ?? {};
        const byService = { ...(byRecipient[svc] ?? {}) };
        if (verdict === null) {
          delete byService[exId];
        } else {
          byService[exId] = verdict;
        }
        return {
          feedback: {
            ...s.feedback,
            [rid]: { ...byRecipient, [svc]: byService },
          },
        };
      }),

    reset: () => set(initialState),
  })
);

export function buildEmptyDraft(
  recipient: Recipient,
  scenarioId: ScenarioId = "D"
): RecipientDraft {
  return {
    recipientId: recipient.id,
    recipient,
    sprache: recipient.sprache,
    scenarioId,
    selectedExamples: emptyByService<number>(),
    serviceEnabled: emptyEnabled(),
    overrides: {},
    skip: false,
  };
}

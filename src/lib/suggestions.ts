import type { Example, ScenarioId, Service } from "@/lib/types";

export type Suggestion = {
  scenarioId: ScenarioId;
  service: Service;
  newItems: number;
  latestItem: Example | null;
  since: string;
};

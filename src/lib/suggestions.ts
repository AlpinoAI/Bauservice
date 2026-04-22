import type { Example, Recipient, ScenarioId } from "@/lib/types";

export type Suggestion = {
  id: string;
  recipient: Pick<Recipient, "id" | "nameDe" | "nameIt" | "sprache" | "bezirkDe" | "gewerke">;
  item: Example;
  score: number;
  reason: string;
  scenarioId: ScenarioId;
};

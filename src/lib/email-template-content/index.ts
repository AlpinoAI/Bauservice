import type { Sprache } from "@/lib/types";
import { deContent } from "./de";
import { itContent } from "./it";
import type { ContentPack } from "./types";

export type { ContentPack, ScenarioContent, Signature, MetaLabels } from "./types";
export { DESCRIPTION_CUT_CHARS } from "./types";
export { deContent, itContent };

export function getContent(sprache: Sprache): ContentPack {
  return sprache === "it" ? itContent : deContent;
}

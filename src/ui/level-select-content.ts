import type { LevelCatalogEntry } from "../game/types";

export function getLevelCardStatsStyle() {
  return {
    fontSize: "15px",
    lineSpacing: 4
  } as const;
}

export function getLevelCardStatsText(entry: LevelCatalogEntry) {
  return [
    `GOAL ${(entry.level.completionPct * 100).toFixed(0)}%`,
    `HAY ${entry.level.resourceBudget.hayCells}`,
    `TNT ${entry.level.resourceBudget.tntCount}`
  ].join("\n");
}

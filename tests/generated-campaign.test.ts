import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  GENERATED_CAMPAIGN_LEVELS,
  GENERATED_CAMPAIGN_NAME_MAP_EN,
  GENERATED_CAMPAIGN_NAME_MAP_ZH_HANS
} from "../src/game/generated-campaign";
import { solveDeterministicLevel } from "../src/game/campaign-solver";
import { validateLevel } from "../src/game/level-io";
import type { LevelDefinition, TerrainType } from "../src/game/types";

function cloneLevel(level: LevelDefinition): LevelDefinition {
  return {
    ...level,
    resourceBudget: { ...level.resourceBudget },
    fireSources: level.fireSources.map((item) => ({ ...item })),
    structures: level.structures.map((structure) => ({
      ...structure,
      origin: { ...structure.origin },
      size: { ...structure.size }
    })),
    terrainTiles: level.terrainTiles.map((tile) => ({ ...tile }))
  };
}

function hasFreeformTerrain(level: LevelDefinition, terrainType: TerrainType) {
  const relevant = level.terrainTiles.filter((tile) => tile.type === terrainType);
  if (relevant.length < 8) {
    return false;
  }

  const uniqueX = new Set(relevant.map((tile) => tile.x));
  const uniqueY = new Set(relevant.map((tile) => tile.y));
  if (uniqueX.size < 2 || uniqueY.size < 2) {
    return false;
  }

  const tileKeys = new Set(relevant.map((tile) => `${tile.x},${tile.y}`));
  return relevant.some((tile) => {
    const hasHorizontal = tileKeys.has(`${tile.x - 1},${tile.y}`) || tileKeys.has(`${tile.x + 1},${tile.y}`);
    const hasVertical = tileKeys.has(`${tile.x},${tile.y - 1}`) || tileKeys.has(`${tile.x},${tile.y + 1}`);
    return hasHorizontal && hasVertical;
  });
}

function parseReportRows() {
  const report = readFileSync(new URL("../docs/generated-campaign-report.md", import.meta.url), "utf8");
  const rows = report.split("\n").filter((line) => /^\| \d+ \|/.test(line));
  const parsed = rows.map((line) => line.split("|").map((cell) => cell.trim()).filter(Boolean));
  return { report, rows, parsed };
}

describe("generated campaign artifact", () => {
  it("ships exactly 20 built-in campaign levels with sequential ids and sane goals", () => {
    expect(GENERATED_CAMPAIGN_LEVELS).toHaveLength(20);

    GENERATED_CAMPAIGN_LEVELS.forEach((level, index) => {
      expect(level.id).toBe(`campaign-${String(index + 1).padStart(3, "0")}`);
      expect(level.completionPct).toBeGreaterThanOrEqual(0.5);
      expect(level.completionPct).toBeLessThanOrEqual(1);
    });

    expect(GENERATED_CAMPAIGN_LEVELS.some((level) => level.completionPct < 1)).toBe(true);
    expect(GENERATED_CAMPAIGN_LEVELS[19].completionPct).toBe(1);
  });

  it("uses the first 10 levels as a mechanic tutorial in the requested order", () => {
    GENERATED_CAMPAIGN_LEVELS.slice(0, 2).forEach((level) => {
      expect(level.terrainTiles).toHaveLength(0);
      expect(level.resourceBudget.tntCount).toBe(0);
    });

    GENERATED_CAMPAIGN_LEVELS.slice(2, 4).forEach((level) => {
      expect(level.terrainTiles).toHaveLength(0);
      expect(level.resourceBudget.tntCount).toBeGreaterThan(0);
    });

    GENERATED_CAMPAIGN_LEVELS.slice(4, 6).forEach((level) => {
      expect(level.terrainTiles.some((tile) => tile.type === "deepWater")).toBe(true);
      expect(level.terrainTiles.every((tile) => tile.type === "deepWater")).toBe(true);
      expect(level.resourceBudget.tntCount).toBeGreaterThanOrEqual(0);
    });

    GENERATED_CAMPAIGN_LEVELS.slice(6, 8).forEach((level) => {
      expect(level.terrainTiles.some((tile) => tile.type === "wetTerrain")).toBe(true);
      expect(level.terrainTiles.some((tile) => tile.type === "deepWater")).toBe(false);
      expect(level.terrainTiles.some((tile) => tile.type === "wall")).toBe(false);
    });

    GENERATED_CAMPAIGN_LEVELS.slice(8, 10).forEach((level) => {
      expect(level.terrainTiles.some((tile) => tile.type === "wall")).toBe(true);
    });
  });

  it("turns levels 11-20 into harder final tests with more mechanic mixing", () => {
    const finalTestLevels = GENERATED_CAMPAIGN_LEVELS.slice(10);
    const multiTerrainCount = finalTestLevels.filter(
      (level) => new Set(level.terrainTiles.map((tile) => tile.type)).size >= 2
    ).length;

    expect(multiTerrainCount).toBeGreaterThanOrEqual(5);
    expect(finalTestLevels[finalTestLevels.length - 1].completionPct).toBeGreaterThanOrEqual(0.95);
  });

  it("keeps obstacle shapes freeform across the campaign", () => {
    GENERATED_CAMPAIGN_LEVELS.forEach((level) => {
      const terrainTypes = new Set(level.terrainTiles.map((tile) => tile.type));
      terrainTypes.forEach((terrainType) => {
        expect(hasFreeformTerrain(level, terrainType)).toBe(true);
      });
    });
  });

  it(
    "keeps TNT materially useful where TNT-focused levels expect it",
    () => {
      const tntFocusedLevels = GENERATED_CAMPAIGN_LEVELS.filter((level) => level.resourceBudget.tntCount > 0).slice(0, 2);
      expect(tntFocusedLevels.length).toBeGreaterThanOrEqual(2);

      for (const level of tntFocusedLevels) {
        const solved = solveDeterministicLevel(level);
        const tntPreferred =
          [...solved.frontier]
            .filter((solution) => solution.tntCount > 0)
            .sort(
              (left, right) =>
                left.hayCells - right.hayCells ||
                left.tntCount - right.tntCount ||
                left.weightedCost - right.weightedCost
            )[0] ?? null;

        expect(tntPreferred).not.toBeNull();

        const withoutTnt = cloneLevel(level);
        withoutTnt.resourceBudget.tntCount = 0;
        const hayOnly = solveDeterministicLevel(withoutTnt).preferred;

        expect(hayOnly).not.toBeNull();
        expect(hayOnly!.hayCells).toBeGreaterThanOrEqual(tntPreferred!.hayCells + 2);
      }
    },
    15000
  );

  it("keeps every generated level valid, localized, and mirrored in an ordered report", () => {
    GENERATED_CAMPAIGN_LEVELS.forEach((level) => {
      expect(validateLevel(level, "en")).toEqual([]);
      expect(GENERATED_CAMPAIGN_NAME_MAP_EN[level.id]).toBeTruthy();
      expect(GENERATED_CAMPAIGN_NAME_MAP_ZH_HANS[level.id]).toBeTruthy();
    });

    const { report, rows, parsed } = parseReportRows();
    expect(report).toContain("Replay");
    expect(rows).toHaveLength(20);
    expect(rows.some((line) => line.includes("50%"))).toBe(true);
    expect(rows.some((line) => line.includes("100%"))).toBe(true);

    const replayRates = parsed.map((cells) => Number.parseInt(cells[11], 10));
    const difficulties = parsed.map((cells) => Number.parseFloat(cells[12]));

    expect(Math.min(...replayRates)).toBeGreaterThanOrEqual(66);
    for (let index = 11; index < difficulties.length; index += 1) {
      expect(difficulties[index] + 0.01).toBeGreaterThanOrEqual(difficulties[index - 1]);
    }
    expect(difficulties[9]).toBeLessThan(difficulties[10]);
    expect(difficulties[19]).toBeGreaterThanOrEqual(0.5);
  });
});

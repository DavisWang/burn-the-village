import { describe, expect, it } from "vitest";

import { solveDeterministicLevel } from "../src/game/campaign-solver";
import type { LevelDefinition } from "../src/game/types";

function makeLevel(overrides: Partial<LevelDefinition> = {}): LevelDefinition {
  return {
    id: "solver-test",
    name: "SOLVER TEST",
    gridSize: 32,
    resourceBudget: { hayCells: 0, tntCount: 0 },
    completionPct: 1,
    fireSources: [{ x: 1, y: 16 }],
    structures: [
      {
        id: "hut-a",
        type: "hut",
        origin: { x: 25, y: 15 },
        size: { x: 3, y: 3 },
        maxHp: 4
      }
    ],
    terrainTiles: [],
    ...overrides
  };
}

describe("campaign solver", () => {
  it("finds a hay-only solution on an open map", () => {
    const result = solveDeterministicLevel(makeLevel());

    expect(result.preferred).not.toBeNull();
    expect(result.preferred?.hayCells).toBeGreaterThan(0);
    expect(result.preferred?.tntCount).toBe(0);
  });

  it("exposes a TNT-enabled frontier option for a split structure cluster", () => {
    const result = solveDeterministicLevel(
      makeLevel({
        structures: [
          {
            id: "house-a",
            type: "house",
            origin: { x: 22, y: 7 },
            size: { x: 5, y: 5 },
            maxHp: 6
          },
          {
            id: "house-b",
            type: "house",
            origin: { x: 22, y: 20 },
            size: { x: 5, y: 5 },
            maxHp: 6
          }
        ]
      })
    );

    expect(result.frontier.some((solution) => solution.tntCount > 0)).toBe(true);
  });

  it("treats wet terrain as a more expensive route than dry ground", () => {
    const wetLevel = makeLevel({
      terrainTiles: Array.from({ length: 5 }, (_, index) => ({
        x: 12 + index,
        y: 16,
        type: "wetTerrain" as const
      }))
    });
    const dryLevel = makeLevel();

    const wet = solveDeterministicLevel(wetLevel).preferred;
    const dry = solveDeterministicLevel(dryLevel).preferred;

    expect(wet).not.toBeNull();
    expect(dry).not.toBeNull();
    expect(wet!.hayCells).toBeGreaterThan(dry!.hayCells);
  });

  it("finds a TNT breach option on a wall-blocked route", () => {
    const result = solveDeterministicLevel(
      makeLevel({
        structures: [
          {
            id: "hut-a",
            type: "hut",
            origin: { x: 25, y: 15 },
            size: { x: 3, y: 3 },
            maxHp: 4
          }
        ],
        terrainTiles: Array.from({ length: 32 }, (_, y) =>
          y >= 4 && y <= 6
            ? null
            : {
                x: 14,
                y,
                type: "wall" as const
              }
        ).filter((tile): tile is { x: number; y: number; type: "wall" } => tile !== null)
      })
    );

    expect(result.frontier.some((solution) => solution.tntCount > 0)).toBe(true);
  });

  it("can solve for a cheaper subset when the goal is below 100 percent", () => {
    const fullGoal = solveDeterministicLevel(
      makeLevel({
        structures: [
          {
            id: "hut-a",
            type: "hut",
            origin: { x: 25, y: 3 },
            size: { x: 3, y: 3 },
            maxHp: 4
          },
          {
            id: "house-a",
            type: "house",
            origin: { x: 20, y: 13 },
            size: { x: 5, y: 5 },
            maxHp: 6
          },
          {
            id: "hut-b",
            type: "hut",
            origin: { x: 25, y: 24 },
            size: { x: 3, y: 3 },
            maxHp: 4
          }
        ],
        completionPct: 1
      })
    );

    const partialGoal = solveDeterministicLevel(
      makeLevel({
        structures: [
          {
            id: "hut-a",
            type: "hut",
            origin: { x: 25, y: 3 },
            size: { x: 3, y: 3 },
            maxHp: 4
          },
          {
            id: "house-a",
            type: "house",
            origin: { x: 20, y: 13 },
            size: { x: 5, y: 5 },
            maxHp: 6
          },
          {
            id: "hut-b",
            type: "hut",
            origin: { x: 25, y: 24 },
            size: { x: 3, y: 3 },
            maxHp: 4
          }
        ],
        completionPct: 0.5
      })
    );

    expect(fullGoal.preferred).not.toBeNull();
    expect(partialGoal.preferred).not.toBeNull();
    expect(partialGoal.preferred!.hayCells).toBeLessThan(fullGoal.preferred!.hayCells);
    expect(partialGoal.preferred!.targetedStructureIds.length).toBeLessThan(
      fullGoal.preferred!.targetedStructureIds.length
    );
  });

  it("returns no preferred solution when a distant structure is sealed behind deep water", () => {
    const result = solveDeterministicLevel(
      makeLevel({
        fireSources: [{ x: 1, y: 1 }],
        structures: [
          {
            id: "hut-a",
            type: "hut",
            origin: { x: 27, y: 27 },
            size: { x: 3, y: 3 },
            maxHp: 4
          }
        ],
        terrainTiles: Array.from({ length: 32 * 6 }, (_, index) => ({
          x: 10 + (index % 6),
          y: Math.floor(index / 6),
          type: "deepWater" as const
        }))
      })
    );

    expect(result.preferred).toBeNull();
  });
});

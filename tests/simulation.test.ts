import { describe, expect, it } from "vitest";

import { getBrushFootprint } from "../src/game/brushes";
import { parseLevelFile, serializeLevel, validateLevel } from "../src/game/level-io";
import {
  applyHayBrush,
  createSimulation,
  getMedalDestructionThresholds,
  placeTnt,
  resetSimulation,
  stepSimulation
} from "../src/game/simulation";
import type { LevelDefinition } from "../src/game/types";

function makeLevel(overrides: Partial<LevelDefinition> = {}): LevelDefinition {
  const base: LevelDefinition = {
    id: "test-level",
    name: "TEST LEVEL",
    gridSize: 32,
    resourceBudget: { hayCells: 4, tntCount: 1 },
    completionPct: 0.5,
    fireSources: [{ x: 0, y: 0 }],
    structures: [
      {
        id: "s-1",
        type: "hut",
        origin: { x: 28, y: 28 },
        size: { x: 1, y: 1 },
        maxHp: 1
      }
    ],
    terrainTiles: []
  };
  return {
    ...base,
    ...overrides
  };
}

describe("simulation rules", () => {
  it("fails immediately when both hay and TNT are depleted before success", () => {
    const level = makeLevel({
      resourceBudget: { hayCells: 1, tntCount: 0 }
    });
    const state = createSimulation(level, 5);
    const next = applyHayBrush(state, { x: 6, y: 6 }, 0);
    expect(next.hayRemaining).toBe(0);
    expect(next.outcome).toBe("failed");
  });

  it("resolves a locked success once no transient fire remains", () => {
    const state = createSimulation(makeLevel(), 9);
    state.outcome = "successLocked";
    const next = stepSimulation(state);
    expect(next.outcome).toBe("successResolved");
  });

  it("lets TNT explode while the run is still active", () => {
    const state = createSimulation(makeLevel({ resourceBudget: { hayCells: 1, tntCount: 1 } }), 11);
    const planted = placeTnt(state, { x: 1, y: 0 });
    const afterFirstTick = stepSimulation(planted);
    const afterSecondTick = stepSimulation(afterFirstTick);

    expect(afterFirstTick.grid[0][1].lifecycle).toBe("fuse");
    expect(afterSecondTick.grid[0][1].lifecycle).toBe("spent");
    expect(afterSecondTick.activeExplosions.length).toBeGreaterThan(0);
  });

  it("does not fail when the last TNT is placed next to a fire source", () => {
    const state = createSimulation(makeLevel({ resourceBudget: { hayCells: 1, tntCount: 1 } }), 12);
    const spentHay = applyHayBrush(state, { x: 10, y: 10 }, 0);

    expect(spentHay.hayRemaining).toBe(0);

    const planted = placeTnt(spentHay, { x: 1, y: 0 });
    expect(planted.tntRemaining).toBe(0);
    expect(planted.outcome).toBe("active");

    const afterTick = stepSimulation(planted);
    expect(afterTick.grid[0][1].lifecycle).toBe("fuse");
    expect(afterTick.outcome).toBe("active");
  });

  it("uses a 2x2 top-left anchored medium hay brush", () => {
    const state = createSimulation(makeLevel({ resourceBudget: { hayCells: 10, tntCount: 0 } }), 13);
    const next = applyHayBrush(state, { x: 5, y: 5 }, 1);

    expect(
      [
        next.grid[5][5].material,
        next.grid[5][6].material,
        next.grid[6][5].material,
        next.grid[6][6].material
      ]
    ).toEqual(["hay", "hay", "hay", "hay"]);
    expect(next.grid[4][4].material).toBe("empty");
    expect(next.hayRemaining).toBe(6);
  });

  it("rolls a new seed on reset", () => {
    const state = createSimulation(makeLevel(), 42);
    const reset = resetSimulation(state);
    expect(reset.seed).not.toBe(state.seed);
  });

  it("allows placing fresh hay and TNT on burned ground", () => {
    const state = createSimulation(makeLevel({ resourceBudget: { hayCells: 2, tntCount: 2 } }), 19);
    state.grid[5][5] = {
      ...state.grid[5][5],
      material: "hay",
      lifecycle: "ash"
    };

    const withHay = applyHayBrush(state, { x: 5, y: 5 }, 0);
    expect(withHay.grid[5][5].material).toBe("hay");
    expect(withHay.grid[5][5].lifecycle).toBe("idle");

    withHay.grid[5][5] = {
      ...withHay.grid[5][5],
      material: "tnt",
      lifecycle: "spent"
    };
    const withTnt = placeTnt(withHay, { x: 5, y: 5 });
    expect(withTnt.grid[5][5].material).toBe("tnt");
    expect(withTnt.grid[5][5].lifecycle).toBe("idle");
  });

  it("allows placing hay and TNT on structure rubble", () => {
    const state = createSimulation(makeLevel({ resourceBudget: { hayCells: 2, tntCount: 2 } }), 20);
    state.grid[5][5] = {
      ...state.grid[5][5],
      material: "structure",
      lifecycle: "rubble",
      hp: 0,
      maxHp: 1,
      structureId: "ruin-a",
      structureType: "hut"
    };

    const withHay = applyHayBrush(state, { x: 5, y: 5 }, 0);
    expect(withHay.grid[5][5].material).toBe("hay");
    expect(withHay.grid[5][5].lifecycle).toBe("idle");

    withHay.grid[5][5] = {
      ...withHay.grid[5][5],
      material: "structure",
      lifecycle: "rubble",
      hp: 0,
      maxHp: 1,
      structureId: "ruin-a",
      structureType: "hut"
    };
    const withTnt = placeTnt(withHay, { x: 5, y: 5 });
    expect(withTnt.grid[5][5].material).toBe("tnt");
    expect(withTnt.grid[5][5].lifecycle).toBe("idle");
  });

  it("rejects hay and TNT placement on deep water", () => {
    const state = createSimulation(
      makeLevel({
        resourceBudget: { hayCells: 2, tntCount: 1 },
        terrainTiles: [{ x: 4, y: 4, type: "deepWater" }]
      }),
      24
    );

    const withHay = applyHayBrush(state, { x: 4, y: 4 }, 0);
    expect(withHay.hayRemaining).toBe(state.hayRemaining);
    expect(withHay.grid[4][4].material).toBe("empty");
    expect(withHay.grid[4][4].terrain).toBe("deepWater");

    const withTnt = placeTnt(withHay, { x: 4, y: 4 });
    expect(withTnt.tntRemaining).toBe(withHay.tntRemaining);
    expect(withTnt.grid[4][4].material).toBe("empty");
  });

  it("reduces hay ignition chance on wet terrain under the seeded simulation", () => {
    const dryState = createSimulation(
      makeLevel({
        resourceBudget: { hayCells: 1, tntCount: 0 }
      }),
      4
    );
    const wetState = createSimulation(
      makeLevel({
        resourceBudget: { hayCells: 1, tntCount: 0 },
        terrainTiles: [{ x: 1, y: 0, type: "wetTerrain" }]
      }),
      4
    );

    const dryAfterTick = stepSimulation(applyHayBrush(dryState, { x: 1, y: 0 }, 0));
    const wetAfterTick = stepSimulation(applyHayBrush(wetState, { x: 1, y: 0 }, 0));

    expect(dryAfterTick.grid[0][1].lifecycle).toBe("burning");
    expect(wetAfterTick.grid[0][1].lifecycle).toBe("idle");
    expect(wetAfterTick.grid[0][1].terrain).toBe("wetTerrain");
  });

  it("rejects placement on intact walls and keeps them from igniting", () => {
    const state = createSimulation(
      makeLevel({
        resourceBudget: { hayCells: 1, tntCount: 1 },
        terrainTiles: [{ x: 1, y: 0, type: "wall" }],
        structures: [
          {
            id: "s-1",
            type: "hut",
            origin: { x: 2, y: 0 },
            size: { x: 1, y: 1 },
            maxHp: 1
          }
        ]
      }),
      25
    );

    const withHay = applyHayBrush(state, { x: 1, y: 0 }, 0);
    expect(withHay.hayRemaining).toBe(state.hayRemaining);
    expect(withHay.grid[0][1].terrain).toBe("wall");
    expect(withHay.grid[0][1].material).toBe("empty");

    const withTnt = placeTnt(withHay, { x: 1, y: 0 });
    expect(withTnt.tntRemaining).toBe(withHay.tntRemaining);

    const afterTick = stepSimulation(withTnt);
    expect(afterTick.grid[0][1].terrain).toBe("wall");
    expect(afterTick.grid[0][2].lifecycle).toBe("idle");
  });

  it("breaches walls hit by TNT and opens them for later placement", () => {
    const state = createSimulation(
      makeLevel({
        resourceBudget: { hayCells: 1, tntCount: 1 },
        terrainTiles: [{ x: 2, y: 0, type: "wall" }]
      }),
      26
    );

    const planted = placeTnt(state, { x: 1, y: 0 });
    const afterFirstTick = stepSimulation(planted);
    const afterSecondTick = stepSimulation(afterFirstTick);

    expect(afterSecondTick.grid[0][2].terrain).toBe("ground");

    const afterBreach = applyHayBrush(afterSecondTick, { x: 2, y: 0 }, 0);
    expect(afterBreach.grid[0][2].material).toBe("hay");
  });

  it("does not let a single blast affect targets behind an intact wall", () => {
    const state = createSimulation(
      makeLevel({
        resourceBudget: { hayCells: 0, tntCount: 1 },
        fireSources: [{ x: 0, y: 1 }],
        terrainTiles: [{ x: 2, y: 1, type: "wall" }],
        structures: [
          {
            id: "s-1",
            type: "hut",
            origin: { x: 3, y: 1 },
            size: { x: 1, y: 1 },
            maxHp: 2
          }
        ]
      }),
      27
    );

    const planted = placeTnt(state, { x: 1, y: 1 });
    const afterExplosion = stepSimulation(stepSimulation(planted));

    expect(afterExplosion.grid[1][2].terrain).toBe("ground");
    expect(afterExplosion.grid[1][3].hp).toBe(2);
    expect(afterExplosion.grid[1][3].lifecycle).toBe("idle");
  });

  it("does not let TNT blast through deep water", () => {
    const state = createSimulation(
      makeLevel({
        resourceBudget: { hayCells: 0, tntCount: 1 },
        fireSources: [{ x: 0, y: 1 }],
        terrainTiles: [{ x: 2, y: 1, type: "deepWater" }],
        structures: [
          {
            id: "s-1",
            type: "hut",
            origin: { x: 3, y: 1 },
            size: { x: 1, y: 1 },
            maxHp: 2
          }
        ]
      }),
      28
    );

    const planted = placeTnt(state, { x: 1, y: 1 });
    const afterExplosion = stepSimulation(stepSimulation(planted));

    expect(afterExplosion.grid[1][2].terrain).toBe("deepWater");
    expect(afterExplosion.grid[1][3].hp).toBe(2);
    expect(afterExplosion.grid[1][3].lifecycle).toBe("idle");
  });

  it("awards medals from destruction percentage thresholds", () => {
    const level = makeLevel({
      structures: [
        {
          id: "s-1",
          type: "hut",
          origin: { x: 10, y: 10 },
          size: { x: 10, y: 1 },
          maxHp: 1
        }
      ]
    });
    const thresholds = getMedalDestructionThresholds();

    const bronzeState = createSimulation(level, 21);
    for (let x = 10; x < 18; x += 1) {
      bronzeState.grid[10][x] = { ...bronzeState.grid[10][x], lifecycle: "rubble" };
    }
    expect(stepSimulation(bronzeState).medal).toBe("bronze");

    const silverState = createSimulation(level, 22);
    for (let x = 10; x < 19; x += 1) {
      silverState.grid[10][x] = { ...silverState.grid[10][x], lifecycle: "rubble" };
    }
    expect(stepSimulation(silverState).medal).toBe("silver");

    const goldState = createSimulation(level, 23);
    for (let x = 10; x < 20; x += 1) {
      goldState.grid[10][x] = { ...goldState.grid[10][x], lifecycle: "rubble" };
    }
    const resolved = stepSimulation(goldState);
    expect(thresholds).toEqual({ bronze: 0.8, silver: 0.9, gold: 1 });
    expect(resolved.medal).toBe("gold");
  });
});

describe("brush footprints", () => {
  it("returns 1x1, 2x2, and 3x3 footprints for the three brush sizes", () => {
    expect(getBrushFootprint({ x: 8, y: 8 }, 0, 32)).toHaveLength(1);
    expect(getBrushFootprint({ x: 8, y: 8 }, 1, 32)).toHaveLength(4);
    expect(getBrushFootprint({ x: 8, y: 8 }, 2, 32)).toHaveLength(9);
  });

  it("clamps brush footprints at the map edge", () => {
    expect(getBrushFootprint({ x: 31, y: 31 }, 1, 32)).toEqual([{ x: 31, y: 31 }]);
    expect(getBrushFootprint({ x: 0, y: 0 }, 2, 32)).toHaveLength(4);
  });
});

describe("level files", () => {
  it("accepts version 1 level files by defaulting terrain to empty", () => {
    const raw = JSON.stringify({
      version: 1,
      level: {
        id: "v1-level",
        name: "V1 LEVEL",
        gridSize: 32,
        resourceBudget: { hayCells: 4, tntCount: 1 },
        completionPct: 0.5,
        fireSources: [{ x: 0, y: 0 }],
        structures: [
          {
            id: "s-1",
            type: "hut",
            origin: { x: 28, y: 28 },
            size: { x: 1, y: 1 },
            maxHp: 1
          }
        ]
      }
    });

    expect(parseLevelFile(raw, "en").terrainTiles).toEqual([]);
  });

  it("round-trips a valid version 2 level with terrain through JSON import/export", () => {
    const level = makeLevel({
      terrainTiles: [
        { x: 3, y: 4, type: "deepWater" },
        { x: 4, y: 4, type: "wetTerrain" },
        { x: 5, y: 4, type: "wall" }
      ]
    });
    const parsed = parseLevelFile(serializeLevel(level), "en");
    expect(parsed).toEqual(level);
  });

  it("rejects authored resource budgets above 999", () => {
    const errors = validateLevel(
      makeLevel({
        resourceBudget: { hayCells: 1_000, tntCount: 3 }
      }),
      "en"
    );
    expect(errors[0]).toContain("between 0 and 999");
  });

  it("rejects overlapping authored cells", () => {
    const errors = validateLevel(
      makeLevel({
        fireSources: [{ x: 28, y: 28 }]
      }),
      "en"
    );
    expect(errors[0]).toContain("Overlap");
  });

  it("rejects duplicate terrain coordinates and terrain overlap with structures", () => {
    const duplicateErrors = validateLevel(
      makeLevel({
        terrainTiles: [
          { x: 10, y: 10, type: "deepWater" },
          { x: 10, y: 10, type: "wall" }
        ]
      }),
      "en"
    );
    const overlapErrors = validateLevel(
      makeLevel({
        terrainTiles: [{ x: 28, y: 28, type: "wetTerrain" }]
      }),
      "en"
    );

    expect(duplicateErrors[0]).toContain("Overlap");
    expect(overlapErrors[0]).toContain("Overlap");
  });
});

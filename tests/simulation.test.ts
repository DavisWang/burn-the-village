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
    ]
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
  it("round-trips a valid level through JSON import/export", () => {
    const level = makeLevel();
    const parsed = parseLevelFile(serializeLevel(level));
    expect(parsed).toEqual(level);
  });

  it("rejects authored resource budgets above 999", () => {
    const errors = validateLevel(
      makeLevel({
        resourceBudget: { hayCells: 1_000, tntCount: 3 }
      })
    );
    expect(errors[0]).toContain("between 0 and 999");
  });

  it("rejects overlapping authored cells", () => {
    const errors = validateLevel(
      makeLevel({
        fireSources: [{ x: 28, y: 28 }]
      })
    );
    expect(errors[0]).toContain("Overlap");
  });
});

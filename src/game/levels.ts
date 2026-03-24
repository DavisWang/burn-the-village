import { GRID_SIZE } from "./constants";
import { createStructure } from "./structureCatalog";
import type { LevelDefinition } from "./types";

function level(
  id: string,
  name: string,
  hayCells: number,
  tntCount: number,
  completionPct: number,
  fireSources: LevelDefinition["fireSources"],
  structures: LevelDefinition["structures"],
  terrainTiles: LevelDefinition["terrainTiles"] = []
): LevelDefinition {
  return {
    id,
    name,
    gridSize: GRID_SIZE,
    resourceBudget: { hayCells, tntCount },
    completionPct,
    fireSources,
    structures,
    terrainTiles
  };
}

export const BUILT_IN_LEVELS: LevelDefinition[] = [
  level(
    "test",
    "Test",
    999,
    999,
    0.7,
    [{ x: 2, y: 15 }, { x: 2, y: 28 }],
    [
      createStructure("hut-a", "hut", { x: 10, y: 4 }),
      createStructure("house-a", "house", { x: 17, y: 3 }),
      createStructure("hall-a", "hall", { x: 24, y: 4 }),
      createStructure("hut-b", "hut", { x: 12, y: 19 }),
      createStructure("house-b", "house", { x: 19, y: 17 }),
      createStructure("hut-c", "hut", { x: 27, y: 22 })
    ]
  ),
  level(
    "ember-path",
    "EMBER PATH",
    44,
    1,
    0.55,
    [{ x: 3, y: 4 }],
    [createStructure("hut-a", "hut", { x: 23, y: 22 })]
  ),
  level(
    "double-bend",
    "DOUBLE BEND",
    52,
    1,
    0.58,
    [{ x: 4, y: 26 }],
    [createStructure("house-a", "house", { x: 20, y: 6 })]
  ),
  level(
    "forked-village",
    "FORKED VILLAGE",
    60,
    2,
    0.62,
    [{ x: 3, y: 15 }],
    [
      createStructure("hut-a", "hut", { x: 22, y: 4 }),
      createStructure("hut-b", "hut", { x: 23, y: 24 })
    ]
  ),
  level(
    "courtyard-run",
    "COURTYARD RUN",
    62,
    2,
    0.6,
    [{ x: 2, y: 2 }, { x: 2, y: 29 }],
    [createStructure("house-a", "house", { x: 19, y: 13 })]
  ),
  level(
    "three-roofs",
    "THREE ROOFS",
    70,
    2,
    0.68,
    [{ x: 3, y: 15 }],
    [
      createStructure("hut-a", "hut", { x: 18, y: 4 }),
      createStructure("house-a", "house", { x: 22, y: 12 }),
      createStructure("hut-b", "hut", { x: 19, y: 24 })
    ]
  ),
  level(
    "hall-breach",
    "HALL BREACH",
    74,
    3,
    0.7,
    [{ x: 4, y: 4 }],
    [
      createStructure("hall-a", "hall", { x: 18, y: 8 }),
      createStructure("hut-a", "hut", { x: 25, y: 23 })
    ]
  ),
  level(
    "river-mouth",
    "RIVER MOUTH",
    78,
    3,
    0.72,
    [{ x: 2, y: 14 }, { x: 5, y: 28 }],
    [
      createStructure("house-a", "house", { x: 16, y: 5 }),
      createStructure("house-b", "house", { x: 22, y: 19 })
    ]
  ),
  level(
    "final-pyres",
    "FINAL PYRES",
    86,
    4,
    0.78,
    [{ x: 2, y: 3 }, { x: 2, y: 28 }],
    [
      createStructure("hall-a", "hall", { x: 15, y: 5 }),
      createStructure("house-a", "house", { x: 22, y: 18 }),
      createStructure("hut-a", "hut", { x: 27, y: 2 })
    ]
  )
];

import { createStructure } from "./structureCatalog";
import { createSimulation } from "./simulation";
import type { GridCell, LevelDefinition, Point, SimulationState, TerrainTile } from "./types";

export type HowToPlayPreviewFeatureKey =
  | "fireSource"
  | "hay"
  | "tnt"
  | "hut"
  | "house"
  | "hall"
  | "deepWater"
  | "wetTerrain"
  | "wall";

type FeatureBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function paintMaterial(
  state: SimulationState,
  point: Point,
  material: "hay" | "tnt"
) {
  const cell = state.grid[point.y][point.x];
  state.grid[point.y][point.x] = {
    ...cell,
    material,
    lifecycle: "idle",
    hp: 0,
    maxHp: 0,
    structureId: null,
    structureType: null,
    scorch: 0,
    burnTicksRemaining: 0,
    fuseTicksRemaining: 0
  } satisfies GridCell;
}

function rectangle(origin: Point, width: number, height: number, type: TerrainTile["type"]): TerrainTile[] {
  const tiles: TerrainTile[] = [];
  for (let y = origin.y; y < origin.y + height; y += 1) {
    for (let x = origin.x; x < origin.x + width; x += 1) {
      tiles.push({ x, y, type });
    }
  }
  return tiles;
}

const HOW_TO_PLAY_PREVIEW_LEVEL: LevelDefinition = {
  id: "how-to-play-preview",
  name: "How To Play",
  gridSize: 32,
  resourceBudget: { hayCells: 12, tntCount: 2 },
  completionPct: 0.8,
  fireSources: [{ x: 4, y: 5 }],
  structures: [
    createStructure("hut-1", "hut", { x: 11, y: 3 }),
    createStructure("house-1", "house", { x: 23, y: 5 }),
    createStructure("hall-1", "hall", { x: 13, y: 21 })
  ],
  terrainTiles: [
    ...rectangle({ x: 24, y: 12 }, 6, 5, "deepWater"),
    ...rectangle({ x: 3, y: 22 }, 6, 5, "wetTerrain"),
    ...rectangle({ x: 20, y: 13 }, 1, 7, "wall")
  ]
};

const HAY_PATH: Point[] = [
  { x: 5, y: 5 },
  { x: 6, y: 5 },
  { x: 7, y: 5 },
  { x: 8, y: 5 },
  { x: 9, y: 5 },
  { x: 10, y: 6 },
  { x: 11, y: 7 },
  { x: 12, y: 8 },
  { x: 13, y: 9 }
];

export const HOW_TO_PLAY_PREVIEW_FEATURE_BOUNDS: Record<HowToPlayPreviewFeatureKey, FeatureBounds> = {
  fireSource: { x: 4, y: 5, width: 1, height: 1 },
  hay: { x: 5, y: 5, width: 9, height: 5 },
  tnt: { x: 18, y: 16, width: 1, height: 1 },
  hut: { x: 11, y: 3, width: 3, height: 3 },
  house: { x: 23, y: 5, width: 5, height: 5 },
  hall: { x: 13, y: 21, width: 7, height: 5 },
  deepWater: { x: 24, y: 12, width: 6, height: 5 },
  wetTerrain: { x: 3, y: 22, width: 6, height: 5 },
  wall: { x: 20, y: 13, width: 1, height: 7 }
};

export function createHowToPlayPreviewState(seed = 17) {
  const state = createSimulation(HOW_TO_PLAY_PREVIEW_LEVEL, seed);

  HAY_PATH.forEach((point) => paintMaterial(state, point, "hay"));
  paintMaterial(state, { x: 18, y: 16 }, "tnt");

  return state;
}

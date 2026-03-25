import { createSimulation, applyHayBrush, placeTnt, stepSimulation } from "./simulation";
import { validateLevel } from "./level-io";
import { createStructure } from "./structureCatalog";
import { createRng } from "./rng";
import { solveDeterministicLevel, type DeterministicSolution } from "./campaign-solver";
import type { LevelDefinition, Point, StructureType, TerrainTile, TerrainType } from "./types";

export type CampaignBandKey =
  | "core"
  | "tnt"
  | "deepWater"
  | "wetTerrain"
  | "wall"
  | "reinforcement"
  | "mastery";

export type CampaignMechanic =
  | "hay"
  | "tnt"
  | "deepWater"
  | "wetTerrain"
  | "wall"
  | "mixed";

export interface CampaignReportRow {
  order: number;
  id: string;
  band: CampaignBandKey;
  dominantMechanic: CampaignMechanic;
  name: string;
  zhName: string;
  goalPct: number;
  minHay: number;
  minTnt: number;
  grantedHay: number;
  grantedTnt: number;
  hayRatio: number | null;
  tntRatio: number | null;
  replaySuccessRate: number;
  difficulty: number;
}

export interface GeneratedCampaignData {
  levels: LevelDefinition[];
  enNames: Record<string, string>;
  zhHansNames: Record<string, string>;
  reportRows: CampaignReportRow[];
}

export interface CampaignGenerationProgress {
  index: number;
  count: number;
  key: string;
  name: string;
  difficulty: number;
}

interface CampaignTemplate {
  key: string;
  sequence: number;
  band: CampaignBandKey;
  dominantMechanic: CampaignMechanic;
  enCore: string;
  zhCore: string;
  targetRatio: number;
  minReplaySuccessRate: number;
  minDifficulty: number;
  maxDifficulty: number;
  level: LevelDefinition;
}

interface SolvedTemplate {
  sequence: number;
  band: CampaignBandKey;
  dominantMechanic: CampaignMechanic;
  enCore: string;
  zhCore: string;
  targetRatio: number;
  goalPct: number;
  preferred: DeterministicSolution;
  level: LevelDefinition;
  difficulty: number;
  hayRatio: number | null;
  tntRatio: number | null;
  replaySuccessRate: number;
}

const MAX_RESOURCE_BUDGET = 999;
const LIVE_REPLAY_SEEDS = [3, 8, 13, 21, 55, 89, 144, 233, 377];
const MAX_BUDGET_TUNING_ATTEMPTS = 10;
const MAX_CAMPAIGN_GENERATION_ATTEMPTS = 140;

function point(x: number, y: number): Point {
  return { x, y };
}

function structure(id: string, type: StructureType, x: number, y: number) {
  return createStructure(id, type, { x, y });
}

function uniqueTerrain(tiles: TerrainTile[]) {
  const byKey = new Map<string, TerrainTile>();
  for (const tile of tiles) {
    byKey.set(`${tile.x},${tile.y}`, tile);
  }
  return [...byKey.values()].sort((left, right) => left.y - right.y || left.x - right.x);
}

function levelTemplate(
  key: string,
  band: CampaignBandKey,
  dominantMechanic: CampaignMechanic,
  enCore: string,
  zhCore: string,
  targetRatio: number,
  minReplaySuccessRate: number,
  minDifficulty: number,
  maxDifficulty: number,
  fireSources: Point[],
  structures: LevelDefinition["structures"],
  terrainTiles: TerrainTile[] = []
): CampaignTemplate {
  return {
    key,
    sequence: -1,
    band,
    dominantMechanic,
    enCore,
    zhCore,
    targetRatio,
    minReplaySuccessRate,
    minDifficulty,
    maxDifficulty,
    level: {
      id: key,
      name: enCore,
      gridSize: 32,
      resourceBudget: { hayCells: 0, tntCount: 0 },
      completionPct: 1,
      fireSources,
      structures,
      terrainTiles: uniqueTerrain(terrainTiles)
    }
  };
}

interface CampaignSpec {
  key: string;
  band: CampaignBandKey;
  dominantMechanic: CampaignMechanic;
  enCore: string;
  zhCore: string;
  goalPct: number;
  targetRatio: number;
  minReplaySuccessRate: number;
  minDifficulty: number;
  maxDifficulty: number;
  fireCount: number;
  structureCount: number;
  generationAttempts?: number;
  terrainTypes?: TerrainType[];
  clusteredStructures?: boolean;
  requiresTnt?: boolean;
}

const CAMPAIGN_BASE_SEED = 0x51f15eed;
const REPLAY_RATE_TUTORIAL_STRICT = 8 / LIVE_REPLAY_SEEDS.length;
const REPLAY_RATE_STANDARD = 7 / LIVE_REPLAY_SEEDS.length;
const REPLAY_RATE_CHALLENGE = 6 / LIVE_REPLAY_SEEDS.length;
const CAMPAIGN_SPECS: CampaignSpec[] = [
  {
    key: "tutorial-core-1",
    band: "core",
    dominantMechanic: "hay",
    enCore: "Wandering Hearth",
    zhCore: "游火炉影",
    goalPct: 0.5,
    targetRatio: 0.32,
    minReplaySuccessRate: REPLAY_RATE_TUTORIAL_STRICT,
    minDifficulty: 0.1,
    maxDifficulty: 0.16,
    fireCount: 2,
    structureCount: 4
  },
  {
    key: "tutorial-core-2",
    band: "core",
    dominantMechanic: "hay",
    enCore: "Ash Orchard",
    zhCore: "灰烬果园",
    goalPct: 0.55,
    targetRatio: 0.38,
    minReplaySuccessRate: REPLAY_RATE_TUTORIAL_STRICT,
    minDifficulty: 0.14,
    maxDifficulty: 0.2,
    fireCount: 2,
    structureCount: 5
  },
  {
    key: "tutorial-tnt-1",
    band: "tnt",
    dominantMechanic: "tnt",
    enCore: "Powder Pocket",
    zhCore: "火药暗湾",
    goalPct: 0.6,
    targetRatio: 0.48,
    minReplaySuccessRate: REPLAY_RATE_TUTORIAL_STRICT,
    minDifficulty: 0.18,
    maxDifficulty: 0.24,
    fireCount: 2,
    structureCount: 5,
    clusteredStructures: true,
    requiresTnt: true
  },
  {
    key: "tutorial-tnt-2",
    band: "tnt",
    dominantMechanic: "tnt",
    enCore: "Fuse Relay",
    zhCore: "引线接力",
    goalPct: 0.65,
    targetRatio: 0.54,
    minReplaySuccessRate: REPLAY_RATE_TUTORIAL_STRICT,
    minDifficulty: 0.22,
    maxDifficulty: 0.28,
    fireCount: 2,
    structureCount: 5,
    clusteredStructures: true,
    requiresTnt: true
  },
  {
    key: "tutorial-water-1",
    band: "deepWater",
    dominantMechanic: "deepWater",
    enCore: "Floodbraid",
    zhCore: "洪流辫道",
    goalPct: 0.65,
    targetRatio: 0.45,
    minReplaySuccessRate: REPLAY_RATE_STANDARD,
    minDifficulty: 0.24,
    maxDifficulty: 0.3,
    fireCount: 2,
    structureCount: 5,
    terrainTypes: ["deepWater"]
  },
  {
    key: "tutorial-water-2",
    band: "deepWater",
    dominantMechanic: "deepWater",
    enCore: "Reed Crossing",
    zhCore: "芦渡回路",
    goalPct: 0.7,
    targetRatio: 0.48,
    minReplaySuccessRate: REPLAY_RATE_STANDARD,
    minDifficulty: 0.28,
    maxDifficulty: 0.34,
    fireCount: 2,
    structureCount: 5,
    terrainTypes: ["deepWater"]
  },
  {
    key: "tutorial-wet-1",
    band: "wetTerrain",
    dominantMechanic: "wetTerrain",
    enCore: "Mire Tangle",
    zhCore: "泥沼纠结",
    goalPct: 0.75,
    targetRatio: 0.5,
    minReplaySuccessRate: REPLAY_RATE_STANDARD,
    minDifficulty: 0.3,
    maxDifficulty: 0.36,
    fireCount: 2,
    structureCount: 5,
    terrainTypes: ["wetTerrain"]
  },
  {
    key: "tutorial-wet-2",
    band: "wetTerrain",
    dominantMechanic: "wetTerrain",
    enCore: "Sodden Weave",
    zhCore: "潮泥织径",
    goalPct: 0.8,
    targetRatio: 0.52,
    minReplaySuccessRate: REPLAY_RATE_STANDARD,
    minDifficulty: 0.34,
    maxDifficulty: 0.4,
    fireCount: 2,
    structureCount: 5,
    terrainTypes: ["wetTerrain"]
  },
  {
    key: "tutorial-wall-1",
    band: "wall",
    dominantMechanic: "wall",
    enCore: "Bramble Rampart",
    zhCore: "荆焰垒墙",
    goalPct: 0.75,
    targetRatio: 0.5,
    minReplaySuccessRate: REPLAY_RATE_STANDARD,
    minDifficulty: 0.3,
    maxDifficulty: 0.38,
    fireCount: 2,
    structureCount: 4,
    terrainTypes: ["wall"]
  },
  {
    key: "tutorial-wall-2",
    band: "wall",
    dominantMechanic: "wall",
    enCore: "Cinder Bastion",
    zhCore: "余烬堡垒",
    goalPct: 0.8,
    targetRatio: 0.52,
    minReplaySuccessRate: REPLAY_RATE_STANDARD,
    minDifficulty: 0.34,
    maxDifficulty: 0.4,
    fireCount: 2,
    structureCount: 4,
    terrainTypes: ["wall"]
  },
  {
    key: "trial-river-snare",
    band: "reinforcement",
    dominantMechanic: "deepWater",
    enCore: "River Snare",
    zhCore: "河钩陷阵",
    goalPct: 0.78,
    targetRatio: 0.52,
    minReplaySuccessRate: REPLAY_RATE_STANDARD,
    minDifficulty: 0.41,
    maxDifficulty: 0.46,
    fireCount: 2,
    structureCount: 4,
    terrainTypes: ["deepWater"]
  },
  {
    key: "trial-marsh-lattice",
    band: "reinforcement",
    dominantMechanic: "wetTerrain",
    enCore: "Marsh Lattice",
    zhCore: "沼泽网阵",
    goalPct: 0.82,
    targetRatio: 0.54,
    minReplaySuccessRate: REPLAY_RATE_STANDARD,
    minDifficulty: 0.43,
    maxDifficulty: 0.48,
    fireCount: 2,
    structureCount: 4,
    terrainTypes: ["wetTerrain"]
  },
  {
    key: "trial-char-gate",
    band: "reinforcement",
    dominantMechanic: "wall",
    enCore: "Char Gate",
    zhCore: "炭火关门",
    goalPct: 0.86,
    targetRatio: 0.56,
    minReplaySuccessRate: REPLAY_RATE_STANDARD,
    minDifficulty: 0.45,
    maxDifficulty: 0.5,
    fireCount: 2,
    structureCount: 4,
    terrainTypes: ["wall"]
  },
  {
    key: "trial-drowned-switch",
    band: "reinforcement",
    dominantMechanic: "deepWater",
    enCore: "Drowned Switch",
    zhCore: "淹潮转路",
    goalPct: 0.84,
    targetRatio: 0.56,
    minReplaySuccessRate: REPLAY_RATE_STANDARD,
    minDifficulty: 0.47,
    maxDifficulty: 0.5,
    fireCount: 2,
    structureCount: 4,
    terrainTypes: ["deepWater"]
  },
  {
    key: "trial-breach-current",
    band: "reinforcement",
    dominantMechanic: "wetTerrain",
    enCore: "Breach Current",
    zhCore: "爆隙激流",
    goalPct: 0.86,
    targetRatio: 0.56,
    minReplaySuccessRate: REPLAY_RATE_STANDARD,
    minDifficulty: 0.47,
    maxDifficulty: 0.52,
    fireCount: 2,
    structureCount: 4,
    generationAttempts: 360,
    terrainTypes: ["wetTerrain"]
  },
  {
    key: "trial-thorn-circuit",
    band: "mastery",
    dominantMechanic: "mixed",
    enCore: "Thorn Circuit",
    zhCore: "荆棘回路",
    goalPct: 0.92,
    targetRatio: 0.62,
    minReplaySuccessRate: REPLAY_RATE_CHALLENGE,
    minDifficulty: 0.52,
    maxDifficulty: 0.58,
    fireCount: 2,
    structureCount: 4,
    generationAttempts: 320,
    terrainTypes: ["deepWater", "wetTerrain"]
  },
  {
    key: "trial-bogglass",
    band: "mastery",
    dominantMechanic: "mixed",
    enCore: "Bogglass Trial",
    zhCore: "沼镜试炼",
    goalPct: 0.94,
    targetRatio: 0.64,
    minReplaySuccessRate: REPLAY_RATE_CHALLENGE,
    minDifficulty: 0.54,
    maxDifficulty: 0.6,
    fireCount: 2,
    structureCount: 5,
    generationAttempts: 320,
    terrainTypes: ["deepWater", "wetTerrain"]
  },
  {
    key: "trial-floodwall-knot",
    band: "mastery",
    dominantMechanic: "mixed",
    enCore: "Floodwall Knot",
    zhCore: "洪墙死结",
    goalPct: 0.96,
    targetRatio: 0.66,
    minReplaySuccessRate: REPLAY_RATE_CHALLENGE,
    minDifficulty: 0.56,
    maxDifficulty: 0.62,
    fireCount: 2,
    structureCount: 5,
    generationAttempts: 360,
    terrainTypes: ["deepWater", "wetTerrain"]
  },
  {
    key: "trial-ashen-gauntlet",
    band: "mastery",
    dominantMechanic: "mixed",
    enCore: "Ashen Gauntlet",
    zhCore: "灰烬连关",
    goalPct: 1,
    targetRatio: 0.68,
    minReplaySuccessRate: REPLAY_RATE_CHALLENGE,
    minDifficulty: 0.58,
    maxDifficulty: 0.64,
    fireCount: 2,
    structureCount: 5,
    generationAttempts: 420,
    terrainTypes: ["deepWater", "wall", "wetTerrain"]
  },
  {
    key: "trial-blackwake-citadel",
    band: "mastery",
    dominantMechanic: "mixed",
    enCore: "Blackwake Citadel",
    zhCore: "黑潮城塞",
    goalPct: 1,
    targetRatio: 0.72,
    minReplaySuccessRate: REPLAY_RATE_CHALLENGE,
    minDifficulty: 0.62,
    maxDifficulty: 0.7,
    fireCount: 3,
    structureCount: 6,
    generationAttempts: 480,
    terrainTypes: ["deepWater", "wall", "wetTerrain"]
  }
];

const FIRE_SOURCE_ZONES = [
  { minX: 2, maxX: 6, minY: 2, maxY: 6 },
  { minX: 12, maxX: 18, minY: 2, maxY: 6 },
  { minX: 24, maxX: 28, minY: 2, maxY: 6 },
  { minX: 2, maxX: 6, minY: 12, maxY: 18 },
  { minX: 24, maxX: 28, minY: 12, maxY: 18 },
  { minX: 2, maxX: 6, minY: 24, maxY: 28 },
  { minX: 12, maxX: 18, minY: 24, maxY: 28 },
  { minX: 24, maxX: 28, minY: 24, maxY: 28 }
] as const;
const CARDINAL_DIRECTIONS = [point(1, 0), point(-1, 0), point(0, 1), point(0, -1)] as const;

function randomInt(rng: () => number, min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1));
}

function pickOne<T>(rng: () => number, items: readonly T[]) {
  return items[randomInt(rng, 0, items.length - 1)];
}

function shuffle<T>(rng: () => number, items: readonly T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(rng, 0, index);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function clampPoint(candidate: Point, margin = 1) {
  return {
    x: Math.max(margin, Math.min(31 - margin, candidate.x)),
    y: Math.max(margin, Math.min(31 - margin, candidate.y))
  };
}

function jitterPoint(rng: () => number, base: Point, amount: number) {
  return clampPoint({
    x: base.x + randomInt(rng, -amount, amount),
    y: base.y + randomInt(rng, -amount, amount)
  });
}

function manhattan(left: Point, right: Point) {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
}

function structureCenter(definition: LevelDefinition["structures"][number]): Point {
  return {
    x: definition.origin.x + Math.floor(definition.size.x / 2),
    y: definition.origin.y + Math.floor(definition.size.y / 2)
  };
}

function boundsOverlap(
  left: LevelDefinition["structures"][number],
  right: LevelDefinition["structures"][number],
  padding = 1
) {
  return !(
    left.origin.x + left.size.x + padding <= right.origin.x ||
    right.origin.x + right.size.x + padding <= left.origin.x ||
    left.origin.y + left.size.y + padding <= right.origin.y ||
    right.origin.y + right.size.y + padding <= left.origin.y
  );
}

function strongAxisSeparation(fireSources: Point[], structures: LevelDefinition["structures"]) {
  const structureCenters = structures.map(structureCenter);
  const fireXs = fireSources.map((point) => point.x);
  const fireYs = fireSources.map((point) => point.y);
  const structureXs = structureCenters.map((point) => point.x);
  const structureYs = structureCenters.map((point) => point.y);

  const separatedHorizontally =
    Math.max(...fireXs) < Math.min(...structureXs) - 8 ||
    Math.max(...structureXs) < Math.min(...fireXs) - 8;
  const separatedVertically =
    Math.max(...fireYs) < Math.min(...structureYs) - 8 ||
    Math.max(...structureYs) < Math.min(...fireYs) - 8;

  return separatedHorizontally || separatedVertically;
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

function paintTerrainBrush(
  tiles: TerrainTile[],
  type: TerrainType,
  center: Point,
  radius: number,
  rng: () => number
) {
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      const x = center.x + dx;
      const y = center.y + dy;
      if (x < 0 || y < 0 || x >= 32 || y >= 32) {
        continue;
      }
      if (Math.abs(dx) + Math.abs(dy) > radius + (rng() < 0.2 ? 1 : 0)) {
        continue;
      }
      tiles.push({ x, y, type });
    }
  }
}

function randomWalkTerrain(
  type: TerrainType,
  rng: () => number,
  start: Point,
  steps: number,
  baseRadius: number
) {
  const tiles: TerrainTile[] = [];
  const history: Point[] = [];
  let cursor = clampPoint(start);

  for (let step = 0; step < steps; step += 1) {
    history.push(cursor);
    paintTerrainBrush(tiles, type, cursor, baseRadius + (rng() < 0.18 ? 1 : 0), rng);
    if (history.length > 3 && rng() < 0.2) {
      cursor = history[randomInt(rng, 0, history.length - 1)];
    }
    const direction = pickOne(rng, CARDINAL_DIRECTIONS);
    cursor = clampPoint({ x: cursor.x + direction.x, y: cursor.y + direction.y });
  }

  return tiles;
}

function wallClusterTerrain(rng: () => number, anchor: Point) {
  const shapes = [
    [
      point(0, 0),
      point(1, 0),
      point(2, 0),
      point(0, 1),
      point(0, 2),
      point(1, 2),
      point(2, 2),
      point(2, 1),
      point(3, 1)
    ],
    [
      point(0, 0),
      point(1, 0),
      point(2, 0),
      point(2, 1),
      point(2, 2),
      point(1, 2),
      point(0, 2),
      point(-1, 2),
      point(-1, 1)
    ],
    [
      point(0, 0),
      point(1, 0),
      point(1, 1),
      point(1, 2),
      point(0, 2),
      point(-1, 2),
      point(-1, 1),
      point(-1, 0),
      point(0, -1)
    ]
  ];
  const shape = pickOne(rng, shapes);
  return shape.map((offset) => {
    const tile = clampPoint(
      {
        x: anchor.x + offset.x,
        y: anchor.y + offset.y
      },
      0
    );
    return { x: tile.x, y: tile.y, type: "wall" as const };
  });
}

function placeFireSources(spec: CampaignSpec, rng: () => number) {
  const chosenZones = shuffle(rng, FIRE_SOURCE_ZONES).slice(0, spec.fireCount);
  const fireSources: Point[] = [];

  for (const zone of chosenZones) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const candidate = {
        x: randomInt(rng, zone.minX, zone.maxX),
        y: randomInt(rng, zone.minY, zone.maxY)
      };
      if (fireSources.every((existing) => manhattan(existing, candidate) >= 8)) {
        fireSources.push(candidate);
        break;
      }
    }
  }

  return fireSources;
}

function canPlaceStructure(
  fireSources: Point[],
  placed: LevelDefinition["structures"],
  candidate: LevelDefinition["structures"][number]
) {
  if (
    candidate.origin.x < 1 ||
    candidate.origin.y < 1 ||
    candidate.origin.x + candidate.size.x > 31 ||
    candidate.origin.y + candidate.size.y > 31
  ) {
    return false;
  }

  if (placed.some((existing) => boundsOverlap(existing, candidate, 2))) {
    return false;
  }

  const center = structureCenter(candidate);
  return fireSources.every((source) => manhattan(source, center) >= 6);
}

function placeRandomStructures(
  spec: CampaignSpec,
  rng: () => number,
  fireSources: Point[],
  existing: LevelDefinition["structures"] = [],
  desiredCount = spec.structureCount
) {
  const structures = [...existing];
  const types: StructureType[] = shuffle(rng, ["hut", "hut", "hut", "house", "house", spec.band === "wall" ? "hall" : "house"]);

  while (structures.length < desiredCount) {
    const type = types[(structures.length + randomInt(rng, 0, types.length - 1)) % types.length];
    let placed = false;
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const tentative = structure(
        `structure-${structures.length + 1}`,
        type,
        randomInt(rng, 2, 25),
        randomInt(rng, 2, 24)
      );
      if (!canPlaceStructure(fireSources, structures, tentative)) {
        continue;
      }
      structures.push(tentative);
      placed = true;
      break;
    }
    if (!placed) {
      return [];
    }
  }

  return structures;
}

function placeTntClusterStructures(spec: CampaignSpec, rng: () => number, fireSources: Point[]) {
  const hub = { x: randomInt(rng, 12, 19), y: randomInt(rng, 11, 20) };
  const structures: LevelDefinition["structures"] = [];
  const offsets = shuffle(rng, [point(-4, -4), point(-4, 2), point(2, -4), point(2, 2)]);

  for (const [index, offset] of offsets.slice(0, 3).entries()) {
    const tentative = structure(`structure-${index + 1}`, "hut", hub.x + offset.x, hub.y + offset.y);
    if (canPlaceStructure(fireSources, structures, tentative)) {
      structures.push(tentative);
    }
  }

  if (structures.length < 2) {
    return [];
  }

  return placeRandomStructures(spec, rng, fireSources, structures);
}

function generateTerrain(
  spec: CampaignSpec,
  rng: () => number,
  fireSources: Point[],
  structures: LevelDefinition["structures"]
) {
  if (!spec.terrainTypes?.length) {
    return [] as TerrainTile[];
  }

  const occupied = new Set<string>();
  for (const source of fireSources) {
    occupied.add(`${source.x},${source.y}`);
  }
  for (const placed of structures) {
    for (let y = placed.origin.y; y < placed.origin.y + placed.size.y; y += 1) {
      for (let x = placed.origin.x; x < placed.origin.x + placed.size.x; x += 1) {
        occupied.add(`${x},${y}`);
      }
    }
  }

  const anchorsByType = spec.terrainTypes.map((terrainType) => ({
    terrainType,
    anchors: shuffle(
      rng,
      fireSources.flatMap((source) =>
        structures.map((placed) =>
          jitterPoint(
            rng,
            {
              x: Math.round((source.x + structureCenter(placed).x) / 2),
              y: Math.round((source.y + structureCenter(placed).y) / 2)
            },
            3
          )
        )
      )
    ).slice(0, terrainType === "wall" ? 1 : 3)
  }));

  const tiles: TerrainTile[] = [];
  for (const entry of anchorsByType) {
    for (const anchor of entry.anchors) {
      const steps =
        entry.terrainType === "deepWater"
          ? randomInt(rng, 14, 22)
          : randomInt(rng, 18, 28);
      const radius = 1;
      const terrainShape =
        entry.terrainType === "wall"
          ? wallClusterTerrain(rng, anchor)
          : randomWalkTerrain(entry.terrainType, rng, anchor, steps, radius);
      for (const tile of terrainShape) {
        const key = `${tile.x},${tile.y}`;
        if (occupied.has(key)) {
          continue;
        }
        if (fireSources.some((source) => manhattan(source, tile) <= 1)) {
          continue;
        }
        occupied.add(key);
        tiles.push(tile);
      }
    }
  }

  return uniqueTerrain(tiles);
}

function buildProceduralTemplate(spec: CampaignSpec, sequence: number, attempt: number): CampaignTemplate {
  const rng = createRng(CAMPAIGN_BASE_SEED ^ ((sequence + 1) * 0x9e3779b9) ^ (attempt * 0x85ebca6b));
  const fireSources = placeFireSources(spec, rng);
  const structures =
    spec.clusteredStructures
      ? placeTntClusterStructures(spec, rng, fireSources)
      : placeRandomStructures(spec, rng, fireSources);
  const terrainTiles = generateTerrain(spec, rng, fireSources, structures);
  const template = levelTemplate(
    spec.key,
    spec.band,
    spec.dominantMechanic,
    spec.enCore,
    spec.zhCore,
    spec.targetRatio,
    spec.minReplaySuccessRate,
    spec.minDifficulty,
    spec.maxDifficulty,
    fireSources,
    structures,
    terrainTiles
  );

  return {
    ...template,
    sequence,
    level: {
      ...template.level,
      completionPct: spec.goalPct
    }
  };
}

function clampBudget(value: number) {
  return Math.max(0, Math.min(MAX_RESOURCE_BUDGET, value));
}

function budgetFromTarget(minimum: number, targetRatio: number) {
  if (minimum <= 0) {
    return 0;
  }
  const targetBudget = Math.ceil(minimum / targetRatio);
  return clampBudget(Math.max(minimum, targetBudget));
}

function maxBudgetFromFloor(minimum: number) {
  if (minimum <= 0) {
    return 0;
  }
  return clampBudget(Math.max(minimum, minimum * 5));
}

function ratio(minimum: number, granted: number) {
  if (minimum <= 0 || granted <= 0) {
    return null;
  }
  return minimum / granted;
}

function difficultyFromRatios(
  hayRatio: number | null,
  tntRatio: number | null,
  goalPct: number,
  replaySuccessRate: number
) {
  const pressure = Math.max(hayRatio ?? 0, tntRatio ?? 0);
  const reliability = Math.max(0.35, replaySuccessRate);
  return (pressure * goalPct) / reliability;
}

function forgivenessBuffer(minimum: number) {
  if (minimum <= 0) {
    return 0;
  }
  return Math.max(1, Math.ceil(minimum * 0.06));
}

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

function terrainAt(level: LevelDefinition, point: Point): TerrainType | "ground" {
  return level.terrainTiles.find((tile) => tile.x === point.x && tile.y === point.y)?.type ?? "ground";
}

function buildOccupiedSet(level: LevelDefinition) {
  const occupied = new Set<string>();
  for (const source of level.fireSources) {
    occupied.add(`${source.x},${source.y}`);
  }
  for (const structure of level.structures) {
    for (let y = structure.origin.y; y < structure.origin.y + structure.size.y; y += 1) {
      for (let x = structure.origin.x; x < structure.origin.x + structure.size.x; x += 1) {
        occupied.add(`${x},${y}`);
      }
    }
  }
  return occupied;
}

function buildReplayHayNetwork(level: LevelDefinition, preferred: DeterministicSolution, hayBudget: number) {
  const occupied = buildOccupiedSet(level);
  const tntKeys = new Set(preferred.tntPlan.map((cell) => `${cell.x},${cell.y}`));
  const cells = new Map(
    preferred.hayNetwork
      .filter((cell) => !tntKeys.has(`${cell.x},${cell.y}`))
      .map((cell) => [`${cell.x},${cell.y}`, cell])
  );
  if (cells.size >= hayBudget) {
    return [...cells.values()];
  }

  const scoredCandidates = new Map<string, { cell: Point; score: number }>();
  const upsertCandidate = (cell: Point, score: number) => {
    const key = `${cell.x},${cell.y}`;
    if (cells.has(key) || tntKeys.has(key) || occupied.has(key)) {
      return;
    }
    const terrain = terrainAt(level, cell);
    if (terrain === "deepWater" || terrain === "wall") {
      return;
    }
    const existing = scoredCandidates.get(key);
    if (existing) {
      existing.score += score;
      return;
    }
    scoredCandidates.set(key, { cell, score });
  };
  const addNeighborCandidates = (anchor: Point, score: number) => {
    for (const neighbor of [
      point(anchor.x + 1, anchor.y),
      point(anchor.x - 1, anchor.y),
      point(anchor.x, anchor.y + 1),
      point(anchor.x, anchor.y - 1)
    ]) {
      if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x >= level.gridSize || neighbor.y >= level.gridSize) {
        continue;
      }
      upsertCandidate(neighbor, score);
    }
  };

  for (const source of level.fireSources) {
    addNeighborCandidates(source, 8);
  }
  for (const cell of preferred.tntPlan) {
    addNeighborCandidates(cell, 10);
  }
  for (const cell of preferred.hayNetwork) {
    addNeighborCandidates(cell, 4);
  }

  for (const structure of level.structures) {
    const boundary: Point[] = [];
    for (let y = structure.origin.y; y < structure.origin.y + structure.size.y; y += 1) {
      for (let x = structure.origin.x; x < structure.origin.x + structure.size.x; x += 1) {
        for (const neighbor of [
          point(x + 1, y),
          point(x - 1, y),
          point(x, y + 1),
          point(x, y - 1)
        ]) {
          if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x >= level.gridSize || neighbor.y >= level.gridSize) {
            continue;
          }
          const key = `${neighbor.x},${neighbor.y}`;
          const terrain = terrainAt(level, neighbor);
          if (tntKeys.has(key) || occupied.has(key) || terrain === "deepWater" || terrain === "wall") {
            continue;
          }
          boundary.push(neighbor);
          upsertCandidate(neighbor, 6);
        }
      }
    }

    boundary
      .sort((left, right) => left.y - right.y || left.x - right.x)
      .forEach((cell) => {
        if (cells.size >= hayBudget) {
          return;
        }
        cells.set(`${cell.x},${cell.y}`, cell);
      });
  }

  if (cells.size < hayBudget) {
    const connectedKeys = new Set([
      ...cells.keys(),
      ...level.fireSources.map((cell) => `${cell.x},${cell.y}`),
      ...preferred.tntPlan.map((cell) => `${cell.x},${cell.y}`)
    ]);
    const rankedCandidates = [...scoredCandidates.values()]
      .map((entry) => {
        let adjacencyScore = 0;
        for (const neighbor of [
          point(entry.cell.x + 1, entry.cell.y),
          point(entry.cell.x - 1, entry.cell.y),
          point(entry.cell.x, entry.cell.y + 1),
          point(entry.cell.x, entry.cell.y - 1)
        ]) {
          if (connectedKeys.has(`${neighbor.x},${neighbor.y}`)) {
            adjacencyScore += 3;
          }
        }
        return {
          cell: entry.cell,
          score: entry.score + adjacencyScore
        };
      })
      .sort((left, right) => right.score - left.score || left.cell.y - right.cell.y || left.cell.x - right.cell.x);

    for (const candidate of rankedCandidates) {
      if (cells.size >= hayBudget) {
        break;
      }
      cells.set(`${candidate.cell.x},${candidate.cell.y}`, candidate.cell);
      connectedKeys.add(`${candidate.cell.x},${candidate.cell.y}`);
    }
  }

  return [...cells.values()].sort((left, right) => left.y - right.y || left.x - right.x);
}

function levelHash(level: LevelDefinition) {
  return JSON.stringify({
    fireSources: [...level.fireSources].sort((left, right) => left.y - right.y || left.x - right.x),
    structures: [...level.structures]
      .map((structure) => ({
        type: structure.type,
        origin: structure.origin,
        size: structure.size
      }))
      .sort((left, right) => left.origin.y - right.origin.y || left.origin.x - right.origin.x),
    terrainTiles: [...level.terrainTiles].sort((left, right) => left.y - right.y || left.x - right.x)
  });
}

function counterfactualLevel(level: LevelDefinition, terrainType: TerrainType) {
  const next = cloneLevel(level);
  next.terrainTiles = next.terrainTiles.filter((tile) => tile.type !== terrainType);
  return next;
}

function choosePreferredSolution(template: CampaignTemplate) {
  const solveResult = solveDeterministicLevel(template.level);
  if (!solveResult.frontier.length) {
    return null;
  }

  const tntPreferred =
    template.band === "tnt"
      ? [...solveResult.frontier]
          .filter((candidate) => candidate.tntCount > 0)
          .sort(
            (left, right) =>
              left.hayCells - right.hayCells ||
              left.tntCount - right.tntCount ||
              left.weightedCost - right.weightedCost
          )[0] ?? null
      : null;

  return tntPreferred ?? solveResult.preferred ?? solveResult.frontier[0];
}

function validateTemplateLayout(spec: CampaignSpec, level: LevelDefinition) {
  if (strongAxisSeparation(level.fireSources, level.structures)) {
    return false;
  }

  if ((spec.band === "core" || spec.band === "tnt") && level.terrainTiles.length !== 0) {
    return false;
  }

  for (const terrainType of spec.terrainTypes ?? []) {
    if (!level.terrainTiles.some((tile) => tile.type === terrainType)) {
      return false;
    }
    if (!hasFreeformTerrain(level, terrainType)) {
      return false;
    }
  }

  return true;
}

function validateDeterministicPressure(
  spec: CampaignSpec,
  level: LevelDefinition,
  preferred: DeterministicSolution
) {
  if ((spec.band === "tnt" || spec.requiresTnt) && preferred.tntCount === 0) {
    return false;
  }

  if (spec.requiresTnt) {
    const withoutTnt = cloneLevel(level);
    withoutTnt.resourceBudget.tntCount = 0;
    const hayOnly = solveDeterministicLevel(withoutTnt).preferred;
    if (!!hayOnly && hayOnly.hayCells < preferred.hayCells + 2) {
      return false;
    }
  }

  const terrainTypes = spec.terrainTypes ?? [];
  const mixedTerrain = terrainTypes.length > 1;
  let meaningfulTerrainCount = 0;

  if (terrainTypes.includes("deepWater")) {
    const dry = solveDeterministicLevel(counterfactualLevel(level, "deepWater")).preferred;
    const matters = !!dry && dry.hayCells + dry.tntCount < preferred.hayCells + preferred.tntCount;
    if (!dry || (!mixedTerrain && !matters)) {
      return false;
    }
    if (matters) {
      meaningfulTerrainCount += 1;
    }
  }

  if (terrainTypes.includes("wetTerrain")) {
    const dry = solveDeterministicLevel(counterfactualLevel(level, "wetTerrain")).preferred;
    const matters = !!dry && dry.hayCells < preferred.hayCells;
    if (!dry || (!mixedTerrain && !matters)) {
      return false;
    }
    if (matters) {
      meaningfulTerrainCount += 1;
    }
  }

  if (terrainTypes.includes("wall")) {
    const opened = solveDeterministicLevel(counterfactualLevel(level, "wall")).preferred;
    if (!opened) {
      return false;
    }
    const wallOnly = terrainTypes.length === 1 && terrainTypes[0] === "wall";
    const matters = opened.hayCells < preferred.hayCells || opened.tntCount < preferred.tntCount;
    if (!wallOnly && !mixedTerrain && !matters) {
      return false;
    }
    if (matters) {
      meaningfulTerrainCount += 1;
    }
  }

  if (mixedTerrain && terrainTypes.length > 0 && meaningfulTerrainCount === 0) {
    return false;
  }

  return true;
}

function canonicalReplay(level: LevelDefinition, hayNetwork: Point[], tntPlan: Point[], seed: number) {
  const replayLevel = cloneLevel(level);
  let state = createSimulation(replayLevel, seed);
  const remainingHay = new Map(hayNetwork.map((cell) => [`${cell.x},${cell.y}`, cell]));
  const remainingTnt = [...tntPlan];

  for (let tick = 0; tick < 220; tick += 1) {
    let madePlacement = true;
    while (madePlacement) {
      madePlacement = false;
      for (const [key, cell] of [...remainingHay.entries()]) {
        const next = applyHayBrush(state, cell, 0);
        if (next.hayRemaining < state.hayRemaining) {
          state = next;
          remainingHay.delete(key);
          madePlacement = true;
        }
      }

      if (remainingTnt.length) {
        const next = placeTnt(state, remainingTnt[0]);
        if (next.tntRemaining < state.tntRemaining) {
          state = next;
          remainingTnt.shift();
          madePlacement = true;
        }
      }
    }

    state = stepSimulation(state);
    if (state.outcome === "successResolved") {
      return true;
    }
  }

  return false;
}

interface ReplayEvaluation {
  successCount: number;
  attemptCount: number;
  successRate: number;
}

interface BudgetEvaluation {
  hayCells: number;
  tntCount: number;
  replay: ReplayEvaluation;
}

function evaluateLiveReplay(level: LevelDefinition, hayNetwork: Point[], tntPlan: Point[]): ReplayEvaluation {
  let successCount = 0;
  for (const seed of LIVE_REPLAY_SEEDS) {
    if (canonicalReplay(level, hayNetwork, tntPlan, seed)) {
      successCount += 1;
    }
  }
  return {
    successCount,
    attemptCount: LIVE_REPLAY_SEEDS.length,
    successRate: successCount / LIVE_REPLAY_SEEDS.length
  };
}

function evaluateBudgetCandidate(
  templateLevel: LevelDefinition,
  preferred: DeterministicSolution,
  hayCells: number,
  tntCount: number
): BudgetEvaluation {
  const candidateLevel = cloneLevel(templateLevel);
  candidateLevel.resourceBudget = {
    hayCells,
    tntCount
  };
  const replayHayNetwork = buildReplayHayNetwork(candidateLevel, preferred, hayCells);
  return {
    hayCells,
    tntCount,
    replay: evaluateLiveReplay(candidateLevel, replayHayNetwork, preferred.tntPlan)
  };
}

function tightenBudgetToReplayThreshold(
  templateLevel: LevelDefinition,
  preferred: DeterministicSolution,
  baseline: BudgetEvaluation,
  minReplaySuccessRate: number,
  hayFloor: number,
  tntFloor: number
) {
  let best = baseline;
  const haySteps = [16, 8, 4, 2, 1];

  for (const step of haySteps) {
    while (best.hayCells - step >= hayFloor) {
      const candidate = evaluateBudgetCandidate(
        templateLevel,
        preferred,
        best.hayCells - step,
        best.tntCount
      );
      if (candidate.replay.successRate < minReplaySuccessRate) {
        break;
      }
      best = candidate;
    }
  }

  while (best.tntCount - 1 >= tntFloor) {
    const candidate = evaluateBudgetCandidate(
      templateLevel,
      preferred,
      best.hayCells,
      best.tntCount - 1
    );
    if (candidate.replay.successRate < minReplaySuccessRate) {
      break;
    }
    best = candidate;
  }

  for (const step of [4, 2, 1]) {
    while (best.hayCells - step >= hayFloor) {
      const candidate = evaluateBudgetCandidate(
        templateLevel,
        preferred,
        best.hayCells - step,
        best.tntCount
      );
      if (candidate.replay.successRate < minReplaySuccessRate) {
        break;
      }
      best = candidate;
    }
  }

  return best;
}

function easeBudgetToDifficultyCap(
  templateLevel: LevelDefinition,
  preferred: DeterministicSolution,
  baseline: BudgetEvaluation,
  maxDifficulty: number,
  goalPct: number,
  maxHay: number,
  maxTnt: number
) {
  let best = baseline;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const hayRatio = ratio(preferred.hayCells, best.hayCells);
    const tntRatio = ratio(preferred.tntCount, best.tntCount);
    const difficulty = difficultyFromRatios(hayRatio, tntRatio, goalPct, best.replay.successRate);
    if (difficulty <= maxDifficulty) {
      break;
    }

    let nextHay = best.hayCells;
    let nextTnt = best.tntCount;
    const hayPressure = hayRatio ?? 0;
    const tntPressure = tntRatio ?? 0;
    if (hayPressure >= tntPressure && nextHay < maxHay) {
      nextHay = Math.min(maxHay, nextHay + Math.max(1, Math.ceil(preferred.hayCells * 0.12)));
    } else if (nextTnt < maxTnt) {
      nextTnt = Math.min(maxTnt, nextTnt + 1);
    } else if (nextHay < maxHay) {
      nextHay = Math.min(maxHay, nextHay + Math.max(1, Math.ceil(preferred.hayCells * 0.12)));
    } else {
      break;
    }

    if (nextHay === best.hayCells && nextTnt === best.tntCount) {
      break;
    }

    best = evaluateBudgetCandidate(templateLevel, preferred, nextHay, nextTnt);
  }

  return best;
}

function buildSolvedTemplate(template: CampaignTemplate, preferred: DeterministicSolution): SolvedTemplate {
  let grantedHay = budgetFromTarget(preferred.hayCells, template.targetRatio);
  let grantedTnt = budgetFromTarget(preferred.tntCount, template.targetRatio);
  if (template.band === "tnt") {
    grantedTnt = Math.max(grantedTnt, 1);
  }
  const level = cloneLevel(template.level);
  const maxHay = maxBudgetFromFloor(preferred.hayCells);
  const maxTnt = maxBudgetFromFloor(preferred.tntCount);
  const tightHayFloor = budgetFromTarget(preferred.hayCells, template.targetRatio);
  const tightTntFloor = budgetFromTarget(preferred.tntCount, template.targetRatio);
  const minTntBudget = template.band === "tnt" ? Math.max(1, tightTntFloor) : tightTntFloor;

  let replayEvaluation: ReplayEvaluation = {
    successCount: 0,
    attemptCount: LIVE_REPLAY_SEEDS.length,
    successRate: 0
  };
  for (let attempt = 0; attempt < MAX_BUDGET_TUNING_ATTEMPTS; attempt += 1) {
    replayEvaluation = evaluateBudgetCandidate(
      level,
      preferred,
      grantedHay,
      grantedTnt
    ).replay;
    if (replayEvaluation.successRate >= template.minReplaySuccessRate) {
      break;
    }

    const nextHay =
      preferred.hayCells > 0
        ? Math.min(maxHay, grantedHay + Math.max(2, Math.ceil(preferred.hayCells * 0.18)))
        : grantedHay;
    const nextTnt = preferred.tntCount > 0 && grantedTnt < maxTnt ? Math.min(maxTnt, grantedTnt + 1) : grantedTnt;

    if (nextHay === grantedHay && nextTnt === grantedTnt) {
      break;
    }

    grantedHay = nextHay;
    grantedTnt = nextTnt;
  }

  if (replayEvaluation.successRate < template.minReplaySuccessRate) {
    throw new Error(
      `Granted-budget replay plan stayed too fragile in live simulation for ${template.key}.`
    );
  }

  const thresholdBudget = evaluateBudgetCandidate(level, preferred, grantedHay, grantedTnt);
  const bufferedBudget = evaluateBudgetCandidate(
    level,
    preferred,
    Math.min(maxHay, grantedHay + forgivenessBuffer(preferred.hayCells)),
    preferred.tntCount > 0 ? Math.min(maxTnt, grantedTnt + 1) : grantedTnt
  );
  const searchStart =
    bufferedBudget.replay.successRate > thresholdBudget.replay.successRate ? bufferedBudget : thresholdBudget;
  const tightenedBudget = tightenBudgetToReplayThreshold(
    level,
    preferred,
    searchStart,
    template.minReplaySuccessRate,
    tightHayFloor,
    minTntBudget
  );
  const easedBudget = easeBudgetToDifficultyCap(
    level,
    preferred,
    tightenedBudget,
    template.maxDifficulty,
    template.level.completionPct,
    maxHay,
    maxTnt
  );
  grantedHay = easedBudget.hayCells;
  grantedTnt = easedBudget.tntCount;
  replayEvaluation = easedBudget.replay;
  level.resourceBudget = {
    hayCells: grantedHay,
    tntCount: grantedTnt
  };

  const errors = validateLevel(level, "en");
  if (errors.length) {
    throw new Error(`Generated invalid level ${template.key}: ${errors[0]}`);
  }

  const hayRatio = ratio(preferred.hayCells, grantedHay);
  const tntRatio = ratio(preferred.tntCount, grantedTnt);
  const difficulty = difficultyFromRatios(
    hayRatio,
    tntRatio,
    template.level.completionPct,
    replayEvaluation.successRate
  );

  if (difficulty > template.maxDifficulty + 0.01) {
    throw new Error(`Generated level ${template.key} remained above the difficulty cap.`);
  }

  return {
    sequence: template.sequence,
    band: template.band,
    dominantMechanic: template.dominantMechanic,
    enCore: template.enCore,
    zhCore: template.zhCore,
    targetRatio: template.targetRatio,
    goalPct: template.level.completionPct,
    preferred,
    level,
    difficulty,
    hayRatio,
    tntRatio,
    replaySuccessRate: replayEvaluation.successRate
  };
}

function validateCampaignCandidate(spec: CampaignSpec, solved: SolvedTemplate) {
  if (solved.level.completionPct < 0.5 || solved.level.completionPct > 1) {
    return false;
  }
  if (solved.difficulty < spec.minDifficulty || solved.difficulty > spec.maxDifficulty) {
    return false;
  }
  return validateTemplateLayout(spec, solved.level) && validateDeterministicPressure(spec, solved.level, solved.preferred);
}

function validateCampaignSet(levels: SolvedTemplate[]) {
  const goals = levels.map((level) => level.level.completionPct);
  if (goals.some((goal) => goal < 0.5 || goal > 1)) {
    throw new Error("Campaign goals must stay between 50% and 100%.");
  }

  const hashes = new Set<string>();
  for (const level of levels) {
    const hash = levelHash(level.level);
    if (hashes.has(hash)) {
      throw new Error("Campaign generator produced duplicate layouts.");
    }
    hashes.add(hash);
  }

  for (let index = 11; index < levels.length; index += 1) {
    if (levels[index].difficulty + 0.01 < levels[index - 1].difficulty) {
      throw new Error("Final test difficulty regressed out of order.");
    }
  }
}

function generateSolvedCampaignLevel(spec: CampaignSpec, sequence: number) {
  const attemptBudget = spec.generationAttempts ?? MAX_CAMPAIGN_GENERATION_ATTEMPTS;
  for (let attempt = 0; attempt < attemptBudget; attempt += 1) {
    const template = buildProceduralTemplate(spec, sequence, attempt);
    if (
      template.level.fireSources.length !== spec.fireCount ||
      template.level.structures.length !== spec.structureCount
    ) {
      continue;
    }
    if (validateLevel(template.level, "en").length) {
      continue;
    }
    if (!validateTemplateLayout(spec, template.level)) {
      continue;
    }

    try {
      const preferred = choosePreferredSolution(template);
      if (!preferred || !validateDeterministicPressure(spec, template.level, preferred)) {
        continue;
      }

      const solved = buildSolvedTemplate(template, preferred);
      if (validateCampaignCandidate(spec, solved)) {
        return solved;
      }
    } catch {
      continue;
    }
  }

  throw new Error(`Could not generate a valid campaign level for ${spec.key}.`);
}

export function generateCampaignLevelDebug(index: number) {
  if (index < 0 || index >= CAMPAIGN_SPECS.length) {
    throw new Error(`Campaign generator currently supports indexes between 0 and ${CAMPAIGN_SPECS.length - 1}.`);
  }

  const solved = generateSolvedCampaignLevel(CAMPAIGN_SPECS[index], index);
  const { finalLevels, reportRows } = applyFinalIdentity([solved]);
  return {
    level: finalLevels[0],
    reportRow: reportRows[0]
  };
}

function applyFinalIdentity(levels: SolvedTemplate[]) {
  const finalLevels: LevelDefinition[] = [];
  const enNames: Record<string, string> = {};
  const zhHansNames: Record<string, string> = {};
  const reportRows: CampaignReportRow[] = [];

  levels.forEach((entry, index) => {
    const order = index + 1;
    const id = `campaign-${String(order).padStart(3, "0")}`;
    const name = `${order}: ${entry.enCore}`;
    const zhName = `${order}: ${entry.zhCore}`;
    const level = cloneLevel(entry.level);
    level.id = id;
    level.name = name;
    finalLevels.push(level);
    enNames[id] = name;
    zhHansNames[id] = zhName;
    reportRows.push({
      order,
      id,
      band: entry.band,
      dominantMechanic: entry.dominantMechanic,
      name,
      zhName,
      goalPct: entry.goalPct,
      minHay: entry.preferred.hayCells,
      minTnt: entry.preferred.tntCount,
      grantedHay: level.resourceBudget.hayCells,
      grantedTnt: level.resourceBudget.tntCount,
      hayRatio: entry.hayRatio,
      tntRatio: entry.tntRatio,
      replaySuccessRate: entry.replaySuccessRate,
      difficulty: entry.difficulty
    });
  });

  return { finalLevels, enNames, zhHansNames, reportRows };
}

export function generateCampaign(
  count = 20,
  onProgress?: (progress: CampaignGenerationProgress) => void
): GeneratedCampaignData {
  if (count < 1 || count > CAMPAIGN_SPECS.length) {
    throw new Error(`Campaign generator currently supports between 1 and ${CAMPAIGN_SPECS.length} levels.`);
  }

  const solved = CAMPAIGN_SPECS.slice(0, count).map((spec, index) => {
    const level = generateSolvedCampaignLevel(spec, index);
    onProgress?.({
      index: index + 1,
      count,
      key: spec.key,
      name: spec.enCore,
      difficulty: level.difficulty
    });
    return level;
  });
  validateCampaignSet(solved);
  const { finalLevels, enNames, zhHansNames, reportRows } = applyFinalIdentity(solved);

  return {
    levels: finalLevels,
    enNames,
    zhHansNames,
    reportRows
  };
}

export function renderCampaignReport(reportRows: CampaignReportRow[]) {
  const lines = [
    "# Generated Campaign Report",
    "",
    "| # | Band | Mechanic | Level | Goal | Min Hay | Min TNT | Grant Hay | Grant TNT | Hay Ratio | TNT Ratio | Replay | Difficulty |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"
  ];

  for (const row of reportRows) {
    lines.push(
      `| ${row.order} | ${row.band} | ${row.dominantMechanic} | ${row.name} | ${Math.round(row.goalPct * 100)}% | ${row.minHay} | ${row.minTnt} | ${row.grantedHay} | ${row.grantedTnt} | ${row.hayRatio?.toFixed(2) ?? "-"} | ${row.tntRatio?.toFixed(2) ?? "-"} | ${Math.round(row.replaySuccessRate * 100)}% | ${row.difficulty.toFixed(2)} |`
    );
  }

  return `${lines.join("\n")}\n`;
}

export function renderGeneratedCampaignModule(data: GeneratedCampaignData) {
  return `import type { LevelDefinition } from "./types";

export const GENERATED_CAMPAIGN_LEVELS: LevelDefinition[] = ${JSON.stringify(data.levels, null, 2)};

export const GENERATED_CAMPAIGN_NAME_MAP_EN: Record<string, string> = ${JSON.stringify(
    data.enNames,
    null,
    2
  )};

export const GENERATED_CAMPAIGN_NAME_MAP_ZH_HANS: Record<string, string> = ${JSON.stringify(
    data.zhHansNames,
    null,
    2
  )};
`;
}

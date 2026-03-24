import { GRID_SIZE } from "./constants";
import type { Locale } from "../i18n";
import { getDefaultCustomLevelName } from "../i18n";
import { validateLevel } from "./level-io";
import { createStructure } from "./structureCatalog";
import type {
  EditorTool,
  LevelDefinition,
  Point,
  StructureDefinition,
  TerrainTile,
  TerrainType
} from "./types";

function clonePoint(point: Point): Point {
  return { x: point.x, y: point.y };
}

function cloneStructure(structure: StructureDefinition): StructureDefinition {
  return {
    ...structure,
    origin: clonePoint(structure.origin),
    size: clonePoint(structure.size)
  };
}

function cloneTerrainTile(tile: TerrainTile): TerrainTile {
  return {
    ...tile
  };
}

export function cloneLevel(level: LevelDefinition): LevelDefinition {
  return {
    ...level,
    resourceBudget: { ...level.resourceBudget },
    fireSources: level.fireSources.map(clonePoint),
    structures: level.structures.map(cloneStructure),
    terrainTiles: (level.terrainTiles ?? []).map(cloneTerrainTile)
  };
}

export function createBlankLevel(id = "custom-level", locale: Locale = "en"): LevelDefinition {
  return {
    id,
    name: getDefaultCustomLevelName(locale),
    gridSize: GRID_SIZE,
    resourceBudget: { hayCells: 56, tntCount: 2 },
    completionPct: 0.6,
    fireSources: [{ x: 2, y: 2 }],
    structures: [createStructure("hut-1", "hut", { x: 24, y: 24 })],
    terrainTiles: []
  };
}

export function buildOccupancy(level: LevelDefinition): Map<string, string> {
  const occupied = new Map<string, string>();
  for (const source of level.fireSources) {
    occupied.set(`${source.x},${source.y}`, "fire");
  }
  for (const structure of level.structures) {
    for (let y = structure.origin.y; y < structure.origin.y + structure.size.y; y += 1) {
      for (let x = structure.origin.x; x < structure.origin.x + structure.size.x; x += 1) {
        occupied.set(`${x},${y}`, structure.id);
      }
    }
  }
  return occupied;
}

export function buildTerrainMap(level: LevelDefinition): Map<string, TerrainType> {
  return new Map((level.terrainTiles ?? []).map((tile) => [`${tile.x},${tile.y}`, tile.type]));
}

export function toggleFireSource(level: LevelDefinition, point: Point): LevelDefinition {
  const next = cloneLevel(level);
  const index = next.fireSources.findIndex((source) => source.x === point.x && source.y === point.y);
  const occupied = buildOccupancy(next);
  const terrain = buildTerrainMap(next);
  const key = `${point.x},${point.y}`;
  if (index >= 0) {
    next.fireSources.splice(index, 1);
    if (!next.fireSources.length) {
      next.fireSources.push(clonePoint(point));
    }
    return next;
  }
  if (!occupied.has(key) && !terrain.has(key)) {
    next.fireSources.push(clonePoint(point));
  }
  return next;
}

export function placeStructure(
  level: LevelDefinition,
  type: Extract<EditorTool, "hut" | "house" | "hall">,
  point: Point
): LevelDefinition {
  const next = cloneLevel(level);
  const structure = createStructure(`${type}-${Date.now()}-${Math.random()}`, type, point);
  const occupied = buildOccupancy(next);
  const terrain = buildTerrainMap(next);

  if (
    structure.origin.x + structure.size.x > GRID_SIZE ||
    structure.origin.y + structure.size.y > GRID_SIZE
  ) {
    return next;
  }

  for (let y = structure.origin.y; y < structure.origin.y + structure.size.y; y += 1) {
    for (let x = structure.origin.x; x < structure.origin.x + structure.size.x; x += 1) {
      const key = `${x},${y}`;
      if (occupied.has(key) || terrain.has(key)) {
        return next;
      }
    }
  }

  next.structures.push(structure);
  return next;
}

export function paintTerrain(level: LevelDefinition, type: TerrainType, point: Point): LevelDefinition {
  const next = cloneLevel(level);
  const occupied = buildOccupancy(next);
  const key = `${point.x},${point.y}`;
  if (occupied.has(key)) {
    return next;
  }

  const existing = next.terrainTiles.findIndex((tile) => tile.x === point.x && tile.y === point.y);
  if (existing >= 0) {
    next.terrainTiles[existing] = { x: point.x, y: point.y, type };
  } else {
    next.terrainTiles.push({ x: point.x, y: point.y, type });
  }
  return next;
}

export function removeAt(level: LevelDefinition, point: Point): LevelDefinition {
  const next = cloneLevel(level);
  const fireIndex = next.fireSources.findIndex((source) => source.x === point.x && source.y === point.y);
  if (fireIndex >= 0) {
    if (next.fireSources.length > 1) {
      next.fireSources.splice(fireIndex, 1);
    }
    return next;
  }

  const structure = next.structures.find(
    (item) =>
      point.x >= item.origin.x &&
      point.x < item.origin.x + item.size.x &&
      point.y >= item.origin.y &&
      point.y < item.origin.y + item.size.y
  );
  if (structure) {
    next.structures = next.structures.filter((item) => item.id !== structure.id);
    return next;
  }

  next.terrainTiles = next.terrainTiles.filter((tile) => tile.x !== point.x || tile.y !== point.y);
  return next;
}

export function isLevelValid(level: LevelDefinition): boolean {
  return validateLevel(level, "en").length === 0;
}

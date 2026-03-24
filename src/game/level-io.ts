import type { Locale } from "../i18n";
import { getTranslations } from "../i18n";
import { GRID_SIZE } from "./constants";
import type {
  ExportedLevelFile,
  LevelDefinition,
  Point,
  ResourceBudget,
  StructureDefinition,
  TerrainTile,
  TerrainType
} from "./types";

/*
 * This file is the level file boundary for the project.
 * Keep the validation strict and the error messages user-facing because the
 * editor/import flows surface these strings directly to players/authors.
 */
const MAX_RESOURCE_BUDGET = 999;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isInteger(value: unknown): value is number {
  return Number.isInteger(value);
}

function isPoint(value: unknown): value is Point {
  return (
    isObject(value) &&
    isInteger(value.x) &&
    isInteger(value.y) &&
    value.x >= 0 &&
    value.y >= 0
  );
}

function isResourceBudget(value: unknown): value is ResourceBudget {
  return (
    isObject(value) &&
    isInteger(value.hayCells) &&
    isInteger(value.tntCount) &&
    value.hayCells >= 0 &&
    value.hayCells <= MAX_RESOURCE_BUDGET &&
    value.tntCount >= 0 &&
    value.tntCount <= MAX_RESOURCE_BUDGET
  );
}

function isStructureDefinition(value: unknown): value is StructureDefinition {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    (value.type === "hut" || value.type === "house" || value.type === "hall") &&
    isPoint(value.origin) &&
    isPoint(value.size) &&
    isInteger(value.maxHp) &&
    value.maxHp > 0
  );
}

function isTerrainType(value: unknown): value is TerrainType {
  return value === "deepWater" || value === "wetTerrain" || value === "wall";
}

function isTerrainTile(value: unknown): value is TerrainTile {
  return isObject(value) && isPoint(value) && isTerrainType(value.type);
}

export function validateLevel(level: LevelDefinition, locale: Locale): string[] {
  const messages = getTranslations(locale).levelIO;
  const errors: string[] = [];
  if (!level.id.trim()) {
    errors.push(messages.requiredLevelId);
  }
  if (!level.name.trim()) {
    errors.push(messages.requiredLevelName);
  }
  if (level.gridSize !== GRID_SIZE) {
    errors.push(messages.gridSizeMustBe(GRID_SIZE));
  }
  if (!level.fireSources.length) {
    errors.push(messages.fireSourceRequired);
  }
  if (!level.structures.length) {
    errors.push(messages.structureRequired);
  }
  if (level.completionPct <= 0 || level.completionPct > 1) {
    errors.push(messages.completionThreshold);
  }
  if (level.resourceBudget.hayCells < 0 || level.resourceBudget.tntCount < 0) {
    errors.push(messages.resourceBudgetNegative);
  }
  if (
    level.resourceBudget.hayCells > MAX_RESOURCE_BUDGET ||
    level.resourceBudget.tntCount > MAX_RESOURCE_BUDGET
  ) {
    errors.push(messages.resourceBudgetRange(MAX_RESOURCE_BUDGET));
  }

  const occupied = new Map<string, string>();
  const occupy = (x: number, y: number, label: string) => {
    const key = `${x},${y}`;
    if (occupied.has(key)) {
      errors.push(messages.overlapDetected(key, occupied.get(key) ?? "", label));
      return;
    }
    occupied.set(key, label);
  };

  for (const source of level.fireSources) {
    if (source.x < 0 || source.x >= GRID_SIZE || source.y < 0 || source.y >= GRID_SIZE) {
      errors.push(messages.fireSourceOutOfBounds(source.x, source.y));
      continue;
    }
    occupy(source.x, source.y, messages.occupancyFireSource);
  }

  for (const terrain of level.terrainTiles ?? []) {
    if (terrain.x < 0 || terrain.x >= GRID_SIZE || terrain.y < 0 || terrain.y >= GRID_SIZE) {
      errors.push(messages.terrainOutOfBounds(terrain.x, terrain.y));
      continue;
    }
    occupy(terrain.x, terrain.y, messages.occupancyTerrain(terrain.type));
  }

  for (const structure of level.structures) {
    if (structure.origin.x < 0 || structure.origin.y < 0) {
      errors.push(messages.structureStartsOutOfBounds(structure.id));
      continue;
    }
    if (
      structure.origin.x + structure.size.x > GRID_SIZE ||
      structure.origin.y + structure.size.y > GRID_SIZE
    ) {
      errors.push(messages.structureExceedsGrid(structure.id));
      continue;
    }
    for (let y = structure.origin.y; y < structure.origin.y + structure.size.y; y += 1) {
      for (let x = structure.origin.x; x < structure.origin.x + structure.size.x; x += 1) {
        occupy(x, y, messages.occupancyStructure(structure.id));
      }
    }
  }

  return errors;
}

export function serializeLevel(level: LevelDefinition): string {
  const payload: ExportedLevelFile = {
    version: 2,
    level
  };
  return JSON.stringify(payload, null, 2);
}

export function parseLevelFile(raw: string, locale: Locale): LevelDefinition {
  const messages = getTranslations(locale).levelIO;
  // Imported files must cross the same validation boundary as authored levels.
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error(messages.malformedFile);
  }
  if (
    !isObject(parsed) ||
    (parsed.version !== 1 && parsed.version !== 2) ||
    !isObject(parsed.level)
  ) {
    throw new Error(messages.unsupportedFile);
  }
  const level = parsed.level as Record<string, unknown>;
  const terrainTilesRaw = parsed.version === 2 ? level.terrainTiles : [];
  if (
    typeof level.id !== "string" ||
    typeof level.name !== "string" ||
    !isInteger(level.gridSize) ||
    !isResourceBudget(level.resourceBudget) ||
    typeof level.completionPct !== "number" ||
    !Array.isArray(level.fireSources) ||
    !Array.isArray(level.structures) ||
    !Array.isArray(terrainTilesRaw)
  ) {
    throw new Error(messages.malformedFile);
  }

  const definition: LevelDefinition = {
    id: level.id,
    name: level.name,
    gridSize: level.gridSize,
    resourceBudget: level.resourceBudget,
    completionPct: level.completionPct,
    fireSources: level.fireSources.map((point) => {
      if (!isPoint(point)) {
        throw new Error(messages.invalidFireSourceCoordinates);
      }
      return point;
    }),
    structures: level.structures.map((structure) => {
      if (!isStructureDefinition(structure)) {
        throw new Error(messages.invalidStructureDefinition);
      }
      return structure;
    }),
    terrainTiles: terrainTilesRaw.map((tile) => {
      if (!isTerrainTile(tile)) {
        throw new Error(messages.invalidTerrainTileDefinition);
      }
      return tile;
    })
  };

  const errors = validateLevel(definition, locale);
  if (errors.length) {
    throw new Error(errors[0]);
  }

  return definition;
}

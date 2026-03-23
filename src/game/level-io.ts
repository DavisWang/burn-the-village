import { GRID_SIZE } from "./constants";
import type {
  ExportedLevelFile,
  LevelDefinition,
  Point,
  ResourceBudget,
  StructureDefinition
} from "./types";

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
    value.tntCount >= 0
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

export function validateLevel(level: LevelDefinition): string[] {
  const errors: string[] = [];
  if (!level.id.trim()) {
    errors.push("Level id is required.");
  }
  if (!level.name.trim()) {
    errors.push("Level name is required.");
  }
  if (level.gridSize !== GRID_SIZE) {
    errors.push(`Grid size must be ${GRID_SIZE}.`);
  }
  if (!level.fireSources.length) {
    errors.push("At least one fire source is required.");
  }
  if (!level.structures.length) {
    errors.push("At least one structure is required.");
  }
  if (level.completionPct <= 0 || level.completionPct > 1) {
    errors.push("Completion threshold must be between 0 and 1.");
  }
  if (level.resourceBudget.hayCells < 0 || level.resourceBudget.tntCount < 0) {
    errors.push("Resource budgets cannot be negative.");
  }

  const occupied = new Map<string, string>();
  const occupy = (x: number, y: number, label: string) => {
    const key = `${x},${y}`;
    if (occupied.has(key)) {
      errors.push(`Overlap detected at ${key} (${occupied.get(key)} and ${label}).`);
      return;
    }
    occupied.set(key, label);
  };

  for (const source of level.fireSources) {
    if (source.x < 0 || source.x >= GRID_SIZE || source.y < 0 || source.y >= GRID_SIZE) {
      errors.push(`Fire source at ${source.x},${source.y} is out of bounds.`);
      continue;
    }
    occupy(source.x, source.y, "fire source");
  }

  for (const structure of level.structures) {
    if (structure.origin.x < 0 || structure.origin.y < 0) {
      errors.push(`Structure ${structure.id} starts out of bounds.`);
      continue;
    }
    if (
      structure.origin.x + structure.size.x > GRID_SIZE ||
      structure.origin.y + structure.size.y > GRID_SIZE
    ) {
      errors.push(`Structure ${structure.id} exceeds the grid bounds.`);
      continue;
    }
    for (let y = structure.origin.y; y < structure.origin.y + structure.size.y; y += 1) {
      for (let x = structure.origin.x; x < structure.origin.x + structure.size.x; x += 1) {
        occupy(x, y, `structure:${structure.id}`);
      }
    }
  }

  return errors;
}

export function serializeLevel(level: LevelDefinition): string {
  const payload: ExportedLevelFile = {
    version: 1,
    level
  };
  return JSON.stringify(payload, null, 2);
}

export function parseLevelFile(raw: string): LevelDefinition {
  const parsed = JSON.parse(raw) as unknown;
  if (!isObject(parsed) || parsed.version !== 1 || !isObject(parsed.level)) {
    throw new Error("File is not a supported Burn the Village level.");
  }
  const level = parsed.level as Record<string, unknown>;
  if (
    typeof level.id !== "string" ||
    typeof level.name !== "string" ||
    !isInteger(level.gridSize) ||
    !isResourceBudget(level.resourceBudget) ||
    typeof level.completionPct !== "number" ||
    !Array.isArray(level.fireSources) ||
    !Array.isArray(level.structures)
  ) {
    throw new Error("Level file is malformed.");
  }

  const definition: LevelDefinition = {
    id: level.id,
    name: level.name,
    gridSize: level.gridSize,
    resourceBudget: level.resourceBudget,
    completionPct: level.completionPct,
    fireSources: level.fireSources.map((point) => {
      if (!isPoint(point)) {
        throw new Error("Invalid fire source coordinates.");
      }
      return point;
    }),
    structures: level.structures.map((structure) => {
      if (!isStructureDefinition(structure)) {
        throw new Error("Invalid structure definition.");
      }
      return structure;
    })
  };

  const errors = validateLevel(definition);
  if (errors.length) {
    throw new Error(errors[0]);
  }

  return definition;
}

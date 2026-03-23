export type RunOutcomeState = "active" | "successLocked" | "successResolved" | "failed";
export type StructureType = "hut" | "house" | "hall";
export type ToolKind = "hay" | "tnt";
export type EditorTool = "fire" | "hut" | "house" | "hall" | "erase";
export type Medal = "none" | "bronze" | "silver" | "gold";
export type CellMaterial = "empty" | "fireSource" | "hay" | "tnt" | "structure";
export type CellLifecycle = "idle" | "burning" | "ash" | "fuse" | "spent" | "rubble";

export interface Point {
  x: number;
  y: number;
}

export interface ResourceBudget {
  hayCells: number;
  tntCount: number;
}

export interface StructureDefinition {
  id: string;
  type: StructureType;
  origin: Point;
  size: Point;
  maxHp: number;
}

export interface LevelDefinition {
  id: string;
  name: string;
  gridSize: number;
  resourceBudget: ResourceBudget;
  completionPct: number;
  fireSources: Point[];
  structures: StructureDefinition[];
}

export interface ExportedLevelFile {
  version: 1;
  level: LevelDefinition;
}

export interface GridCell {
  material: CellMaterial;
  lifecycle: CellLifecycle;
  hp: number;
  maxHp: number;
  structureId: string | null;
  structureType: StructureType | null;
  scorch: number;
  burnTicksRemaining: number;
  fuseTicksRemaining: number;
}

export interface ExplosionEvent {
  center: Point;
  ttl: number;
}

export interface SimulationState {
  level: LevelDefinition;
  seed: number;
  tick: number;
  speedIndex: number;
  hayRemaining: number;
  tntRemaining: number;
  grid: GridCell[][];
  activeExplosions: ExplosionEvent[];
  totalStructureCells: number;
  destroyedStructureCells: number;
  destructionPct: number;
  score: number;
  medal: Medal;
  outcome: RunOutcomeState;
  successTick: number | null;
}

export interface LevelCatalogEntry {
  level: LevelDefinition;
  source: "built-in" | "custom";
}

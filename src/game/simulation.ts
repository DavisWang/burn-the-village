import { SPEED_OPTIONS } from "./constants";
import { getBrushFootprint } from "./brushes";
import { createRng, nextSeed } from "./rng";
import type {
  CellTerrain,
  GridCell,
  LevelDefinition,
  Medal,
  Point,
  SimulationState
} from "./types";

/*
 * This module is the authoritative gameplay rules engine.
 * Scene code should treat these helpers as the only place that decides ignition,
 * burn/fuse timing, scoring, medals, and win/fail transitions.
 */
const HAY_BURN_TICKS = 3;
const TNT_FUSE_TICKS = 2;
const EXPLOSION_TTL = 3;
const EXPLOSION_RADIUS = 2;
const MEDAL_DESTRUCTION_THRESHOLDS = {
  bronze: 0.8,
  silver: 0.9,
  gold: 1
} as const;

function createEmptyCell(): GridCell {
  return {
    terrain: "ground",
    material: "empty",
    lifecycle: "idle",
    hp: 0,
    maxHp: 0,
    structureId: null,
    structureType: null,
    scorch: 0,
    burnTicksRemaining: 0,
    fuseTicksRemaining: 0
  };
}

function isPlaceableGround(cell: GridCell): boolean {
  return (
    !isTerrainBlocked(cell.terrain) &&
    (
      cell.material === "empty" ||
      (cell.material === "hay" && cell.lifecycle === "ash") ||
      (cell.material === "tnt" && cell.lifecycle === "spent") ||
      (cell.material === "structure" && cell.lifecycle === "rubble")
    )
  );
}

function isTerrainBlocked(terrain: CellTerrain): boolean {
  return terrain === "deepWater" || terrain === "wall";
}

function isWetTerrain(terrain: CellTerrain): boolean {
  return terrain === "wetTerrain";
}

function cloneGrid(grid: GridCell[][]): GridCell[][] {
  return grid.map((row) => row.map((cell) => ({ ...cell })));
}

function cloneTerrain(grid: GridCell[][]): CellTerrain[][] {
  return grid.map((row) => row.map((cell) => cell.terrain));
}

function computeMedal(destructionPct: number): Medal {
  if (destructionPct >= MEDAL_DESTRUCTION_THRESHOLDS.gold) {
    return "gold";
  }
  if (destructionPct >= MEDAL_DESTRUCTION_THRESHOLDS.silver) {
    return "silver";
  }
  if (destructionPct >= MEDAL_DESTRUCTION_THRESHOLDS.bronze) {
    return "bronze";
  }
  return "none";
}

function updateMetrics(state: SimulationState): SimulationState {
  let destroyed = 0;
  for (const row of state.grid) {
    for (const cell of row) {
      if (cell.material === "structure" && cell.lifecycle === "rubble") {
        destroyed += 1;
      }
    }
  }
  state.destroyedStructureCells = destroyed;
  state.destructionPct =
    state.totalStructureCells === 0 ? 0 : destroyed / state.totalStructureCells;
  const hayUsedRatio =
    state.level.resourceBudget.hayCells === 0
      ? 0
      : (state.level.resourceBudget.hayCells - state.hayRemaining) /
        state.level.resourceBudget.hayCells;
  const tntUsedRatio =
    state.level.resourceBudget.tntCount === 0
      ? 0
      : (state.level.resourceBudget.tntCount - state.tntRemaining) /
        state.level.resourceBudget.tntCount;
  state.score = Math.max(
    0,
    Math.min(
      1000,
      Math.round(state.destructionPct * 1000 - hayUsedRatio * 200 - tntUsedRatio * 300)
    )
  );
  state.medal = computeMedal(state.destructionPct);
  return state;
}

export function getMedalDestructionThresholds() {
  return MEDAL_DESTRUCTION_THRESHOLDS;
}

function buildInitialGrid(level: LevelDefinition): {
  grid: GridCell[][];
  totalStructureCells: number;
} {
  const grid = Array.from({ length: level.gridSize }, () =>
    Array.from({ length: level.gridSize }, createEmptyCell)
  );

  for (const terrain of level.terrainTiles ?? []) {
    grid[terrain.y][terrain.x].terrain = terrain.type;
  }

  for (const source of level.fireSources) {
    grid[source.y][source.x] = {
      ...createEmptyCell(),
      terrain: grid[source.y][source.x].terrain,
      material: "fireSource",
      lifecycle: "burning"
    };
  }

  let totalStructureCells = 0;
  for (const structure of level.structures) {
    for (let y = structure.origin.y; y < structure.origin.y + structure.size.y; y += 1) {
      for (let x = structure.origin.x; x < structure.origin.x + structure.size.x; x += 1) {
        grid[y][x] = {
          ...createEmptyCell(),
          terrain: grid[y][x].terrain,
          material: "structure",
          structureId: structure.id,
          structureType: structure.type,
          hp: structure.maxHp,
          maxHp: structure.maxHp
        };
        totalStructureCells += 1;
      }
    }
  }

  return { grid, totalStructureCells };
}

function hasTransientFire(state: SimulationState): boolean {
  for (const row of state.grid) {
    for (const cell of row) {
      if (
        (cell.material === "hay" || cell.material === "structure") &&
        cell.lifecycle === "burning"
      ) {
        return true;
      }
      if (cell.material === "tnt" && cell.lifecycle === "fuse") {
        return true;
      }
    }
  }
  return false;
}

function isIgnitionSource(cell: GridCell): boolean {
  return (
    cell.material === "fireSource" ||
    ((cell.material === "hay" || cell.material === "structure") &&
      cell.lifecycle === "burning")
  );
}

function cardinalNeighbors(point: Point, size: number): Point[] {
  return [
    { x: point.x + 1, y: point.y },
    { x: point.x - 1, y: point.y },
    { x: point.x, y: point.y + 1 },
    { x: point.x, y: point.y - 1 }
  ].filter((neighbor) => neighbor.x >= 0 && neighbor.y >= 0 && neighbor.x < size && neighbor.y < size);
}

function countBurningNeighbors(grid: GridCell[][], point: Point): number {
  return cardinalNeighbors(point, grid.length).reduce((count, neighbor) => {
    return count + (isIgnitionSource(grid[neighbor.y][neighbor.x]) ? 1 : 0);
  }, 0);
}

function countCombustibleNeighbors(grid: GridCell[][], point: Point): number {
  return cardinalNeighbors(point, grid.length).reduce((count, neighbor) => {
    const cell = grid[neighbor.y][neighbor.x];
    const combustible =
      !isTerrainBlocked(cell.terrain) &&
      (
        cell.material === "hay" ||
        cell.material === "fireSource" ||
        cell.material === "structure"
      );
    return count + (combustible ? 1 : 0);
  }, 0);
}

function traceRayPoints(start: Point, end: Point): Point[] {
  const points: Point[] = [];
  let x0 = start.x;
  let y0 = start.y;
  const x1 = end.x;
  const y1 = end.y;
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  while (x0 !== x1 || y0 !== y1) {
    const e2 = err * 2;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
    points.push({ x: x0, y: y0 });
  }

  return points;
}

function getBlastBlocker(
  center: Point,
  target: Point,
  terrainGrid: CellTerrain[][]
): { point: Point; terrain: CellTerrain } | null {
  for (const point of traceRayPoints(center, target)) {
    const terrain = terrainGrid[point.y][point.x];
    if (isTerrainBlocked(terrain)) {
      return { point, terrain };
    }
  }
  return null;
}

function hasPendingIgnition(state: SimulationState): boolean {
  for (let y = 0; y < state.level.gridSize; y += 1) {
    for (let x = 0; x < state.level.gridSize; x += 1) {
      const cell = state.grid[y][x];
      const canIgniteNextTick =
        (cell.material === "hay" || cell.material === "tnt") && cell.lifecycle === "idle";
      if (!canIgniteNextTick) {
        continue;
      }
      if (countBurningNeighbors(state.grid, { x, y }) > 0) {
        return true;
      }
    }
  }
  return false;
}

function maybeTriggerFailure(state: SimulationState): SimulationState {
  // Runs should not fail just because the player spent the last resource.
  // Failure only happens once there is no transient fire left and nothing
  // already placed can ignite on the next tick.
  if (
    state.outcome === "active" &&
    state.hayRemaining === 0 &&
    state.tntRemaining === 0 &&
    state.destructionPct < state.level.completionPct &&
    !hasTransientFire(state) &&
    !hasPendingIgnition(state)
  ) {
    state.outcome = "failed";
  }
  return state;
}

function finalizeIfResolved(state: SimulationState): SimulationState {
  if (state.outcome === "successLocked" && !hasTransientFire(state)) {
    state.outcome = "successResolved";
  }
  return state;
}

export function createSimulation(level: LevelDefinition, seed = nextSeed()): SimulationState {
  const { grid, totalStructureCells } = buildInitialGrid(level);
  return updateMetrics({
    level,
    seed,
    tick: 0,
    speedIndex: 2,
    hayRemaining: level.resourceBudget.hayCells,
    tntRemaining: level.resourceBudget.tntCount,
    grid,
    activeExplosions: [],
    totalStructureCells,
    destroyedStructureCells: 0,
    destructionPct: 0,
    score: 0,
    medal: "none",
    outcome: "active",
    successTick: null
  });
}

export function resetSimulation(state: SimulationState): SimulationState {
  return createSimulation(state.level, nextSeed(state.seed));
}

export function setSpeedIndex(state: SimulationState, nextIndex: number): SimulationState {
  return {
    ...state,
    speedIndex: Math.max(0, Math.min(SPEED_OPTIONS.length - 1, nextIndex))
  };
}

export function applyHayBrush(
  state: SimulationState,
  center: Point,
  brushIndex: number
): SimulationState {
  if (state.outcome !== "active") {
    return state;
  }

  const next = {
    ...state,
    grid: cloneGrid(state.grid)
  };
  const footprint = getBrushFootprint(center, brushIndex, next.level.gridSize);

  for (const cellPoint of footprint) {
    const { x, y } = cellPoint;
    if (next.hayRemaining <= 0) {
      return maybeTriggerFailure(updateMetrics(next));
    }
    const cell = next.grid[y][x];
    if (!isPlaceableGround(cell)) {
      continue;
    }
    next.grid[y][x] = {
      ...createEmptyCell(),
      terrain: cell.terrain,
      material: "hay"
    };
    next.hayRemaining -= 1;
  }

  return maybeTriggerFailure(updateMetrics(next));
}

export function placeTnt(state: SimulationState, point: Point): SimulationState {
  if (state.outcome !== "active" || state.tntRemaining <= 0) {
    return state;
  }
  const cell = state.grid[point.y]?.[point.x];
  if (!cell || !isPlaceableGround(cell)) {
    return state;
  }

  const next = {
    ...state,
    tntRemaining: state.tntRemaining - 1,
    grid: cloneGrid(state.grid)
  };
  next.grid[point.y][point.x] = {
    ...createEmptyCell(),
    terrain: cell.terrain,
    material: "tnt"
  };
  return maybeTriggerFailure(updateMetrics(next));
}

export function stepSimulation(state: SimulationState): SimulationState {
  if (state.outcome === "failed" || state.outcome === "successResolved") {
    return state;
  }

  // Tick order matters:
  // 1. Read ignition opportunities from the previous state.
  // 2. Apply new burn/fuse states onto the next grid.
  // 3. Advance active burning/fusing cells.
  // 4. Resolve explosions and chain reactions.
  // 5. Recompute metrics and outcome transitions.
  const next: SimulationState = {
    ...state,
    tick: state.tick + 1,
    grid: cloneGrid(state.grid),
    activeExplosions: state.activeExplosions
      .map((explosion) => ({ ...explosion, ttl: explosion.ttl - 1 }))
      .filter((explosion) => explosion.ttl > 0)
  };
  const rng = createRng(state.seed ^ next.tick);
  const toIgniteHay = new Set<string>();
  const toIgniteStructure = new Set<string>();
  const toFuseTnt = new Set<string>();

  for (let y = 0; y < state.level.gridSize; y += 1) {
    for (let x = 0; x < state.level.gridSize; x += 1) {
      const cell = state.grid[y][x];
      if (!isIgnitionSource(cell)) {
        continue;
      }
      for (const neighbor of cardinalNeighbors({ x, y }, state.level.gridSize)) {
        const target = state.grid[neighbor.y][neighbor.x];
        if (isTerrainBlocked(target.terrain)) {
          continue;
        }
        if (target.material === "hay" && target.lifecycle === "idle") {
          const combustibles = countCombustibleNeighbors(state.grid, neighbor);
          const baseChance = Math.min(0.95, 0.7 + Math.max(0, combustibles - 1) * 0.1);
          const chance = isWetTerrain(target.terrain)
            ? Math.max(0.15, baseChance - 0.25)
            : baseChance;
          if (rng() <= chance) {
            toIgniteHay.add(`${neighbor.x},${neighbor.y}`);
          }
        } else if (target.material === "structure" && target.lifecycle === "idle") {
          const burningNeighbors = countBurningNeighbors(state.grid, neighbor);
          const chance = Math.min(0.85, 0.25 + burningNeighbors * 0.15);
          if (rng() <= chance) {
            toIgniteStructure.add(`${neighbor.x},${neighbor.y}`);
          }
        } else if (target.material === "tnt" && target.lifecycle === "idle") {
          toFuseTnt.add(`${neighbor.x},${neighbor.y}`);
        }
      }
    }
  }

  for (const key of toIgniteHay) {
    const [x, y] = key.split(",").map(Number);
    const cell = next.grid[y][x];
    cell.lifecycle = "burning";
    cell.burnTicksRemaining = HAY_BURN_TICKS;
  }

  for (const key of toIgniteStructure) {
    const [x, y] = key.split(",").map(Number);
    const cell = next.grid[y][x];
    cell.lifecycle = "burning";
  }

  for (const key of toFuseTnt) {
    const [x, y] = key.split(",").map(Number);
    const cell = next.grid[y][x];
    cell.lifecycle = "fuse";
    cell.fuseTicksRemaining = TNT_FUSE_TICKS;
  }

  const explosions: Point[] = [];
  for (let y = 0; y < next.level.gridSize; y += 1) {
    for (let x = 0; x < next.level.gridSize; x += 1) {
      const cell = next.grid[y][x];
      cell.scorch = Math.max(0, cell.scorch - 0.04);

      if (cell.material === "hay" && cell.lifecycle === "burning") {
        cell.burnTicksRemaining -= 1;
        cell.scorch = 1;
        if (cell.burnTicksRemaining <= 0) {
          cell.lifecycle = "ash";
        }
      } else if (cell.material === "structure" && cell.lifecycle === "burning") {
        cell.hp = Math.max(0, cell.hp - 1);
        cell.scorch = 1;
        if (cell.hp <= 0) {
          cell.lifecycle = "rubble";
        }
      } else if (cell.material === "tnt" && cell.lifecycle === "fuse") {
        cell.fuseTicksRemaining -= 1;
        if (cell.fuseTicksRemaining <= 0) {
          cell.lifecycle = "spent";
          cell.scorch = 1;
          explosions.push({ x, y });
        }
      }
    }
  }

  for (const center of explosions) {
    next.activeExplosions.push({ center, ttl: EXPLOSION_TTL });
    const terrainGrid = cloneTerrain(next.grid);
    for (let y = center.y - EXPLOSION_RADIUS; y <= center.y + EXPLOSION_RADIUS; y += 1) {
      for (let x = center.x - EXPLOSION_RADIUS; x <= center.x + EXPLOSION_RADIUS; x += 1) {
        if (x < 0 || y < 0 || x >= next.level.gridSize || y >= next.level.gridSize) {
          continue;
        }
        const blocker = getBlastBlocker(center, { x, y }, terrainGrid);
        if (blocker) {
          if (
            blocker.terrain === "wall" &&
            blocker.point.x === x &&
            blocker.point.y === y
          ) {
            const wall = next.grid[y][x];
            wall.terrain = "ground";
            wall.scorch = 1;
          }
          continue;
        }

        const target = next.grid[y][x];
        target.scorch = 1;
        if (target.material === "hay" && target.lifecycle === "idle") {
          target.lifecycle = "burning";
          target.burnTicksRemaining = HAY_BURN_TICKS;
        } else if (target.material === "structure") {
          if (target.lifecycle !== "rubble") {
            target.hp = Math.max(0, target.hp - 2);
            target.lifecycle = target.hp <= 0 ? "rubble" : "burning";
          }
        } else if (target.material === "tnt" && target.lifecycle === "idle") {
          target.lifecycle = "fuse";
          target.fuseTicksRemaining = 1;
        }
      }
    }
  }

  updateMetrics(next);
  if (next.outcome === "active" && next.destructionPct >= next.level.completionPct) {
    next.outcome = "successLocked";
    next.successTick = next.tick;
  }
  finalizeIfResolved(next);
  return next;
}

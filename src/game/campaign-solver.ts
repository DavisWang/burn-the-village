import type { CellTerrain, LevelDefinition, Point, StructureDefinition } from "./types";

const GRID_NEIGHBORS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 }
] as const;
const EXPLOSION_RADIUS = 2;
const WET_TERRAIN_HAY_COST = 2;
const MAX_TNT_PLAN_LENGTH = 2;
const TNT_HAY_EQUIVALENT = 8;

export interface DeterministicSolution {
  hayCells: number;
  tntCount: number;
  hayNetwork: Point[];
  tntPlan: Point[];
  directlyIgnitedStructureIds: string[];
  targetedStructureIds: string[];
  weightedCost: number;
}

export interface DeterministicSolveResult {
  frontier: DeterministicSolution[];
  preferred: DeterministicSolution | null;
}

interface SolveTarget {
  ids: string[];
  requiredCells: number;
}

interface TntCandidate {
  point: Point;
}

interface NetworkResult {
  cost: number;
  cells: Point[];
}

interface PathResult {
  cost: number;
  cells: Point[];
}

type TerrainGrid = CellTerrain[][];

function pointKey(point: Point) {
  return `${point.x},${point.y}`;
}

function cloneTerrainGrid(grid: TerrainGrid): TerrainGrid {
  return grid.map((row) => [...row]);
}

function createTerrainGrid(level: LevelDefinition): TerrainGrid {
  const grid = Array.from({ length: level.gridSize }, () =>
    Array.from({ length: level.gridSize }, () => "ground" as CellTerrain)
  );
  for (const tile of level.terrainTiles) {
    grid[tile.y][tile.x] = tile.type;
  }
  return grid;
}

function buildOccupiedCells(level: LevelDefinition) {
  const occupied = new Set<string>();
  for (const fireSource of level.fireSources) {
    occupied.add(pointKey(fireSource));
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

function buildStructureCellMap(level: LevelDefinition) {
  const byCell = new Map<string, StructureDefinition>();
  for (const structure of level.structures) {
    for (let y = structure.origin.y; y < structure.origin.y + structure.size.y; y += 1) {
      for (let x = structure.origin.x; x < structure.origin.x + structure.size.x; x += 1) {
        byCell.set(`${x},${y}`, structure);
      }
    }
  }
  return byCell;
}

function structureCellCount(structure: StructureDefinition) {
  return structure.size.x * structure.size.y;
}

function enumerateSolveTargets(level: LevelDefinition): SolveTarget[] {
  const totalCells = level.structures.reduce((sum, structure) => sum + structureCellCount(structure), 0);
  const requiredCells = Math.ceil(totalCells * level.completionPct);
  const structures = level.structures.map((structure) => ({
    id: structure.id,
    cells: structureCellCount(structure)
  }));

  const targets: SolveTarget[] = [];
  const subsetCount = 1 << structures.length;
  for (let mask = 1; mask < subsetCount; mask += 1) {
    const ids: string[] = [];
    let coveredCells = 0;
    for (let index = 0; index < structures.length; index += 1) {
      if ((mask & (1 << index)) === 0) {
        continue;
      }
      ids.push(structures[index].id);
      coveredCells += structures[index].cells;
    }
    if (coveredCells >= requiredCells) {
      targets.push({
        ids: ids.sort(),
        requiredCells: coveredCells
      });
    }
  }

  return targets.sort(
    (left, right) =>
      left.requiredCells - right.requiredCells ||
      left.ids.length - right.ids.length ||
      left.ids.join("|").localeCompare(right.ids.join("|"))
  );
}

function cellWeight(terrain: CellTerrain) {
  return terrain === "wetTerrain" ? WET_TERRAIN_HAY_COST : 1;
}

function isTerrainBlocked(terrain: CellTerrain) {
  return terrain === "deepWater" || terrain === "wall";
}

function sortPoints(points: Iterable<Point>) {
  return [...points].sort((left, right) => left.y - right.y || left.x - right.x);
}

function collectBoundaryCells(
  level: LevelDefinition,
  terrainGrid: TerrainGrid,
  occupied: Set<string>,
  points: Point[]
) {
  const cells = new Map<string, Point>();
  for (const point of points) {
    for (const neighbor of GRID_NEIGHBORS) {
      const x = point.x + neighbor.x;
      const y = point.y + neighbor.y;
      if (x < 0 || y < 0 || x >= level.gridSize || y >= level.gridSize) {
        continue;
      }
      const key = `${x},${y}`;
      if (occupied.has(key) || isTerrainBlocked(terrainGrid[y][x])) {
        continue;
      }
      cells.set(key, { x, y });
    }
  }
  return [...cells.values()];
}

function getStructureCells(structure: StructureDefinition) {
  const cells: Point[] = [];
  for (let y = structure.origin.y; y < structure.origin.y + structure.size.y; y += 1) {
    for (let x = structure.origin.x; x < structure.origin.x + structure.size.x; x += 1) {
      cells.push({ x, y });
    }
  }
  return cells;
}

function rootBoundaryCells(
  level: LevelDefinition,
  terrainGrid: TerrainGrid,
  occupied: Set<string>,
  directlyIgnitedStructureIds: Set<string>
) {
  const boundary = new Map<string, Point>();
  const sources: Point[] = [...level.fireSources];
  void directlyIgnitedStructureIds;
  for (const point of collectBoundaryCells(level, terrainGrid, occupied, sources)) {
    boundary.set(pointKey(point), point);
  }
  return [...boundary.values()];
}

function structureBoundaryCells(
  level: LevelDefinition,
  terrainGrid: TerrainGrid,
  occupied: Set<string>,
  structure: StructureDefinition
) {
  return collectBoundaryCells(level, terrainGrid, occupied, getStructureCells(structure));
}

function tntBoundaryCells(
  level: LevelDefinition,
  terrainGrid: TerrainGrid,
  occupied: Set<string>,
  tntPoint: Point
) {
  return collectBoundaryCells(level, terrainGrid, occupied, [tntPoint]);
}

function directedNodeDijkstra(
  level: LevelDefinition,
  terrainGrid: TerrainGrid,
  occupied: Set<string>,
  sourceCells: Point[],
  targetCells: Point[]
): PathResult | null {
  if (!sourceCells.length || !targetCells.length) {
    return null;
  }

  const targetKeys = new Set(targetCells.map(pointKey));
  const dist = Array.from({ length: level.gridSize }, () =>
    Array.from({ length: level.gridSize }, () => Number.POSITIVE_INFINITY)
  );
  const visited = Array.from({ length: level.gridSize }, () =>
    Array.from({ length: level.gridSize }, () => false)
  );
  const previous = new Map<string, string | null>();
  const queue: Point[] = [];

  for (const cell of sourceCells) {
    const key = pointKey(cell);
    const weight = cellWeight(terrainGrid[cell.y][cell.x]);
    if (weight < dist[cell.y][cell.x]) {
      dist[cell.y][cell.x] = weight;
      previous.set(key, null);
      queue.push(cell);
    }
  }

  let bestTarget: Point | null = null;
  while (queue.length) {
    let bestIndex = 0;
    for (let index = 1; index < queue.length; index += 1) {
      const candidate = queue[index];
      const currentBest = queue[bestIndex];
      if (dist[candidate.y][candidate.x] < dist[currentBest.y][currentBest.x]) {
        bestIndex = index;
      }
    }

    const current = queue.splice(bestIndex, 1)[0];
    if (visited[current.y][current.x]) {
      continue;
    }
    visited[current.y][current.x] = true;

    if (targetKeys.has(pointKey(current))) {
      bestTarget = current;
      break;
    }

    for (const neighbor of GRID_NEIGHBORS) {
      const nextX = current.x + neighbor.x;
      const nextY = current.y + neighbor.y;
      if (nextX < 0 || nextY < 0 || nextX >= level.gridSize || nextY >= level.gridSize) {
        continue;
      }
      const nextKey = `${nextX},${nextY}`;
      if (occupied.has(nextKey) || isTerrainBlocked(terrainGrid[nextY][nextX])) {
        continue;
      }
      const candidateCost = dist[current.y][current.x] + cellWeight(terrainGrid[nextY][nextX]);
      if (candidateCost < dist[nextY][nextX]) {
        dist[nextY][nextX] = candidateCost;
        previous.set(nextKey, pointKey(current));
        queue.push({ x: nextX, y: nextY });
      }
    }
  }

  if (!bestTarget) {
    return null;
  }

  const cells: Point[] = [];
  let cursor: string | null = pointKey(bestTarget);
  while (cursor) {
    const [x, y] = cursor.split(",").map(Number);
    cells.push({ x, y });
    cursor = previous.get(cursor) ?? null;
  }
  cells.reverse();

  return {
    cost: dist[bestTarget.y][bestTarget.x],
    cells
  };
}

function computeNetwork(
  level: LevelDefinition,
  terrainGrid: TerrainGrid,
  occupied: Set<string>,
  targetStructureIds: Set<string>,
  directlyIgnitedStructureIds: Set<string>,
  tntPlan: Point[]
): NetworkResult | null {
  const terminalGroups: Point[][] = [];
  const rootCells = rootBoundaryCells(level, terrainGrid, occupied, directlyIgnitedStructureIds);
  if (!rootCells.length) {
    return null;
  }
  terminalGroups.push(rootCells);

  for (const structure of level.structures) {
    if (!targetStructureIds.has(structure.id)) {
      continue;
    }
    if (directlyIgnitedStructureIds.has(structure.id)) {
      continue;
    }
    const boundary = structureBoundaryCells(level, terrainGrid, occupied, structure);
    if (!boundary.length) {
      return null;
    }
    terminalGroups.push(boundary);
  }

  for (const point of tntPlan) {
    if (occupied.has(pointKey(point)) || isTerrainBlocked(terrainGrid[point.y][point.x])) {
      return null;
    }
    const boundary = tntBoundaryCells(level, terrainGrid, occupied, point);
    if (!boundary.length) {
      return null;
    }
    terminalGroups.push(boundary);
  }

  if (terminalGroups.length === 1) {
    return { cost: 0, cells: [] };
  }

  const edges: Array<{ left: number; right: number; path: PathResult }> = [];
  for (let left = 0; left < terminalGroups.length; left += 1) {
    for (let right = left + 1; right < terminalGroups.length; right += 1) {
      const path = directedNodeDijkstra(level, terrainGrid, occupied, terminalGroups[left], terminalGroups[right]);
      if (!path) {
        continue;
      }
      edges.push({ left, right, path });
    }
  }

  edges.sort((left, right) => left.path.cost - right.path.cost);
  const parent = Array.from({ length: terminalGroups.length }, (_, index) => index);
  const rank = Array.from({ length: terminalGroups.length }, () => 0);
  const find = (value: number): number => {
    if (parent[value] !== value) {
      parent[value] = find(parent[value]);
    }
    return parent[value];
  };
  const unite = (left: number, right: number) => {
    const rootLeft = find(left);
    const rootRight = find(right);
    if (rootLeft === rootRight) {
      return false;
    }
    if (rank[rootLeft] < rank[rootRight]) {
      parent[rootLeft] = rootRight;
    } else if (rank[rootLeft] > rank[rootRight]) {
      parent[rootRight] = rootLeft;
    } else {
      parent[rootRight] = rootLeft;
      rank[rootLeft] += 1;
    }
    return true;
  };

  const usedCells = new Map<string, Point>();
  let usedEdges = 0;
  for (const edge of edges) {
    if (!unite(edge.left, edge.right)) {
      continue;
    }
    usedEdges += 1;
    for (const cell of edge.path.cells) {
      usedCells.set(pointKey(cell), cell);
    }
    if (usedEdges === terminalGroups.length - 1) {
      break;
    }
  }

  if (usedEdges !== terminalGroups.length - 1) {
    return null;
  }

  const cells = sortPoints(usedCells.values());
  const cost = cells.reduce((sum, cell) => sum + cellWeight(terrainGrid[cell.y][cell.x]), 0);
  return { cost, cells };
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
    const doubled = err * 2;
    if (doubled >= dy) {
      err += dy;
      x0 += sx;
    }
    if (doubled <= dx) {
      err += dx;
      y0 += sy;
    }
    points.push({ x: x0, y: y0 });
  }

  return points;
}

function getBlastBlocker(center: Point, target: Point, terrainGrid: TerrainGrid) {
  for (const point of traceRayPoints(center, target)) {
    const terrain = terrainGrid[point.y][point.x];
    if (isTerrainBlocked(terrain)) {
      return { point, terrain };
    }
  }
  return null;
}

function simulateExplosion(
  level: LevelDefinition,
  terrainGrid: TerrainGrid,
  structureCellMap: Map<string, StructureDefinition>,
  center: Point
) {
  const nextTerrain = cloneTerrainGrid(terrainGrid);
  const ignitedStructureIds = new Set<string>();
  const breachedWalls = new Set<string>();

  for (let y = center.y - EXPLOSION_RADIUS; y <= center.y + EXPLOSION_RADIUS; y += 1) {
    for (let x = center.x - EXPLOSION_RADIUS; x <= center.x + EXPLOSION_RADIUS; x += 1) {
      if (x < 0 || y < 0 || x >= level.gridSize || y >= level.gridSize) {
        continue;
      }
      const blocker = getBlastBlocker(center, { x, y }, terrainGrid);
      if (blocker) {
        if (blocker.terrain === "wall" && blocker.point.x === x && blocker.point.y === y) {
          nextTerrain[y][x] = "ground";
          breachedWalls.add(`${x},${y}`);
        }
        continue;
      }

      const structure = structureCellMap.get(`${x},${y}`);
      if (structure) {
        ignitedStructureIds.add(structure.id);
      }
    }
  }

  return {
    terrain: nextTerrain,
    ignitedStructureIds,
    breachedWalls
  };
}

function enumerateTntCandidates(level: LevelDefinition) {
  const occupied = buildOccupiedCells(level);
  const terrainGrid = createTerrainGrid(level);
  const structureCellMap = buildStructureCellMap(level);
  const candidates = new Map<string, TntCandidate>();
  const interestingCells = new Set<string>();

  for (const tile of level.terrainTiles) {
    if (tile.type === "wall") {
      interestingCells.add(`${tile.x},${tile.y}`);
    }
  }
  for (const structure of level.structures) {
    for (const cell of getStructureCells(structure)) {
      interestingCells.add(pointKey(cell));
    }
  }

  for (const key of interestingCells) {
    const [centerX, centerY] = key.split(",").map(Number);
    for (let y = centerY - EXPLOSION_RADIUS; y <= centerY + EXPLOSION_RADIUS; y += 1) {
      for (let x = centerX - EXPLOSION_RADIUS; x <= centerX + EXPLOSION_RADIUS; x += 1) {
        if (x < 0 || y < 0 || x >= level.gridSize || y >= level.gridSize) {
          continue;
        }
        const cellKey = `${x},${y}`;
        if (occupied.has(cellKey) || isTerrainBlocked(terrainGrid[y][x])) {
          continue;
        }
        const effect = simulateExplosion(level, terrainGrid, structureCellMap, { x, y });
        if (!effect.breachedWalls.size && !effect.ignitedStructureIds.size) {
          continue;
        }
        const signature = [
          [...effect.breachedWalls].sort().join("|"),
          [...effect.ignitedStructureIds].sort().join("|")
        ].join("::");
        const current = candidates.get(signature);
        if (!current || x < current.point.x || (x === current.point.x && y < current.point.y)) {
          candidates.set(signature, { point: { x, y } });
        }
      }
    }
  }

  return [...candidates.values()]
    .map((candidate) => candidate.point)
    .sort((left, right) => {
      const leftDistance = Math.min(
        ...level.fireSources.map((source) => Math.abs(source.x - left.x) + Math.abs(source.y - left.y))
      );
      const rightDistance = Math.min(
        ...level.fireSources.map((source) => Math.abs(source.x - right.x) + Math.abs(source.y - right.y))
      );
      return leftDistance - rightDistance || left.y - right.y || left.x - right.x;
    })
    .slice(0, 14)
    .map((point) => ({ point }));
}

function pruneFrontier(solutions: DeterministicSolution[]) {
  const frontier: DeterministicSolution[] = [];
  const ordered = [...solutions].sort(
    (left, right) =>
      left.tntCount - right.tntCount ||
      left.hayCells - right.hayCells ||
      left.weightedCost - right.weightedCost
  );

  for (const candidate of ordered) {
    const dominated = frontier.some(
      (existing) =>
        existing.hayCells <= candidate.hayCells &&
        existing.tntCount <= candidate.tntCount &&
        (existing.hayCells < candidate.hayCells || existing.tntCount < candidate.tntCount)
    );
    if (dominated) {
      continue;
    }

    for (let index = frontier.length - 1; index >= 0; index -= 1) {
      const existing = frontier[index];
      if (
        candidate.hayCells <= existing.hayCells &&
        candidate.tntCount <= existing.tntCount &&
        (candidate.hayCells < existing.hayCells || candidate.tntCount < existing.tntCount)
      ) {
        frontier.splice(index, 1);
      }
    }
    frontier.push(candidate);
  }

  return frontier.sort(
    (left, right) =>
      left.weightedCost - right.weightedCost ||
      left.tntCount - right.tntCount ||
      left.hayCells - right.hayCells
  );
}

function stringifyUsedTnt(usedTnt: Point[]) {
  return usedTnt.map(pointKey).join("|");
}

function solveState(
  level: LevelDefinition,
  terrainGrid: TerrainGrid,
  occupied: Set<string>,
  structureCellMap: Map<string, StructureDefinition>,
  candidates: TntCandidate[],
  targetStructureIds: Set<string>,
  directlyIgnitedStructureIds: Set<string>,
  usedTnt: Point[],
  seen: Set<string>,
  solutions: DeterministicSolution[]
) {
  const network = computeNetwork(
    level,
    terrainGrid,
    occupied,
    targetStructureIds,
    directlyIgnitedStructureIds,
    usedTnt
  );
  if (network) {
    solutions.push({
      hayCells: network.cost,
      tntCount: usedTnt.length,
      hayNetwork: network.cells,
      tntPlan: [...usedTnt],
      directlyIgnitedStructureIds: [...directlyIgnitedStructureIds].sort(),
      targetedStructureIds: [...targetStructureIds].sort(),
      weightedCost: network.cost + usedTnt.length * TNT_HAY_EQUIVALENT
    });
  }

  if (usedTnt.length >= MAX_TNT_PLAN_LENGTH) {
    return;
  }

  for (const candidate of candidates) {
    if (usedTnt.some((used) => used.x === candidate.point.x && used.y === candidate.point.y)) {
      continue;
    }

    const prefixNetwork = computeNetwork(
      level,
      terrainGrid,
      occupied,
      targetStructureIds,
      directlyIgnitedStructureIds,
      [...usedTnt, candidate.point]
    );
    if (!prefixNetwork) {
      continue;
    }

    const effect = simulateExplosion(level, terrainGrid, structureCellMap, candidate.point);
    const nextIgnited = new Set(directlyIgnitedStructureIds);
    let changed = false;
    for (const structureId of effect.ignitedStructureIds) {
      if (!targetStructureIds.has(structureId)) {
        continue;
      }
      if (!nextIgnited.has(structureId)) {
        nextIgnited.add(structureId);
        changed = true;
      }
    }
    if (effect.breachedWalls.size) {
      changed = true;
    }
    if (!changed) {
      continue;
    }

    const nextUsedTnt = [...usedTnt, candidate.point];
    const key = [
      stringifyUsedTnt(nextUsedTnt),
      [...nextIgnited].sort().join("|"),
      level.terrainTiles
        .filter((tile) => tile.type === "wall")
        .map((tile) => `${tile.x},${tile.y}:${effect.terrain[tile.y][tile.x]}`)
        .join("|")
    ].join("::");
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    solveState(
      level,
      effect.terrain,
      occupied,
      structureCellMap,
      candidates,
      targetStructureIds,
      nextIgnited,
      nextUsedTnt,
      seen,
      solutions
    );
  }
}

function solveDeterministicTarget(level: LevelDefinition, targetIds: string[]) {
  const occupied = buildOccupiedCells(level);
  const terrainGrid = createTerrainGrid(level);
  const structureCellMap = buildStructureCellMap(level);
  const candidates = enumerateTntCandidates(level);
  const solutions: DeterministicSolution[] = [];
  const seen = new Set<string>();
  const targetStructureIds = new Set(targetIds);

  solveState(
    level,
    terrainGrid,
    occupied,
    structureCellMap,
    candidates,
    targetStructureIds,
    new Set<string>(),
    [],
    seen,
    solutions
  );

  return pruneFrontier(solutions);
}

export function solveDeterministicLevel(level: LevelDefinition): DeterministicSolveResult {
  const allSolutions: DeterministicSolution[] = [];
  for (const target of enumerateSolveTargets(level)) {
    allSolutions.push(...solveDeterministicTarget(level, target.ids));
  }

  const frontier = pruneFrontier(allSolutions);
  return {
    frontier,
    preferred: frontier[0] ?? null
  };
}

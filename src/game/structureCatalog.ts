import type { Point, StructureDefinition, StructureType } from "./types";

const STRUCTURE_STATS: Record<
  StructureType,
  { size: Point; hp: number }
> = {
  hut: { size: { x: 3, y: 3 }, hp: 4 },
  house: { size: { x: 5, y: 5 }, hp: 6 },
  hall: { size: { x: 7, y: 5 }, hp: 8 }
};

export function getStructureStats(type: StructureType) {
  return STRUCTURE_STATS[type];
}

export function createStructure(
  id: string,
  type: StructureType,
  origin: Point
): StructureDefinition {
  const stats = STRUCTURE_STATS[type];
  return {
    id,
    type,
    origin,
    size: { ...stats.size },
    maxHp: stats.hp
  };
}

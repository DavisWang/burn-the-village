import { BRUSH_OPTIONS } from "./constants";
import type { Point } from "./types";

export function getBrushSize(brushIndex: number) {
  return BRUSH_OPTIONS[Math.max(0, Math.min(BRUSH_OPTIONS.length - 1, brushIndex))].size;
}

export function getBrushFootprint(origin: Point, brushIndex: number, gridSize: number): Point[] {
  const size = getBrushSize(brushIndex);
  const isEven = size % 2 === 0;
  const startX = isEven ? origin.x : origin.x - Math.floor(size / 2);
  const startY = isEven ? origin.y : origin.y - Math.floor(size / 2);
  const cells: Point[] = [];

  for (let y = startY; y < startY + size; y += 1) {
    for (let x = startX; x < startX + size; x += 1) {
      if (x >= 0 && y >= 0 && x < gridSize && y < gridSize) {
        cells.push({ x, y });
      }
    }
  }

  return cells;
}

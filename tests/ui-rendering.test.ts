import { describe, expect, it } from "vitest";

import { CELL_SIZE, COLORS, MAP_ORIGIN } from "../src/game/constants";
import { createSimulation } from "../src/game/simulation";
import type { LevelDefinition } from "../src/game/types";
import { getGrassTextureFrame, getStructureTextureFrame, getTerrainTextureFrame } from "../src/ui/board-textures";
import { drawLevelThumbnail, drawSimulationBoard } from "../src/ui/board-renderer";
import { getPixelButtonLayerOrder, getPixelButtonSelectionOutlineMetrics } from "../src/ui/pixel-button-order";
import { getRankDisplay } from "../src/ui/rank-display";

type RectOp = {
  kind: "fillRect";
  color: number;
  alpha: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type CircleOp = {
  kind: "fillCircle";
  color: number;
  alpha: number;
  x: number;
  y: number;
  radius: number;
};

type StrokeRectOp = {
  kind: "strokeRect";
  color: number;
  alpha: number;
  width: number;
  x: number;
  y: number;
  rectWidth: number;
  rectHeight: number;
};

type DrawOp = RectOp | CircleOp | StrokeRectOp;

class GraphicsRecorder {
  public ops: DrawOp[] = [];
  private fill = { color: 0, alpha: 1 };
  private line = { color: 0, alpha: 1, width: 1 };

  clear() {
    this.ops = [];
    return this;
  }

  fillStyle(color: number, alpha = 1) {
    this.fill = { color, alpha };
    return this;
  }

  fillRect(x: number, y: number, width: number, height: number) {
    this.ops.push({ kind: "fillRect", color: this.fill.color, alpha: this.fill.alpha, x, y, width, height });
    return this;
  }

  fillCircle(x: number, y: number, radius: number) {
    this.ops.push({ kind: "fillCircle", color: this.fill.color, alpha: this.fill.alpha, x, y, radius });
    return this;
  }

  lineStyle(width: number, color: number, alpha = 1) {
    this.line = { width, color, alpha };
    return this;
  }

  strokeRect(x: number, y: number, rectWidth: number, rectHeight: number) {
    this.ops.push({
      kind: "strokeRect",
      color: this.line.color,
      alpha: this.line.alpha,
      width: this.line.width,
      x,
      y,
      rectWidth,
      rectHeight
    });
    return this;
  }
}

function makeLevel(overrides: Partial<LevelDefinition> = {}): LevelDefinition {
  return {
    id: "render-test",
    name: "RENDER TEST",
    gridSize: 32,
    resourceBudget: { hayCells: 3, tntCount: 1 },
    completionPct: 0.5,
    fireSources: [{ x: 0, y: 0 }],
    structures: [
      {
        id: "hut-1",
        type: "hut",
        origin: { x: 28, y: 28 },
        size: { x: 1, y: 1 },
        maxHp: 1
      }
    ],
    terrainTiles: [],
    ...overrides
  };
}

function findFullCellRectIndex(ops: DrawOp[], x: number, y: number, width: number, height: number, color: number) {
  return ops.findIndex(
    (op) =>
      op.kind === "fillRect" &&
      op.color === color &&
      op.x === x &&
      op.y === y &&
      op.width === width &&
      op.height === height
  );
}

describe("board textures", () => {
  it("uses more than a two-tone checkerboard for grass frames", () => {
    const colors = new Set<number>();
    for (let y = 0; y < 3; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        colors.add(getGrassTextureFrame({ x, y }).baseColor);
      }
    }

    expect(colors.size).toBeGreaterThan(2);
  });

  it("provides roof and wall detail data for each structure type", () => {
    const hut = getStructureTextureFrame("hut", { x: 1, y: 1 });
    const house = getStructureTextureFrame("house", { x: 1, y: 1 });
    const hall = getStructureTextureFrame("hall", { x: 1, y: 1 });

    expect(hut.roofColor).not.toBe(hut.wallColor);
    expect(house.roofShadeColor).not.toBe(house.roofColor);
    expect(hall.ridgeColor).not.toBe(hall.roofColor);
  });

  it("provides distinct frames for each terrain type", () => {
    const water = getTerrainTextureFrame("deepWater", { x: 1, y: 1 });
    const marsh = getTerrainTextureFrame("wetTerrain", { x: 1, y: 1 });
    const wall = getTerrainTextureFrame("wall", { x: 1, y: 1 });

    expect(water.baseColor).not.toBe(marsh.baseColor);
    expect(marsh.accentColor).not.toBe(wall.accentColor);
    expect(wall.detailAlpha).toBeGreaterThan(0);
  });

  it("animates water terrain frames over time without changing their base tile identity", () => {
    const waterAtStart = getTerrainTextureFrame("deepWater", { x: 2, y: 3 }, 0);
    const waterLater = getTerrainTextureFrame("deepWater", { x: 2, y: 3 }, 6);
    const marshAtStart = getTerrainTextureFrame("wetTerrain", { x: 4, y: 5 }, 0);
    const marshLater = getTerrainTextureFrame("wetTerrain", { x: 4, y: 5 }, 6);

    expect(waterAtStart.baseColor).toBe(waterLater.baseColor);
    expect(waterAtStart.accentX).not.toBe(waterLater.accentX);
    expect(waterAtStart.accentAlpha).not.toBe(waterLater.accentAlpha);
    expect(waterAtStart.detailAlpha).not.toBe(waterLater.detailAlpha);
    expect(marshAtStart.baseColor).toBe(marshLater.baseColor);
    expect(marshAtStart.accentY).not.toBe(marshLater.accentY);
    expect(marshAtStart.detailAlpha).not.toBe(marshLater.detailAlpha);
  });
});

describe("rank display", () => {
  it("maps ranks to title-cased labels and medal colors", () => {
    expect(getRankDisplay("bronze")).toEqual({ label: "Bronze", color: "#c58f52" });
    expect(getRankDisplay("silver")).toEqual({ label: "Silver", color: "#d8d1c4" });
    expect(getRankDisplay("gold")).toEqual({ label: "Gold", color: "#f4d35e" });
  });
});

describe("pixel button layering", () => {
  it("renders the selected outline above the panel fill", () => {
    const order = getPixelButtonLayerOrder();

    expect(order.indexOf("selectionOutline")).toBeGreaterThan(order.indexOf("panel"));
    expect(order.indexOf("selectionOutline")).toBeGreaterThan(order.indexOf("highlight"));
  });

  it("uses a thicker near-edge outline so selected buttons stay visible", () => {
    const outline = getPixelButtonSelectionOutlineMetrics();

    expect(outline.inset).toBeLessThanOrEqual(2);
    expect(outline.strokeWidth).toBeGreaterThanOrEqual(3);
  });
});

describe("board rendering", () => {
  it("renders terrain beneath scorch and material overlays on the simulation board", () => {
    const state = createSimulation(
      makeLevel({
        terrainTiles: [{ x: 1, y: 1, type: "wetTerrain" }]
      }),
      31
    );
    state.grid[1][1] = {
      ...state.grid[1][1],
      terrain: "wetTerrain",
      material: "hay",
      lifecycle: "idle",
      scorch: 1
    };

    const graphics = new GraphicsRecorder();
    drawSimulationBoard(graphics as never, state);

    const cellX = MAP_ORIGIN.x + CELL_SIZE;
    const cellY = MAP_ORIGIN.y + CELL_SIZE;
    const terrainColor = getTerrainTextureFrame("wetTerrain", { x: 1, y: 1 }).baseColor;
    const terrainIndex = findFullCellRectIndex(graphics.ops, cellX, cellY, CELL_SIZE, CELL_SIZE, terrainColor);
    const scorchIndex = findFullCellRectIndex(graphics.ops, cellX, cellY, CELL_SIZE, CELL_SIZE, COLORS.scorched);
    const hayIndex = findFullCellRectIndex(graphics.ops, cellX, cellY, CELL_SIZE, CELL_SIZE, COLORS.hayA);

    expect(terrainIndex).toBeGreaterThanOrEqual(0);
    expect(scorchIndex).toBeGreaterThan(terrainIndex);
    expect(hayIndex).toBeGreaterThan(scorchIndex);
  });

  it("renders terrain tiles in level thumbnails", () => {
    const graphics = new GraphicsRecorder();
    drawLevelThumbnail(
      graphics as never,
      makeLevel({
        terrainTiles: [{ x: 1, y: 1, type: "deepWater" }]
      }),
      0,
      0,
      64
    );

    const terrainColor = getTerrainTextureFrame("deepWater", { x: 1, y: 1 }).baseColor;
    expect(findFullCellRectIndex(graphics.ops, 2, 2, 2, 2, terrainColor)).toBeGreaterThanOrEqual(0);
  });

  it("renders breached wall tiles as normal ground after the terrain is cleared", () => {
    const level = makeLevel();
    const wallState = createSimulation(level, 32);
    wallState.grid[2][2].terrain = "wall";
    const wallGraphics = new GraphicsRecorder();
    drawSimulationBoard(wallGraphics as never, wallState);

    const breachedState = createSimulation(level, 32);
    breachedState.grid[2][2].terrain = "ground";
    const breachedGraphics = new GraphicsRecorder();
    drawSimulationBoard(breachedGraphics as never, breachedState);

    const cellX = MAP_ORIGIN.x + CELL_SIZE * 2;
    const cellY = MAP_ORIGIN.y + CELL_SIZE * 2;
    const wallColor = getTerrainTextureFrame("wall", { x: 2, y: 2 }).baseColor;

    expect(findFullCellRectIndex(wallGraphics.ops, cellX, cellY, CELL_SIZE, CELL_SIZE, wallColor)).toBeGreaterThanOrEqual(0);
    expect(findFullCellRectIndex(breachedGraphics.ops, cellX, cellY, CELL_SIZE, CELL_SIZE, wallColor)).toBe(-1);
  });
});

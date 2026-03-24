import Phaser from "phaser";

import {
  CANVAS_MARGIN,
  CELL_SIZE,
  COLORS,
  GRID_SIZE,
  HUD_HEIGHT,
  MAP_ORIGIN,
  MAP_SIZE,
  PANEL_HEIGHT,
  PANEL_WIDTH,
  SECTION_FRAME_BORDER,
  SIDEBAR_ORIGIN,
  SIDEBAR_WIDTH
} from "../game/constants";
import { buildOccupancy, buildTerrainMap } from "../game/editor-draft";
import type { CellTerrain, LevelDefinition, Point, SimulationState } from "../game/types";
import { getGrassTextureFrame, getStructureTextureFrame, getTerrainTextureFrame } from "./board-textures";
import { getCombustionFrame } from "./fire-animation";

/*
 * Rendering stays separate from gameplay rules on purpose.
 * Scenes pass in already-decided state, and this file draws the shared board,
 * frames, textures, and hover feedback without owning simulation decisions.
 */
function fillCell(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  color: number,
  alpha = 1
) {
  graphics.fillStyle(color, alpha);
  graphics.fillRect(MAP_ORIGIN.x + x * CELL_SIZE, MAP_ORIGIN.y + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

function drawGrassTile(
  graphics: Phaser.GameObjects.Graphics,
  cellX: number,
  cellY: number,
  tileX: number,
  tileY: number,
  tileSize: number
) {
  const frame = getGrassTextureFrame({ x: cellX, y: cellY });
  graphics.fillStyle(frame.baseColor, 1);
  graphics.fillRect(tileX, tileY, tileSize, tileSize);
  graphics.fillStyle(frame.patchColor, frame.patchAlpha);
  graphics.fillRect(
    tileX + (frame.patchX / CELL_SIZE) * tileSize,
    tileY + (frame.patchY / CELL_SIZE) * tileSize,
    Math.max(2, (frame.patchWidth / CELL_SIZE) * tileSize),
    Math.max(1.5, (frame.patchHeight / CELL_SIZE) * tileSize)
  );
  graphics.fillStyle(frame.bladeColor, frame.bladeAlpha);
  graphics.fillRect(
    tileX + (frame.bladeX / CELL_SIZE) * tileSize,
    tileY + tileSize - (frame.bladeHeight / CELL_SIZE) * tileSize - 1,
    Math.max(1, tileSize / 10),
    Math.max(2, (frame.bladeHeight / CELL_SIZE) * tileSize)
  );
  graphics.fillRect(
    tileX + (frame.bladeX2 / CELL_SIZE) * tileSize,
    tileY + tileSize - (frame.bladeHeight2 / CELL_SIZE) * tileSize - 1,
    Math.max(1, tileSize / 10),
    Math.max(2, (frame.bladeHeight2 / CELL_SIZE) * tileSize)
  );
}

function drawGrassCell(graphics: Phaser.GameObjects.Graphics, x: number, y: number) {
  drawGrassTile(graphics, x, y, MAP_ORIGIN.x + x * CELL_SIZE, MAP_ORIGIN.y + y * CELL_SIZE, CELL_SIZE);
}

function drawTerrainTile(
  graphics: Phaser.GameObjects.Graphics,
  terrain: CellTerrain,
  cellX: number,
  cellY: number,
  tileX: number,
  tileY: number,
  tileSize: number,
  tick = 0
) {
  if (terrain === "ground") {
    drawGrassTile(graphics, cellX, cellY, tileX, tileY, tileSize);
    return;
  }

  const frame = getTerrainTextureFrame(terrain, { x: cellX, y: cellY }, tick);
  graphics.fillStyle(frame.baseColor, 1);
  graphics.fillRect(tileX, tileY, tileSize, tileSize);
  graphics.fillStyle(frame.accentColor, frame.accentAlpha);
  graphics.fillRect(
    tileX + (frame.accentX / CELL_SIZE) * tileSize,
    tileY + (frame.accentY / CELL_SIZE) * tileSize,
    Math.max(2, (frame.accentWidth / CELL_SIZE) * tileSize),
    Math.max(1.5, (frame.accentHeight / CELL_SIZE) * tileSize)
  );
  graphics.fillStyle(frame.detailColor, frame.detailAlpha);
  graphics.fillRect(
    tileX + (frame.detailX / CELL_SIZE) * tileSize,
    tileY + (frame.detailY / CELL_SIZE) * tileSize,
    Math.max(1.5, (frame.detailWidth / CELL_SIZE) * tileSize),
    Math.max(1.5, (frame.detailHeight / CELL_SIZE) * tileSize)
  );
}

function drawBaseCell(
  graphics: Phaser.GameObjects.Graphics,
  terrain: CellTerrain,
  cellX: number,
  cellY: number,
  tick = 0
) {
  drawTerrainTile(
    graphics,
    terrain,
    cellX,
    cellY,
    MAP_ORIGIN.x + cellX * CELL_SIZE,
    MAP_ORIGIN.y + cellY * CELL_SIZE,
    CELL_SIZE,
    tick
  );
}

function drawStructureTile(
  graphics: Phaser.GameObjects.Graphics,
  structureType: "hut" | "house" | "hall",
  cellX: number,
  cellY: number,
  tileX: number,
  tileY: number,
  tileSize: number
) {
  const frame = getStructureTextureFrame(structureType, { x: cellX, y: cellY });
  const roofHeight = Math.max(8, Math.round(tileSize * 0.68));
  const wallHeight = tileSize - roofHeight;
  const ridgeWidth = Math.max(1, Math.round(tileSize * 0.14));
  const accentSize = Math.max(1, Math.round(tileSize * 0.1));

  graphics.fillStyle(frame.wallColor, 1);
  graphics.fillRect(tileX, tileY + roofHeight, tileSize, wallHeight);
  graphics.fillStyle(frame.wallShadeColor, 0.95);
  graphics.fillRect(tileX, tileY + roofHeight + Math.max(1, wallHeight - 2), tileSize, Math.max(1, wallHeight / 2));

  graphics.fillStyle(frame.roofColor, 1);
  graphics.fillRect(tileX, tileY, tileSize, roofHeight);
  graphics.fillStyle(frame.roofHighlightColor, 0.55);
  graphics.fillRect(tileX, tileY + 1, tileSize, Math.max(1, Math.round(tileSize * 0.12)));
  graphics.fillStyle(frame.roofShadeColor, 0.9);
  graphics.fillRect(tileX, tileY + roofHeight - Math.max(2, Math.round(tileSize * 0.18)), tileSize, Math.max(2, Math.round(tileSize * 0.18)));
  graphics.fillStyle(frame.ridgeColor, 0.95);
  graphics.fillRect(tileX + tileSize / 2 - ridgeWidth / 2, tileY + 1, ridgeWidth, roofHeight - 2);
  graphics.fillStyle(frame.roofHighlightColor, 0.35);
  graphics.fillRect(tileX + 1, tileY + Math.round(tileSize * 0.32), tileSize - 2, Math.max(1, Math.round(tileSize * 0.08)));
  graphics.fillRect(tileX + 1, tileY + Math.round(tileSize * 0.5), tileSize - 2, Math.max(1, Math.round(tileSize * 0.08)));
  graphics.fillStyle(frame.ridgeColor, 0.6);
  graphics.fillRect(
    tileX + (frame.accentX / CELL_SIZE) * tileSize,
    tileY + (frame.accentY / CELL_SIZE) * tileSize,
    accentSize,
    accentSize
  );
}

function drawAnimatedFlame(
  graphics: Phaser.GameObjects.Graphics,
  point: Point,
  frame: ReturnType<typeof getCombustionFrame>
) {
  const centerX = MAP_ORIGIN.x + point.x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = MAP_ORIGIN.y + point.y * CELL_SIZE + CELL_SIZE / 2;

  if (frame.glowAlpha > 0) {
    graphics.fillStyle(COLORS.fireB, frame.glowAlpha);
    graphics.fillCircle(centerX, centerY, Math.max(6, frame.coreRadius + 4));
  }

  if (frame.mode === "source") {
    graphics.fillStyle(COLORS.fireC, 1);
    graphics.fillCircle(centerX, centerY + frame.coreOffsetY, frame.coreRadius);
    graphics.fillStyle(COLORS.fireA, 1);
    graphics.fillCircle(
      centerX + frame.emberOffsetX,
      centerY + frame.emberOffsetY,
      Math.max(2, frame.coreRadius - 3)
    );
    graphics.fillStyle(COLORS.fireA, frame.emberAlpha);
    graphics.fillCircle(centerX + frame.emberOffsetX, centerY - 7, 1.5);
    return;
  }

  graphics.fillStyle(COLORS.fireC, 0.95);
  graphics.fillRect(
    MAP_ORIGIN.x + point.x * CELL_SIZE + frame.innerInsetX,
    MAP_ORIGIN.y + point.y * CELL_SIZE + frame.innerInsetY + frame.coreOffsetY,
    CELL_SIZE + frame.innerWidthOffset,
    CELL_SIZE + frame.innerHeightOffset
  );
  graphics.fillStyle(COLORS.fireA, frame.emberAlpha);
  graphics.fillRect(
    MAP_ORIGIN.x + point.x * CELL_SIZE + frame.innerInsetX + 1,
    MAP_ORIGIN.y + point.y * CELL_SIZE + frame.innerInsetY - 1,
    Math.max(3, CELL_SIZE + frame.innerWidthOffset - 3),
    Math.max(4, CELL_SIZE + frame.innerHeightOffset - 3)
  );
  graphics.fillStyle(COLORS.fireB, 0.85);
  graphics.fillRect(
    centerX - 1 + frame.emberOffsetX,
    centerY - 5 + frame.emberOffsetY,
    2,
    3
  );
}

function drawOuterPanel(graphics: Phaser.GameObjects.Graphics) {
  const outerX = CANVAS_MARGIN;
  const outerY = CANVAS_MARGIN;
  const outerWidth = PANEL_WIDTH;
  const outerHeight = PANEL_HEIGHT;

  graphics.fillStyle(COLORS.panelShadow, 1);
  graphics.fillRoundedRect(outerX + 8, outerY + 8, outerWidth, outerHeight, 18);
  graphics.fillStyle(COLORS.panel, 1);
  graphics.fillRoundedRect(outerX, outerY, outerWidth, outerHeight, 18);
  graphics.lineStyle(6, COLORS.frameLight, 1);
  graphics.strokeRoundedRect(outerX, outerY, outerWidth, outerHeight, 18);
  graphics.lineStyle(3, COLORS.frameDark, 1);
  graphics.strokeRoundedRect(outerX + 6, outerY + 6, outerWidth - 12, outerHeight - 12, 14);
}

export function drawPanelFrame(graphics: Phaser.GameObjects.Graphics) {
  graphics.clear();
  drawOuterPanel(graphics);
  // Game/editor/select scenes all depend on the same panel framing so visual
  // shifts stay centralized instead of drifting scene by scene.
  const mapFrameX = MAP_ORIGIN.x - SECTION_FRAME_BORDER;
  const mapFrameY = MAP_ORIGIN.y - SECTION_FRAME_BORDER;
  const mapFrameSize = MAP_SIZE + SECTION_FRAME_BORDER * 2;
  const sidebarFrameX = SIDEBAR_ORIGIN.x - SECTION_FRAME_BORDER;
  const sidebarFrameY = SIDEBAR_ORIGIN.y - SECTION_FRAME_BORDER;
  const sidebarFrameWidth = SIDEBAR_WIDTH + SECTION_FRAME_BORDER * 2;
  const hudFrameX = mapFrameX;
  const hudFrameY = mapFrameY + mapFrameSize + 12;
  const hudFrameWidth = sidebarFrameX + sidebarFrameWidth - hudFrameX;
  const hudFrameHeight = HUD_HEIGHT + SECTION_FRAME_BORDER * 2;

  graphics.fillStyle(0x22170f, 1);
  graphics.fillRect(mapFrameX, mapFrameY, mapFrameSize, mapFrameSize);
  graphics.lineStyle(4, COLORS.mapBorder, 1);
  graphics.strokeRect(mapFrameX, mapFrameY, mapFrameSize, mapFrameSize);

  graphics.fillStyle(0x24180f, 1);
  graphics.fillRect(sidebarFrameX, sidebarFrameY, sidebarFrameWidth, mapFrameSize);
  graphics.lineStyle(4, COLORS.frameDark, 1);
  graphics.strokeRect(sidebarFrameX, sidebarFrameY, sidebarFrameWidth, mapFrameSize);

  graphics.fillStyle(0x24180f, 1);
  graphics.fillRect(hudFrameX, hudFrameY, hudFrameWidth, hudFrameHeight);
  graphics.strokeRect(hudFrameX, hudFrameY, hudFrameWidth, hudFrameHeight);
}

export function drawMenuFrame(graphics: Phaser.GameObjects.Graphics) {
  graphics.clear();
  drawOuterPanel(graphics);
}

export function drawSimulationBoard(
  graphics: Phaser.GameObjects.Graphics,
  state: SimulationState,
  hoverCells: Point[] = []
) {
  // This mirrors simulation state only; it should never decide new game state.
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const cell = state.grid[y][x];
      drawBaseCell(graphics, cell.terrain, x, y, state.tick);
      if (cell.scorch > 0) {
        fillCell(graphics, x, y, COLORS.scorched, Math.min(0.65, cell.scorch * 0.55));
      }

      if (cell.material === "hay") {
        if (cell.lifecycle === "burning") {
          const frame = getCombustionFrame(cell.material, cell.lifecycle, state.tick, { x, y });
          fillCell(graphics, x, y, COLORS.fireC, 0.82);
          drawAnimatedFlame(graphics, { x, y }, frame);
        } else if (cell.lifecycle === "ash") {
          fillCell(graphics, x, y, COLORS.scorched, 0.85);
        } else {
          fillCell(graphics, x, y, COLORS.hayA, 0.95);
          graphics.fillStyle(COLORS.hayB, 0.8);
          graphics.fillRect(
            MAP_ORIGIN.x + x * CELL_SIZE + 2,
            MAP_ORIGIN.y + y * CELL_SIZE + 5,
            CELL_SIZE - 4,
            CELL_SIZE - 8
          );
        }
      } else if (cell.material === "fireSource") {
        drawAnimatedFlame(
          graphics,
          { x, y },
          getCombustionFrame(cell.material, cell.lifecycle, state.tick, { x, y })
        );
      } else if (cell.material === "tnt") {
        if (cell.lifecycle === "fuse") {
          fillCell(graphics, x, y, COLORS.tntFuse, 1);
          graphics.fillStyle(0xcc4444, 1);
          graphics.fillRect(
            MAP_ORIGIN.x + x * CELL_SIZE + 2,
            MAP_ORIGIN.y + y * CELL_SIZE + 6,
            CELL_SIZE - 4,
            4
          );
        } else if (cell.lifecycle === "spent") {
          fillCell(graphics, x, y, COLORS.scorched, 0.95);
          graphics.fillStyle(0x1a120d, 0.9);
          graphics.fillCircle(
            MAP_ORIGIN.x + x * CELL_SIZE + CELL_SIZE / 2,
            MAP_ORIGIN.y + y * CELL_SIZE + CELL_SIZE / 2,
            5
          );
          graphics.fillStyle(COLORS.fireB, 0.35);
          graphics.fillCircle(
            MAP_ORIGIN.x + x * CELL_SIZE + CELL_SIZE / 2,
            MAP_ORIGIN.y + y * CELL_SIZE + CELL_SIZE / 2,
            2
          );
        } else {
          fillCell(graphics, x, y, COLORS.tnt, 1);
          graphics.fillStyle(0xcc4444, 1);
          graphics.fillRect(
            MAP_ORIGIN.x + x * CELL_SIZE + 2,
            MAP_ORIGIN.y + y * CELL_SIZE + 6,
            CELL_SIZE - 4,
            4
          );
        }
      } else if (cell.material === "structure") {
        if (cell.lifecycle === "rubble") {
          fillCell(graphics, x, y, COLORS.structureRubble, 1);
        } else if (cell.lifecycle === "burning") {
          const frame = getCombustionFrame(cell.material, cell.lifecycle, state.tick, { x, y });
          fillCell(graphics, x, y, COLORS.structureBurning, 1);
          drawAnimatedFlame(graphics, { x, y }, frame);
        } else {
          drawStructureTile(
            graphics,
            cell.structureType === "hut"
              ? "hut"
              : cell.structureType === "house"
                ? "house"
                : "hall",
            x,
            y,
            MAP_ORIGIN.x + x * CELL_SIZE,
            MAP_ORIGIN.y + y * CELL_SIZE,
            CELL_SIZE
          );
        }
      }
    }
  }

  for (const hover of hoverCells) {
    graphics.lineStyle(2, COLORS.warning, 1);
    graphics.strokeRect(
      MAP_ORIGIN.x + hover.x * CELL_SIZE + 1,
      MAP_ORIGIN.y + hover.y * CELL_SIZE + 1,
      CELL_SIZE - 2,
      CELL_SIZE - 2
    );
  }

  for (const explosion of state.activeExplosions) {
    graphics.fillStyle(COLORS.fireA, explosion.ttl / 4);
    graphics.fillCircle(
      MAP_ORIGIN.x + explosion.center.x * CELL_SIZE + CELL_SIZE / 2,
      MAP_ORIGIN.y + explosion.center.y * CELL_SIZE + CELL_SIZE / 2,
      28 - explosion.ttl * 4
    );
  }
}

export function drawLevelBoard(
  graphics: Phaser.GameObjects.Graphics,
  level: LevelDefinition,
  hoverCells: Point[] = []
) {
  const occupied = buildOccupancy(level);
  const terrain = buildTerrainMap(level);
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      drawBaseCell(graphics, terrain.get(`${x},${y}`) ?? "ground", x, y);
      const key = `${x},${y}`;
      if (occupied.has(key)) {
        const structure = level.structures.find((item) => item.id === occupied.get(key));
        if (structure) {
          drawStructureTile(
            graphics,
            structure.type,
            x,
            y,
            MAP_ORIGIN.x + x * CELL_SIZE,
            MAP_ORIGIN.y + y * CELL_SIZE,
            CELL_SIZE
          );
        } else {
          graphics.fillStyle(COLORS.fireC, 1);
          graphics.fillCircle(
            MAP_ORIGIN.x + x * CELL_SIZE + CELL_SIZE / 2,
            MAP_ORIGIN.y + y * CELL_SIZE + CELL_SIZE / 2,
            6
          );
          graphics.fillStyle(COLORS.fireA, 1);
          graphics.fillCircle(
            MAP_ORIGIN.x + x * CELL_SIZE + CELL_SIZE / 2,
            MAP_ORIGIN.y + y * CELL_SIZE + CELL_SIZE / 2 - 1,
            3
          );
        }
      }
    }
  }

  for (const hover of hoverCells) {
    graphics.lineStyle(2, COLORS.warning, 1);
    graphics.strokeRect(
      MAP_ORIGIN.x + hover.x * CELL_SIZE + 1,
      MAP_ORIGIN.y + hover.y * CELL_SIZE + 1,
      CELL_SIZE - 2,
      CELL_SIZE - 2
    );
  }
}

export function drawLevelThumbnail(
  graphics: Phaser.GameObjects.Graphics,
  level: LevelDefinition,
  x: number,
  y: number,
  size: number
) {
  const occupied = buildOccupancy(level);
  const terrain = buildTerrainMap(level);
  const cell = size / GRID_SIZE;
  graphics.fillStyle(0x1d140d, 1);
  graphics.fillRect(x, y, size, size);
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let column = 0; column < GRID_SIZE; column += 1) {
      drawTerrainTile(
        graphics,
        terrain.get(`${column},${row}`) ?? "ground",
        column,
        row,
        x + column * cell,
        y + row * cell,
        cell
      );
      const key = `${column},${row}`;
      if (!occupied.has(key)) {
        continue;
      }
      const structure = level.structures.find((item) => item.id === occupied.get(key));
      if (structure) {
        drawStructureTile(graphics, structure.type, column, row, x + column * cell, y + row * cell, cell);
      } else {
        graphics.fillStyle(COLORS.fireB, 1);
        graphics.fillCircle(x + column * cell + cell / 2, y + row * cell + cell / 2, Math.max(1.5, cell * 0.2));
      }
    }
  }
  graphics.lineStyle(2, COLORS.frameLight, 1);
  graphics.strokeRect(x, y, size, size);
}

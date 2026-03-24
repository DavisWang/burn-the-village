import Phaser from "phaser";

import {
  BRUSH_OPTIONS,
  CANVAS_CENTER_X,
  CANVAS_HEIGHT,
  CELL_SIZE,
  COLORS,
  GRID_SIZE,
  HEADER_Y,
  HUD_ORIGIN,
  MAP_ORIGIN,
  MAP_SIZE,
  PANEL_WIDTH,
  SIDEBAR_ORIGIN,
  SPEED_OPTIONS,
  TICK_MS
} from "../game/constants";
import { BUILT_IN_LEVELS } from "../game/levels";
import { getBrushFootprint } from "../game/brushes";
import { getDefaultGameplayControls } from "../game/gameplay-controls";
import { session } from "../game/session";
import {
  applyHayBrush,
  createSimulation,
  placeTnt,
  resetSimulation,
  setSpeedIndex,
  stepSimulation
} from "../game/simulation";
import type { LevelDefinition, Point, SimulationState, ToolKind } from "../game/types";
import { drawPanelFrame, drawSimulationBoard } from "../ui/board-renderer";
import { getGameBottomStats, getGameSidebarLines } from "../ui/hud-content";
import {
  getGameHudStatSlots,
  getGameProgressBarLayout,
  getGameProgressMarkers,
  getGameSidebarLayout,
  getGameSummaryDepths,
  getGameSummaryLayout
} from "../ui/layout";
import { PixelButton } from "../ui/pixel-button";
import { getRankDisplay } from "../ui/rank-display";
import { PIXEL_FONT_FAMILY, pixelFontSize } from "../ui/typography";

/*
 * GameScene is mostly an orchestrator.
 * It owns the active SimulationState and input/tick loop, but layout, rendering,
 * HUD content, and gameplay rules all live in shared helpers.
 */
type GameSceneData = {
  levelId?: string;
  level?: LevelDefinition;
  fromEditor?: boolean;
};

export class GameScene extends Phaser.Scene {
  private level!: LevelDefinition;
  private state!: SimulationState;
  private boardGraphics!: Phaser.GameObjects.Graphics;
  private hudGraphics!: Phaser.GameObjects.Graphics;
  private infoText!: Phaser.GameObjects.Text;
  private progressLabelText!: Phaser.GameObjects.Text;
  private summaryTitleText!: Phaser.GameObjects.Text;
  private summaryText!: Phaser.GameObjects.Text;
  private summaryRankText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private hudStatTexts!: Record<string, Phaser.GameObjects.Text>;
  private hudStatLabels!: Record<string, Phaser.GameObjects.Text>;
  private overlayGraphics!: Phaser.GameObjects.Graphics;
  private summaryPrimaryButton!: PixelButton;
  private summarySecondaryButton!: PixelButton;
  private nextButton!: PixelButton;
  private toolButtons: Record<ToolKind, PixelButton> | null = null;
  private brushButtons: PixelButton[] = [];
  private speedText!: Phaser.GameObjects.Text;
  private tool: ToolKind = "hay";
  private brushIndex = 1;
  private hoverCells: Point[] = [];
  private accumulator = 0;
  private fromEditor = false;

  constructor() {
    super("GameScene");
  }

  init(data: GameSceneData) {
    const level = data.level ?? (data.levelId ? session.getLevelById(data.levelId) : undefined);
    if (!level) {
      throw new Error("Level not found.");
    }
    this.level = level;
    this.fromEditor = Boolean(data.fromEditor);
    const controls = getDefaultGameplayControls();
    this.tool = controls.tool;
    this.brushIndex = controls.brushIndex;
    this.hoverCells = controls.hoverCells;
    this.accumulator = controls.accumulator;
    this.toolButtons = null;
    this.brushButtons = [];
    this.state = createSimulation(level);
  }

  create() {
    drawPanelFrame(this.add.graphics());

    this.add
      .text(MAP_ORIGIN.x, HEADER_Y, this.level.name, {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: pixelFontSize(24),
        color: "#fce7b2",
        fontStyle: "bold",
        resolution: 2
      })
      .setOrigin(0, 0.5);

    this.boardGraphics = this.add.graphics();
    this.hudGraphics = this.add.graphics();
    this.overlayGraphics = this.add.graphics();
    this.overlayGraphics.setDepth(getGameSummaryDepths().overlay);
    this.infoText = this.add
      .text(SIDEBAR_ORIGIN.x + 18, SIDEBAR_ORIGIN.y + 322, "", {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: pixelFontSize(16),
        color: "#fce7b2",
        resolution: 2,
        lineSpacing: 8,
        wordWrap: { width: 170 }
      })
      .setOrigin(0, 0);

    this.statusText = this.add
      .text(HUD_ORIGIN.x + 22, HUD_ORIGIN.y + 124, "", {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: pixelFontSize(14),
        color: "#bfa16e",
        resolution: 2,
        wordWrap: { width: PANEL_WIDTH - 48 }
      })
      .setOrigin(0, 0);
    const progressLayout = getGameProgressBarLayout();
    this.progressLabelText = this.add
      .text(progressLayout.centerX, progressLayout.labelY, "Progress", {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: pixelFontSize(16),
        color: "#fce7b2",
        fontStyle: "bold",
        stroke: "#2a1c12",
        strokeThickness: 4,
        resolution: 2
      })
      .setOrigin(0.5);
    this.hudStatTexts = {};
    this.hudStatLabels = {};
    getGameHudStatSlots().forEach((slot) => {
      this.hudStatLabels[slot.key] = this.add
        .text(slot.labelX, slot.labelY, slot.key.toUpperCase(), {
          fontFamily: PIXEL_FONT_FAMILY,
          fontSize: pixelFontSize(16),
          color: "#bfa16e",
          fontStyle: "bold",
          resolution: 2
        })
        .setOrigin(0, 0);

      this.hudStatTexts[slot.key] = this.add
        .text(slot.valueX, slot.valueY, "", {
          fontFamily: PIXEL_FONT_FAMILY,
          fontSize: pixelFontSize(20),
          color: "#fce7b2",
          fontStyle: "bold",
          resolution: 2
        })
        .setOrigin(0, 0);
    });

    this.summaryTitleText = this.add
      .text(CANVAS_CENTER_X, getGameSummaryLayout().titleY, "", {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: pixelFontSize(24),
        color: "#fce7b2",
        fontStyle: "bold",
        align: "center",
        resolution: 2
      })
      .setOrigin(0.5)
      .setDepth(getGameSummaryDepths().text)
      .setVisible(false);

    this.summaryText = this.add
      .text(CANVAS_CENTER_X, getGameSummaryLayout().statsY, "", {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: pixelFontSize(20),
        color: "#fce7b2",
        align: "center",
        resolution: 2,
        wordWrap: { width: 340 }
      })
      .setOrigin(0.5)
      .setDepth(getGameSummaryDepths().text)
      .setVisible(false);

    this.summaryRankText = this.add
      .text(CANVAS_CENTER_X, getGameSummaryLayout().rankY, "", {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: pixelFontSize(22),
        color: "#fce7b2",
        fontStyle: "bold",
        align: "center",
        resolution: 2
      })
      .setOrigin(0.5)
      .setDepth(getGameSummaryDepths().text)
      .setVisible(false);

    this.buildSidebar();
    this.buildMapInput();
    this.buildSummaryButtons();
    this.renderScene();
  }

  update(_time: number, delta: number) {
    if (this.state.outcome === "active" || this.state.outcome === "successLocked") {
      const speed = SPEED_OPTIONS[this.state.speedIndex].multiplier;
      const interval = TICK_MS / speed;
      this.accumulator += delta;
      while (this.accumulator >= interval) {
        this.state = stepSimulation(this.state);
        this.accumulator -= interval;
      }
    }
    this.renderScene();
  }

  private buildSidebar() {
    const layout = getGameSidebarLayout();

    this.toolButtons = {
      hay: new PixelButton({
        scene: this,
        x: layout.dualRowX,
        y: SIDEBAR_ORIGIN.y + 44,
        width: layout.dualButtonWidth,
        height: 64,
        label: "HAY",
        onClick: () => {
          this.tool = "hay";
          this.renderScene();
        }
      }),
      tnt: new PixelButton({
        scene: this,
        x: layout.dualRowX + layout.dualButtonWidth + layout.dualGap,
        y: SIDEBAR_ORIGIN.y + 44,
        width: layout.dualButtonWidth,
        height: 64,
        label: "TNT",
        onClick: () => {
          this.tool = "tnt";
          this.renderScene();
        }
      })
    };

    this.add
      .text(layout.sectionLabelX, SIDEBAR_ORIGIN.y + 124, "BRUSH", {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: pixelFontSize(16),
        color: "#bfa16e",
        fontStyle: "bold",
        resolution: 2
      })
      .setOrigin(0, 0);

    BRUSH_OPTIONS.forEach((brush, index) => {
      const button = new PixelButton({
        scene: this,
        x: layout.brushRowX + index * (layout.brushButtonWidth + layout.brushGap),
        y: SIDEBAR_ORIGIN.y + 148,
        width: layout.brushButtonWidth,
        height: 48,
        label: brush.label,
        onClick: () => {
          this.brushIndex = index;
          this.renderScene();
        }
      });
      this.brushButtons.push(button);
    });

    this.add
      .text(layout.sectionLabelX, SIDEBAR_ORIGIN.y + 218, "SPEED", {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: pixelFontSize(16),
        color: "#bfa16e",
        fontStyle: "bold",
        resolution: 2
      })
      .setOrigin(0, 0);

    new PixelButton({
      scene: this,
      x: layout.speedRowX,
      y: SIDEBAR_ORIGIN.y + 242,
      width: layout.speedButtonWidth,
      height: 44,
      label: "-",
      onClick: () => {
        this.state = setSpeedIndex(this.state, this.state.speedIndex - 1);
      }
    });
    new PixelButton({
      scene: this,
      x: layout.speedRowX + layout.contentWidth - layout.speedButtonWidth,
      y: SIDEBAR_ORIGIN.y + 242,
      width: layout.speedButtonWidth,
      height: 44,
      label: "+",
      onClick: () => {
        this.state = setSpeedIndex(this.state, this.state.speedIndex + 1);
      }
    });
    this.speedText = this.add
      .text(layout.speedLabelCenterX, SIDEBAR_ORIGIN.y + 265, "", {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: pixelFontSize(14),
        color: "#fce7b2",
        resolution: 2
      })
      .setOrigin(0.5);

    new PixelButton({
      scene: this,
      x: layout.actionX,
      y: layout.actionTopY,
      width: layout.contentWidth,
      height: layout.actionHeight,
      label: "RESET",
      onClick: () => {
        this.state = resetSimulation(this.state);
        this.accumulator = 0;
      }
    });

    new PixelButton({
      scene: this,
      x: layout.actionX,
      y: layout.actionBottomY,
      width: layout.contentWidth,
      height: layout.actionHeight,
      label: this.fromEditor ? "EDITOR" : "LEVELS",
      onClick: () => {
        this.scene.start(this.fromEditor ? "EditorScene" : "LevelSelectScene");
      }
    });
  }

  private buildMapInput() {
    const zone = this.add.zone(MAP_ORIGIN.x, MAP_ORIGIN.y, MAP_SIZE, MAP_SIZE).setOrigin(0);
    zone.setInteractive({ useHandCursor: true });
    zone.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      const point = this.pointerToGrid(pointer);
      this.hoverCells = point ? this.buildHoverCells(point) : [];
    });
    zone.on("pointerout", () => {
      this.hoverCells = [];
    });
    zone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const point = this.pointerToGrid(pointer);
      if (!point) {
        return;
      }
      this.applyPlacement(point);
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) {
        return;
      }
      const point = this.pointerToGrid(pointer);
      if (point) {
        this.applyPlacement(point);
      }
    });
  }

  private buildSummaryButtons() {
    const layout = getGameSummaryLayout();

    this.summaryPrimaryButton = new PixelButton({
      scene: this,
      x: layout.buttonX,
      y: layout.firstButtonY,
      width: layout.buttonWidth,
      height: layout.buttonHeight,
      label: "RETRY",
      onClick: () => {
        this.state = resetSimulation(this.state);
        this.accumulator = 0;
      }
    });
    this.summaryPrimaryButton.setDepth(getGameSummaryDepths().buttons);
    this.summarySecondaryButton = new PixelButton({
      scene: this,
      x: layout.buttonX,
      y: layout.secondButtonY,
      width: layout.buttonWidth,
      height: layout.buttonHeight,
      label: this.fromEditor ? "EDITOR" : "LEVELS",
      onClick: () => {
        this.scene.start(this.fromEditor ? "EditorScene" : "LevelSelectScene");
      }
    });
    this.summarySecondaryButton.setDepth(getGameSummaryDepths().buttons);
    this.nextButton = new PixelButton({
      scene: this,
      x: layout.buttonX,
      y: layout.thirdButtonY,
      width: layout.buttonWidth,
      height: layout.buttonHeight,
      label: "NEXT LEVEL",
      onClick: () => {
        const next = this.findNextLevelId();
        if (next) {
          this.scene.start("GameScene", { levelId: next });
        }
      }
    });
    this.nextButton.setDepth(getGameSummaryDepths().buttons);
    this.hideSummary();
  }

  private hideSummary() {
    this.overlayGraphics.clear();
    this.summaryTitleText.setVisible(false);
    this.summaryText.setVisible(false);
    this.summaryRankText.setVisible(false);
    this.summaryPrimaryButton.setVisible(false);
    this.summarySecondaryButton.setVisible(false);
    this.nextButton.setVisible(false);
  }

  private renderScene() {
    this.boardGraphics.clear();
    this.hudGraphics.clear();
    drawSimulationBoard(this.boardGraphics, this.state, this.hoverCells);
    this.drawHud();
    this.speedText.setText(SPEED_OPTIONS[this.state.speedIndex].label);
    this.fitSpeedLabel();
    getGameBottomStats(this.level, this.state).forEach((item) => {
      const text = this.hudStatTexts[item.key];
      const label = this.hudStatLabels[item.key];
      if (label) {
        label.setText(item.label);
      }
      if (!text) {
        return;
      }
      text.setText(item.value);
      text.setColor(
        item.color ?? (item.tone === "warning" ? "#e9bb42" : item.tone === "success" ? "#83dd4c" : "#fce7b2")
      );
    });
    this.infoText.setText(getGameSidebarLines(this.state).join("\n"));

    this.toolButtons?.hay.setSelected(this.tool === "hay");
    this.toolButtons?.tnt.setSelected(this.tool === "tnt");
    this.toolButtons?.hay.setEnabled(this.state.outcome === "active");
    this.toolButtons?.tnt.setEnabled(this.state.outcome === "active");
    this.brushButtons.forEach((button, index) => {
      button.setSelected(index === this.brushIndex);
      button.setEnabled(this.tool === "hay" && this.state.outcome === "active");
    });

    if (this.state.outcome === "successResolved" || this.state.outcome === "failed") {
      this.showSummary();
    } else {
      this.hideSummary();
      this.statusText.setText("");
    }
  }

  private drawHud() {
    // The HUD geometry is intentionally stable and mirrored by tests. If this
    // layout changes, update the shared helpers/tests rather than only nudging
    // values in-scene.
    const meterX = HUD_ORIGIN.x + 22;
    const meterY = HUD_ORIGIN.y + 68;
    const meterWidth = 676;
    const meterHeight = 30;

    this.hudGraphics.fillStyle(0x170f09, 1);
    this.hudGraphics.fillRoundedRect(meterX, meterY, meterWidth, meterHeight, 8);
    this.hudGraphics.lineStyle(3, COLORS.frameDark, 1);
    this.hudGraphics.strokeRoundedRect(meterX, meterY, meterWidth, meterHeight, 8);
    this.hudGraphics.fillStyle(COLORS.fireB, 1);
    this.hudGraphics.fillRoundedRect(
      meterX + 4,
      meterY + 4,
      Math.max(0, meterWidth - 8) * this.state.destructionPct,
      meterHeight - 8,
      6
    );
    getGameProgressMarkers(meterX, meterWidth, this.level.completionPct).forEach((marker) => {
      const lineWidth = marker.key === "pass" ? 4 : 3;
      const topOffset = marker.key === "pass" ? 4 : 2;
      this.hudGraphics.lineStyle(lineWidth, Phaser.Display.Color.HexStringToColor(marker.color).color, 1);
      this.hudGraphics.lineBetween(marker.x, meterY - topOffset, marker.x, meterY + meterHeight + topOffset);

      if (marker.key !== "pass") {
        const iconY = meterY - 18;
        const iconColor = Phaser.Display.Color.HexStringToColor(marker.color).color;
        this.hudGraphics.fillStyle(iconColor, 1);
        this.hudGraphics.fillTriangle(marker.x - 4, iconY + 5, marker.x, iconY + 12, marker.x + 4, iconY + 5);
        this.hudGraphics.fillCircle(marker.x, iconY, 7);
        this.hudGraphics.fillStyle(0xffffff, 0.22);
        this.hudGraphics.fillCircle(marker.x - 1, iconY - 1, 3);
        this.hudGraphics.lineStyle(2, COLORS.panelShadow, 1);
        this.hudGraphics.strokeCircle(marker.x, iconY, 7);
      }
    });

    this.statusText.setPosition(HUD_ORIGIN.x + 22, HUD_ORIGIN.y + 124);
  }

  private fitSpeedLabel() {
    const layout = getGameSidebarLayout();
    let fontSize = Number.parseInt(pixelFontSize(14), 10);
    const minFontSize = Number.parseInt(pixelFontSize(8), 10);

    // `SLOWEST` and `FASTEST` are the limiting cases; fit within the gap between
    // the `-` and `+` buttons instead of letting the label clip.
    this.speedText.setFontSize(`${fontSize}px`);
    while (fontSize > minFontSize && this.speedText.width > layout.speedLabelMaxWidth) {
      fontSize -= 1;
      this.speedText.setFontSize(`${fontSize}px`);
    }
  }

  private showSummary() {
    const layout = getGameSummaryLayout();

    this.overlayGraphics.clear();
    this.overlayGraphics.fillStyle(COLORS.overlay, 0.82);
    this.overlayGraphics.fillRect(0, 0, PANEL_WIDTH + 40, CANVAS_HEIGHT);
    this.overlayGraphics.fillStyle(0x2a1c12, 1);
    this.overlayGraphics.fillRoundedRect(layout.dialogX, layout.dialogY, layout.dialogWidth, layout.dialogHeight, 18);
    this.overlayGraphics.lineStyle(5, COLORS.frameLight, 1);
    this.overlayGraphics.strokeRoundedRect(
      layout.dialogX,
      layout.dialogY,
      layout.dialogWidth,
      layout.dialogHeight,
      18
    );

    const success = this.state.outcome === "successResolved";
    const next = this.findNextLevelId();
    const rank = getRankDisplay(this.state.medal);
    this.summaryTitleText.setText(success ? "Level Cleared!" : "Run Failed!");
    this.summaryTitleText.setVisible(true);
    this.summaryText.setText(
      [
        `Destruction: ${(this.state.destructionPct * 100).toFixed(0)}%`,
        `Score: ${this.state.score}`
      ].join("\n")
    );
    this.summaryText.setVisible(true);
    this.summaryRankText.setText(`Rank: ${rank.label}`);
    this.summaryRankText.setColor(rank.color);
    this.summaryRankText.setVisible(true);

    this.summaryPrimaryButton.setLabel(success ? "REPLAY" : "TRY AGAIN");
    this.summaryPrimaryButton.setVisible(true);
    this.summarySecondaryButton.setLabel(this.fromEditor ? "EDITOR" : "LEVELS");
    this.summarySecondaryButton.setVisible(true);
    this.nextButton.setVisible(Boolean(success && next && !this.fromEditor));
    this.statusText.setText("");
  }

  private pointerToGrid(pointer: Phaser.Input.Pointer): Point | null {
    const localX = pointer.worldX - MAP_ORIGIN.x;
    const localY = pointer.worldY - MAP_ORIGIN.y;
    if (localX < 0 || localY < 0 || localX >= MAP_SIZE || localY >= MAP_SIZE) {
      return null;
    }
    return {
      x: Math.floor(localX / CELL_SIZE),
      y: Math.floor(localY / CELL_SIZE)
    };
  }

  private buildHoverCells(center: Point): Point[] {
    if (this.tool === "tnt") {
      return [center];
    }
    return getBrushFootprint(center, this.brushIndex, GRID_SIZE);
  }

  private applyPlacement(point: Point) {
    if (this.state.outcome !== "active") {
      return;
    }
    if (this.tool === "hay") {
      this.state = applyHayBrush(this.state, point, this.brushIndex);
    } else {
      this.state = placeTnt(this.state, point);
    }
  }

  private findNextLevelId(): string | null {
    const index = BUILT_IN_LEVELS.findIndex((level) => level.id === this.level.id);
    if (index < 0 || index === BUILT_IN_LEVELS.length - 1) {
      return null;
    }
    return BUILT_IN_LEVELS[index + 1].id;
  }
}

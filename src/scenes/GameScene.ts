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
import { session } from "../game/session";
import {
  applyHayBrush,
  createSimulation,
  getMedalDestructionThresholds,
  placeTnt,
  resetSimulation,
  setSpeedIndex,
  stepSimulation
} from "../game/simulation";
import type { LevelDefinition, Point, SimulationState, ToolKind } from "../game/types";
import { drawPanelFrame, drawSimulationBoard } from "../ui/board-renderer";
import { PixelButton } from "../ui/pixel-button";

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
  private summaryText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private destructionLabel!: Phaser.GameObjects.Text;
  private scoreLabel!: Phaser.GameObjects.Text;
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
    this.state = createSimulation(level);
  }

  create() {
    drawPanelFrame(this.add.graphics());

    this.add
      .text(MAP_ORIGIN.x, HEADER_Y, this.level.name, {
        fontFamily: "Courier New",
        fontSize: "24px",
        color: "#fce7b2",
        fontStyle: "bold",
        resolution: 2
      })
      .setOrigin(0, 0.5);

    this.boardGraphics = this.add.graphics();
    this.hudGraphics = this.add.graphics();
    this.overlayGraphics = this.add.graphics();
    this.infoText = this.add
      .text(SIDEBAR_ORIGIN.x, SIDEBAR_ORIGIN.y + 322, "", {
        fontFamily: "Courier New",
        fontSize: "15px",
        color: "#fce7b2",
        resolution: 2,
        lineSpacing: 10,
        wordWrap: { width: 190 }
      })
      .setOrigin(0, 0);

    this.statusText = this.add
      .text(HUD_ORIGIN.x + 24, HUD_ORIGIN.y + 88, "", {
        fontFamily: "Courier New",
        fontSize: "16px",
        color: "#83dd4c",
        resolution: 2
      })
      .setOrigin(0, 0);
    this.destructionLabel = this.add
      .text(HUD_ORIGIN.x + 22, HUD_ORIGIN.y + 6, "DESTRUCTION", {
        fontFamily: "Courier New",
        fontSize: "14px",
        color: "#bfa16e",
        resolution: 2
      })
      .setOrigin(0, 0);
    this.scoreLabel = this.add
      .text(HUD_ORIGIN.x + 460, HUD_ORIGIN.y + 6, "SCORE", {
        fontFamily: "Courier New",
        fontSize: "14px",
        color: "#bfa16e",
        resolution: 2
      })
      .setOrigin(0, 0);

    this.summaryText = this.add
      .text(CANVAS_CENTER_X, 316, "", {
        fontFamily: "Courier New",
        fontSize: "20px",
        color: "#fce7b2",
        align: "center",
        resolution: 2,
        wordWrap: { width: 340 }
      })
      .setOrigin(0.5)
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
    this.toolButtons = {
      hay: new PixelButton({
        scene: this,
        x: SIDEBAR_ORIGIN.x,
        y: SIDEBAR_ORIGIN.y + 44,
        width: 88,
        height: 64,
        label: "HAY",
        onClick: () => {
          this.tool = "hay";
          this.renderScene();
        }
      }),
      tnt: new PixelButton({
        scene: this,
        x: SIDEBAR_ORIGIN.x + 100,
        y: SIDEBAR_ORIGIN.y + 44,
        width: 88,
        height: 64,
        label: "TNT",
        onClick: () => {
          this.tool = "tnt";
          this.renderScene();
        }
      })
    };

    this.add
      .text(SIDEBAR_ORIGIN.x, SIDEBAR_ORIGIN.y + 124, "BRUSH", {
        fontFamily: "Courier New",
        fontSize: "16px",
        color: "#bfa16e",
        fontStyle: "bold",
        resolution: 2
      })
      .setOrigin(0, 0);

    BRUSH_OPTIONS.forEach((brush, index) => {
      const button = new PixelButton({
        scene: this,
        x: SIDEBAR_ORIGIN.x + index * 64,
        y: SIDEBAR_ORIGIN.y + 148,
        width: 56,
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
      .text(SIDEBAR_ORIGIN.x, SIDEBAR_ORIGIN.y + 218, "SPEED", {
        fontFamily: "Courier New",
        fontSize: "16px",
        color: "#bfa16e",
        fontStyle: "bold",
        resolution: 2
      })
      .setOrigin(0, 0);

    new PixelButton({
      scene: this,
      x: SIDEBAR_ORIGIN.x,
      y: SIDEBAR_ORIGIN.y + 242,
      width: 56,
      height: 44,
      label: "-",
      onClick: () => {
        this.state = setSpeedIndex(this.state, this.state.speedIndex - 1);
      }
    });
    new PixelButton({
      scene: this,
      x: SIDEBAR_ORIGIN.x + 132,
      y: SIDEBAR_ORIGIN.y + 242,
      width: 56,
      height: 44,
      label: "+",
      onClick: () => {
        this.state = setSpeedIndex(this.state, this.state.speedIndex + 1);
      }
    });
    this.speedText = this.add
      .text(SIDEBAR_ORIGIN.x + 94, SIDEBAR_ORIGIN.y + 265, "", {
        fontFamily: "Courier New",
        fontSize: "14px",
        color: "#fce7b2",
        resolution: 2
      })
      .setOrigin(0.5);

    new PixelButton({
      scene: this,
      x: SIDEBAR_ORIGIN.x,
      y: SIDEBAR_ORIGIN.y + 448,
      width: 188,
      height: 44,
      label: "RESET",
      onClick: () => {
        this.state = resetSimulation(this.state);
        this.accumulator = 0;
      }
    });

    new PixelButton({
      scene: this,
      x: SIDEBAR_ORIGIN.x,
      y: SIDEBAR_ORIGIN.y + 500,
      width: 188,
      height: 44,
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
    this.summaryPrimaryButton = new PixelButton({
      scene: this,
      x: CANVAS_CENTER_X - 120,
      y: 388,
      width: 240,
      height: 54,
      label: "RETRY",
      onClick: () => {
        this.state = resetSimulation(this.state);
        this.accumulator = 0;
      }
    });
    this.summarySecondaryButton = new PixelButton({
      scene: this,
      x: CANVAS_CENTER_X - 120,
      y: 454,
      width: 240,
      height: 54,
      label: this.fromEditor ? "EDITOR" : "LEVELS",
      onClick: () => {
        this.scene.start(this.fromEditor ? "EditorScene" : "LevelSelectScene");
      }
    });
    this.nextButton = new PixelButton({
      scene: this,
      x: CANVAS_CENTER_X - 120,
      y: 520,
      width: 240,
      height: 54,
      label: "NEXT LEVEL",
      onClick: () => {
        const next = this.findNextLevelId();
        if (next) {
          this.scene.start("GameScene", { levelId: next });
        }
      }
    });
    this.hideSummary();
  }

  private hideSummary() {
    this.overlayGraphics.clear();
    this.summaryText.setVisible(false);
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
    this.infoText.setText(
      [
        `GOAL ${(this.level.completionPct * 100).toFixed(0)}%`,
        `DESTROYED ${(this.state.destructionPct * 100).toFixed(0)}%`,
        `SCORE ${this.state.score}`,
        `MEDAL ${this.state.medal.toUpperCase()}`,
        "",
        `HAY LEFT ${this.state.hayRemaining}`,
        `TNT LEFT ${this.state.tntRemaining}`,
        "",
        this.state.outcome === "successLocked"
          ? "SUCCESS LOCKED\nFIRE IS STILL RUNNING."
          : this.state.outcome === "failed"
            ? "FAILURE\nOUT OF RESOURCES."
            : "ACTIVE RUN"
      ].join("\n")
    );

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
      this.statusText.setText(
        this.state.outcome === "successLocked"
          ? "MINIMUM DESTRUCTION HIT. FINAL SCORE WILL LOCK WHEN THE FIRE DIES."
          : "LAY HAY OR PLANT TNT. THE RUN FAILS AS SOON AS BOTH RESOURCES HIT ZERO."
      );
    }
  }

  private drawHud() {
    const meterX = HUD_ORIGIN.x + 22;
    const meterY = HUD_ORIGIN.y + 22;
    const meterWidth = 400;
    const meterHeight = 30;
    const scoreX = HUD_ORIGIN.x + 460;
    const scoreWidth = 232;

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
    const goalX = meterX + meterWidth * this.level.completionPct;
    this.hudGraphics.lineStyle(4, COLORS.warning, 1);
    this.hudGraphics.lineBetween(goalX, meterY - 4, goalX, meterY + meterHeight + 4);

    this.hudGraphics.fillStyle(0x170f09, 1);
    this.hudGraphics.fillRoundedRect(scoreX, meterY, scoreWidth, meterHeight, 8);
    this.hudGraphics.strokeRoundedRect(scoreX, meterY, scoreWidth, meterHeight, 8);
    this.hudGraphics.fillStyle(COLORS.grassA, 1);
    this.hudGraphics.fillRoundedRect(
      scoreX + 4,
      meterY + 4,
      Math.max(0, scoreWidth - 8) * (this.state.score / 1000),
      meterHeight - 8,
      6
    );

    const thresholds = getMedalDestructionThresholds();
    [thresholds.bronze, thresholds.silver, thresholds.gold].forEach((value) => {
      const thresholdX = meterX + meterWidth * value;
      this.hudGraphics.lineStyle(3, COLORS.frameLight, 1);
      this.hudGraphics.lineBetween(thresholdX, meterY - 2, thresholdX, meterY + meterHeight + 2);
    });

    this.statusText.setPosition(HUD_ORIGIN.x + 24, HUD_ORIGIN.y + 88);
  }

  private showSummary() {
    this.overlayGraphics.clear();
    this.overlayGraphics.fillStyle(COLORS.overlay, 0.82);
    this.overlayGraphics.fillRect(0, 0, PANEL_WIDTH + 40, CANVAS_HEIGHT);
    this.overlayGraphics.fillStyle(0x2a1c12, 1);
    this.overlayGraphics.fillRoundedRect(CANVAS_CENTER_X - 178, 220, 356, 340, 18);
    this.overlayGraphics.lineStyle(5, COLORS.frameLight, 1);
    this.overlayGraphics.strokeRoundedRect(CANVAS_CENTER_X - 178, 220, 356, 340, 18);

    const success = this.state.outcome === "successResolved";
    const next = this.findNextLevelId();
    this.summaryText.setText(
      [
        success ? "LEVEL CLEARED" : "RUN FAILED",
        "",
        `FINAL DESTRUCTION ${(this.state.destructionPct * 100).toFixed(0)}%`,
        `FINAL SCORE ${this.state.score}`,
        `MEDAL ${this.state.medal.toUpperCase()}`
      ].join("\n")
    );
    this.summaryText.setVisible(true);

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
    const size = BRUSH_OPTIONS[this.brushIndex].size;
    const radius = Math.floor(size / 2);
    const cells: Point[] = [];
    for (let y = center.y - radius; y <= center.y + radius; y += 1) {
      for (let x = center.x - radius; x <= center.x + radius; x += 1) {
        if (x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE) {
          cells.push({ x, y });
        }
      }
    }
    return cells;
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

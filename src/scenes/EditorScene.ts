import Phaser from "phaser";

import {
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
  SIDEBAR_WIDTH
} from "../game/constants";
import { cloneLevel, isLevelValid, placeStructure, removeAt, toggleFireSource } from "../game/editor-draft";
import { parseLevelFile, serializeLevel, validateLevel } from "../game/level-io";
import { session } from "../game/session";
import { getStructureStats } from "../game/structureCatalog";
import type { EditorTool, LevelDefinition, Point } from "../game/types";
import { drawLevelBoard, drawPanelFrame } from "../ui/board-renderer";
import { domBridge } from "../ui/dom-bridge";
import { PixelButton } from "../ui/pixel-button";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export class EditorScene extends Phaser.Scene {
  private draft!: LevelDefinition;
  private boardGraphics!: Phaser.GameObjects.Graphics;
  private overlayGraphics!: Phaser.GameObjects.Graphics;
  private infoText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private nameOverlayText!: Phaser.GameObjects.Text;
  private tool: EditorTool = "fire";
  private hoverCells: Point[] = [];
  private toolButtons: Record<EditorTool, PixelButton> | null = null;
  private statTexts!: {
    name: Phaser.GameObjects.Text;
    hay: Phaser.GameObjects.Text;
    tnt: Phaser.GameObjects.Text;
    goal: Phaser.GameObjects.Text;
  };
  private naming = false;

  constructor() {
    super("EditorScene");
  }

  create() {
    this.draft = session.getEditorDraft();
    drawPanelFrame(this.add.graphics());

    this.add
      .text(MAP_ORIGIN.x, HEADER_Y, "LEVEL EDITOR", {
        fontFamily: "Courier New",
        fontSize: "24px",
        color: "#fce7b2",
        fontStyle: "bold",
        resolution: 2
      })
      .setOrigin(0, 0.5);

    this.boardGraphics = this.add.graphics();
    this.overlayGraphics = this.add.graphics();
    this.infoText = this.add
      .text(SIDEBAR_ORIGIN.x + 18, SIDEBAR_ORIGIN.y + 334, "", {
        fontFamily: "Courier New",
        fontSize: "20px",
        color: "#fce7b2",
        fontStyle: "bold",
        resolution: 2,
        lineSpacing: 8,
        wordWrap: { width: SIDEBAR_WIDTH - 36 }
      })
      .setOrigin(0, 0);
    this.statusText = this.add
      .text(HUD_ORIGIN.x + 24, HUD_ORIGIN.y + 120, "", {
        fontFamily: "Courier New",
        fontSize: "18px",
        color: "#83dd4c",
        fontStyle: "bold",
        resolution: 2,
        wordWrap: { width: PANEL_WIDTH - 48 }
      })
      .setOrigin(0, 0);
    this.nameOverlayText = this.add
      .text(CANVAS_CENTER_X, 330, "", {
        fontFamily: "Courier New",
        fontSize: "20px",
        color: "#fce7b2",
        align: "center",
        resolution: 2,
        wordWrap: { width: 360 }
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.buildSidebar();
    this.buildBottomControls();
    this.buildMapInput();
    this.renderScene();
  }

  private buildSidebar() {
    const sidebarInset = 18;
    const contentX = SIDEBAR_ORIGIN.x + sidebarInset;
    const contentWidth = SIDEBAR_WIDTH - sidebarInset * 2;
    const actionGap = 6;
    const actionWidth = Math.floor((contentWidth - actionGap) / 2);
    const actionX2 = contentX + actionWidth + actionGap;

    const makeToolButton = (tool: EditorTool, label: string, row: number) =>
      new PixelButton({
        scene: this,
        x: contentX,
        y: SIDEBAR_ORIGIN.y + 20 + row * 54,
        width: contentWidth,
        height: 46,
        label,
        fontSize: "24px",
        onClick: () => {
          this.tool = tool;
          this.renderScene();
        }
      });

    this.toolButtons = {
      fire: makeToolButton("fire", "FIRE SOURCE", 0),
      hut: makeToolButton("hut", "SMALL HUT", 1),
      house: makeToolButton("house", "HOUSE", 2),
      hall: makeToolButton("hall", "HALL", 3),
      erase: makeToolButton("erase", "ERASE", 4)
    };

    new PixelButton({
      scene: this,
      x: contentX,
      y: SIDEBAR_ORIGIN.y + 406,
      width: actionWidth,
      height: 38,
      label: "RENAME",
      fontSize: "19px",
      onClick: () => this.beginNameEntry()
    });
    new PixelButton({
      scene: this,
      x: actionX2,
      y: SIDEBAR_ORIGIN.y + 406,
      width: actionWidth,
      height: 38,
      label: "IMPORT",
      fontSize: "19px",
      onClick: () => void this.importLevel()
    });
    new PixelButton({
      scene: this,
      x: contentX,
      y: SIDEBAR_ORIGIN.y + 450,
      width: actionWidth,
      height: 38,
      label: "EXPORT",
      fontSize: "19px",
      onClick: () => this.exportLevel()
    });
    new PixelButton({
      scene: this,
      x: actionX2,
      y: SIDEBAR_ORIGIN.y + 450,
      width: actionWidth,
      height: 38,
      label: "PLAY TEST",
      fontSize: "19px",
      onClick: () => this.playTest()
    });
    new PixelButton({
      scene: this,
      x: contentX,
      y: SIDEBAR_ORIGIN.y + 498,
      width: contentWidth,
      height: 40,
      label: "MENU",
      fontSize: "21px",
      onClick: () => {
        session.replaceEditorDraft(this.draft);
        this.scene.start("MenuScene");
      }
    });
  }

  private buildBottomControls() {
    const label = (x: number, y: number, text: string) =>
      this.add
        .text(x, y, text, {
          fontFamily: "Courier New",
          fontSize: "18px",
          color: "#bfa16e",
          fontStyle: "bold",
          resolution: 2
        })
        .setOrigin(0, 0);
    const value = (x: number, y: number, fontSize = "28px") =>
      this.add
        .text(x, y, "", {
          fontFamily: "Courier New",
          fontSize,
          color: "#fce7b2",
          fontStyle: "bold",
          resolution: 2
        })
        .setOrigin(0, 0.5);

    const hudLeft = HUD_ORIGIN.x + 24;
    const nameLabelY = HUD_ORIGIN.y + 18;
    const nameValueY = HUD_ORIGIN.y + 46;
    const groupLabelY = HUD_ORIGIN.y + 86;
    const groupControlY = HUD_ORIGIN.y + 106;
    const groupWidth = 146;
    const groupGap = 12;

    label(hudLeft, nameLabelY, "NAME");
    label(hudLeft, groupLabelY, "HAY");
    label(hudLeft + groupWidth + groupGap, groupLabelY, "TNT");
    label(hudLeft + (groupWidth + groupGap) * 2, groupLabelY, "GOAL");

    this.statTexts = {
      name: value(hudLeft + 112, nameValueY, "26px"),
      hay: value(hudLeft + 44, groupControlY + 18),
      tnt: value(hudLeft + groupWidth + groupGap + 44, groupControlY + 18),
      goal: value(hudLeft + (groupWidth + groupGap) * 2 + 44, groupControlY + 18)
    };

    const stepper = (x: number, y: number, onMinus: () => void, onPlus: () => void) => {
      new PixelButton({
        scene: this,
        x,
        y,
        width: 34,
        height: 34,
        label: "-",
        fontSize: "18px",
        onClick: onMinus
      });
      new PixelButton({
        scene: this,
        x: x + 38,
        y,
        width: 34,
        height: 34,
        label: "+",
        fontSize: "18px",
        onClick: onPlus
      });
    };

    stepper(hudLeft + 72, groupControlY, () => this.adjustBudget("hay", -2), () =>
      this.adjustBudget("hay", 2)
    );
    stepper(hudLeft + groupWidth + groupGap + 72, groupControlY, () => this.adjustBudget("tnt", -1), () =>
      this.adjustBudget("tnt", 1)
    );
    stepper(hudLeft + (groupWidth + groupGap) * 2 + 72, groupControlY, () => this.adjustGoal(-0.05), () =>
      this.adjustGoal(0.05)
    );
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
      if (point) {
        this.applyTool(point);
      }
    });
  }

  private renderScene() {
    this.boardGraphics.clear();
    this.overlayGraphics.clear();
    drawLevelBoard(this.boardGraphics, this.draft, this.hoverCells);
    this.infoText.setText(
      [
        `TOOL: ${this.tool.toUpperCase()}`,
        `FIRES: ${this.draft.fireSources.length}   STRUCTURES: ${this.draft.structures.length}`,
        isLevelValid(this.draft) ? "LEVEL SHAPE: VALID" : "LEVEL SHAPE: INVALID"
      ].join("\n")
    );

    this.statTexts.name.setText(this.draft.name.slice(0, 20));
    this.statTexts.hay.setText(String(this.draft.resourceBudget.hayCells));
    this.statTexts.tnt.setText(String(this.draft.resourceBudget.tntCount));
    this.statTexts.goal.setText(`${Math.round(this.draft.completionPct * 100)}%`);

    Object.entries(this.toolButtons ?? {}).forEach(([tool, button]) => {
      button.setSelected(tool === this.tool);
    });

    if (this.naming) {
      this.overlayGraphics.fillStyle(COLORS.overlay, 0.85);
      this.overlayGraphics.fillRect(0, 0, PANEL_WIDTH + 40, CANVAS_HEIGHT);
      this.overlayGraphics.fillStyle(0x2a1c12, 1);
      this.overlayGraphics.fillRoundedRect(CANVAS_CENTER_X - 180, 250, 360, 120, 16);
      this.overlayGraphics.lineStyle(5, COLORS.frameLight, 1);
      this.overlayGraphics.strokeRoundedRect(CANVAS_CENTER_X - 180, 250, 360, 120, 16);
      this.nameOverlayText.setVisible(true);
    } else {
      this.nameOverlayText.setVisible(false);
    }
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

  private buildHoverCells(point: Point): Point[] {
    if (this.tool === "fire" || this.tool === "erase") {
      return [point];
    }
    const size = getStructureStats(this.tool).size;
    const cells: Point[] = [];
    for (let y = point.y; y < point.y + size.y; y += 1) {
      for (let x = point.x; x < point.x + size.x; x += 1) {
        if (x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE) {
          cells.push({ x, y });
        }
      }
    }
    return cells;
  }

  private applyTool(point: Point) {
    if (this.tool === "fire") {
      this.draft = toggleFireSource(this.draft, point);
    } else if (this.tool === "erase") {
      this.draft = removeAt(this.draft, point);
    } else {
      this.draft = placeStructure(this.draft, this.tool, point);
    }
    session.replaceEditorDraft(this.draft);
    this.renderScene();
  }

  private adjustBudget(kind: "hay" | "tnt", delta: number) {
    if (kind === "hay") {
      this.draft.resourceBudget.hayCells = Math.max(0, this.draft.resourceBudget.hayCells + delta);
    } else {
      this.draft.resourceBudget.tntCount = Math.max(0, this.draft.resourceBudget.tntCount + delta);
    }
    this.renderScene();
  }

  private adjustGoal(delta: number) {
    this.draft.completionPct = Number(Math.max(0.1, Math.min(0.95, this.draft.completionPct + delta)).toFixed(2));
    this.renderScene();
  }

  private beginNameEntry() {
    this.naming = true;
    this.nameOverlayText.setText(
      `LEVEL NAME\n\n${this.draft.name}\n\nType to edit. Enter saves. Esc cancels.`
    );
    this.renderScene();
    domBridge.beginTextEntry(this.draft.name, {
      onUpdate: (value) => {
        this.nameOverlayText.setText(
          `LEVEL NAME\n\n${value || "(empty)"}\n\nType to edit. Enter saves. Esc cancels.`
        );
      },
      onCommit: (value) => {
        const next = value.trim() || "Custom Level";
        this.draft.name = next;
        this.draft.id = slugify(next) || "custom-level";
        this.naming = false;
        this.renderScene();
      },
      onCancel: () => {
        this.naming = false;
        this.renderScene();
      }
    });
  }

  private async importLevel() {
    try {
      const raw = await domBridge.pickJsonFile();
      if (!raw) {
        this.statusText.setText("Import cancelled.");
        return;
      }
      this.draft = parseLevelFile(raw);
      session.replaceEditorDraft(this.draft);
      this.statusText.setText("Imported level into the editor.");
      this.renderScene();
    } catch (error) {
      this.statusText.setText(error instanceof Error ? error.message : "Import failed.");
    }
  }

  private exportLevel() {
    const errors = validateLevel(this.draft);
    if (errors.length) {
      this.statusText.setText(errors[0]);
      return;
    }
    domBridge.downloadText(`${slugify(this.draft.name || this.draft.id)}.json`, serializeLevel(this.draft));
    session.addCustomLevel(cloneLevel(this.draft));
    this.statusText.setText("Exported level JSON.");
  }

  private playTest() {
    const errors = validateLevel(this.draft);
    if (errors.length) {
      this.statusText.setText(errors[0]);
      return;
    }
    session.replaceEditorDraft(this.draft);
    this.scene.start("GameScene", {
      level: cloneLevel(this.draft),
      fromEditor: true
    });
  }
}

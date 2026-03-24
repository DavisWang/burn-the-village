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
import { cloneLevel, placeStructure, removeAt, toggleFireSource } from "../game/editor-draft";
import { parseLevelFile, serializeLevel, validateLevel } from "../game/level-io";
import { session } from "../game/session";
import { getStructureStats } from "../game/structureCatalog";
import type { EditorTool, LevelDefinition, Point } from "../game/types";
import { drawLevelBoard, drawPanelFrame } from "../ui/board-renderer";
import { domBridge } from "../ui/dom-bridge";
import {
  getEditorBottomActionLayout,
  getEditorBottomControlLayout,
  getEditorOverlayDepths,
  getEditorOverlayLayout,
  getEditorSidebarLayout
} from "../ui/layout";
import { PixelButton } from "../ui/pixel-button";
import { PIXEL_FONT_FAMILY, pixelFontSize } from "../ui/typography";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export class EditorScene extends Phaser.Scene {
  private static readonly MAX_RESOURCE_INPUT = 999;
  private draft!: LevelDefinition;
  private boardGraphics!: Phaser.GameObjects.Graphics;
  private overlayGraphics!: Phaser.GameObjects.Graphics;
  private overlayText!: Phaser.GameObjects.Text;
  private tool: EditorTool = "fire";
  private hoverCells: Point[] = [];
  private toolButtons: Record<EditorTool, PixelButton> | null = null;
  private budgetButtons: Record<"hay" | "tnt", PixelButton> | null = null;
  private statTexts!: {
    name: Phaser.GameObjects.Text;
    goal: Phaser.GameObjects.Text;
  };
  private naming = false;
  private budgetEntry: "hay" | "tnt" | null = null;
  private transientMessage: string | null = null;
  private transientMessageTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super("EditorScene");
  }

  create() {
    this.draft = session.getEditorDraft();
    drawPanelFrame(this.add.graphics());

    this.add
      .text(MAP_ORIGIN.x, HEADER_Y, "LEVEL EDITOR", {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: pixelFontSize(24),
        color: "#fce7b2",
        fontStyle: "bold",
        resolution: 2
      })
      .setOrigin(0, 0.5);

    this.boardGraphics = this.add.graphics();
    this.overlayGraphics = this.add.graphics();
    this.overlayGraphics.setDepth(getEditorOverlayDepths().overlay);
    this.overlayText = this.add
      .text(CANVAS_CENTER_X, 330, "", {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: pixelFontSize(20),
        color: "#fce7b2",
        align: "center",
        resolution: 2,
        wordWrap: { width: 360 }
      })
      .setOrigin(0.5)
      .setDepth(getEditorOverlayDepths().text)
      .setVisible(false);

    this.buildSidebar();
    this.buildBottomControls();
    this.buildMapInput();
    this.renderScene();
  }

  private buildSidebar() {
    const layout = getEditorSidebarLayout();

    const makeToolButton = (tool: EditorTool, label: string, row: number) =>
      new PixelButton({
        scene: this,
        x: layout.contentX,
        y: SIDEBAR_ORIGIN.y + 20 + row * 54,
        width: layout.contentWidth,
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
  }

  private buildBottomControls() {
    const controls = getEditorBottomControlLayout();
    const actions = getEditorBottomActionLayout();
    const label = (x: number, y: number, text: string) =>
      this.add
        .text(x, y, text, {
          fontFamily: PIXEL_FONT_FAMILY,
          fontSize: pixelFontSize(18),
          color: "#bfa16e",
          fontStyle: "bold",
          resolution: 2
        })
        .setOrigin(0, 0);
    const value = (x: number, y: number, fontSize = pixelFontSize(28), originX = 0) =>
      this.add
        .text(x, y, "", {
          fontFamily: PIXEL_FONT_FAMILY,
          fontSize,
          color: "#fce7b2",
          fontStyle: "bold",
          resolution: 2
        })
        .setOrigin(originX, 0.5);

    const hudLeft = controls.leftX;
    const nameLabelY = controls.nameLabelY;
    const nameValueY = controls.nameValueY;
    const groupLabelY = controls.groupLabelY;
    const groupControlY = controls.groupControlY;
    const groupWidth = controls.groupWidth;
    const groupGap = controls.groupGap;

    label(hudLeft, nameLabelY, "NAME");
    label(hudLeft, groupLabelY, "HAY");
    label(hudLeft + groupWidth + groupGap, groupLabelY, "TNT");
    label(hudLeft + (groupWidth + groupGap) * 2, groupLabelY, "GOAL");

    this.statTexts = {
      name: value(hudLeft + 112, nameValueY, pixelFontSize(26)),
      goal: value(controls.goalValueX, groupControlY + 18, pixelFontSize(28), 1)
    };

    const stepper = (x: number, y: number, onMinus: () => void, onPlus: () => void) => {
      new PixelButton({
        scene: this,
        x,
        y,
        width: controls.goalStepperWidth,
        height: 34,
        label: "-",
        fontSize: "18px",
        onClick: onMinus
      });
      new PixelButton({
        scene: this,
        x: x + controls.goalStepperWidth + controls.goalStepperGap,
        y,
        width: controls.goalStepperWidth,
        height: 34,
        label: "+",
        fontSize: "18px",
        onClick: onPlus
      });
    };

    const budgetInset = Math.floor((groupWidth - controls.budgetButtonWidth) / 2);

    this.budgetButtons = {
      hay: new PixelButton({
        scene: this,
        x: hudLeft + budgetInset,
        y: groupControlY,
        width: controls.budgetButtonWidth,
        height: 38,
        label: "",
        fontSize: controls.budgetFontSize,
        labelOffsetX: controls.budgetTextOffsetX,
        labelOffsetY: controls.budgetTextOffsetY,
        onClick: () => this.beginBudgetEntry("hay")
      }),
      tnt: new PixelButton({
        scene: this,
        x: hudLeft + groupWidth + groupGap + budgetInset,
        y: groupControlY,
        width: controls.budgetButtonWidth,
        height: 38,
        label: "",
        fontSize: controls.budgetFontSize,
        labelOffsetX: controls.budgetTextOffsetX,
        labelOffsetY: controls.budgetTextOffsetY,
        onClick: () => this.beginBudgetEntry("tnt")
      })
    };
    stepper(controls.goalStepperX, groupControlY, () => this.adjustGoal(-0.05), () => this.adjustGoal(0.05));

    new PixelButton({
      scene: this,
      x: actions.contentX,
      y: actions.topY,
      width: actions.pairWidth,
      height: actions.buttonHeight,
      label: "RENAME",
      fontSize: "17px",
      onClick: () => this.beginNameEntry()
    });
    new PixelButton({
      scene: this,
      x: actions.contentX + actions.pairWidth + actions.pairGap,
      y: actions.topY,
      width: actions.pairWidth,
      height: actions.buttonHeight,
      label: "IMPORT",
      fontSize: "17px",
      onClick: () => void this.importLevel()
    });
    new PixelButton({
      scene: this,
      x: actions.contentX,
      y: actions.secondRowY,
      width: actions.pairWidth,
      height: actions.buttonHeight,
      label: "EXPORT",
      fontSize: "17px",
      onClick: () => this.exportLevel()
    });
    new PixelButton({
      scene: this,
      x: actions.contentX + actions.pairWidth + actions.pairGap,
      y: actions.secondRowY,
      width: actions.pairWidth,
      height: actions.buttonHeight,
      label: "PLAY TEST",
      fontSize: "17px",
      onClick: () => this.playTest()
    });
    new PixelButton({
      scene: this,
      x: actions.contentX,
      y: actions.menuY,
      width: actions.contentWidth,
      height: actions.menuHeight,
      label: "MENU",
      fontSize: "18px",
      onClick: () => {
        session.replaceEditorDraft(this.draft);
        this.scene.start("MenuScene");
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
      if (point) {
        this.applyTool(point);
      }
    });
  }

  private renderScene() {
    this.boardGraphics.clear();
    this.overlayGraphics.clear();
    drawLevelBoard(this.boardGraphics, this.draft, this.hoverCells);

    this.statTexts.name.setText(this.draft.name.slice(0, 20));
    this.budgetButtons?.hay.setLabel(String(this.draft.resourceBudget.hayCells));
    this.budgetButtons?.tnt.setLabel(String(this.draft.resourceBudget.tntCount));
    this.statTexts.goal.setText(`${Math.round(this.draft.completionPct * 100)}%`);

    Object.entries(this.toolButtons ?? {}).forEach(([tool, button]) => {
      button.setSelected(tool === this.tool);
    });

    if (this.naming || this.budgetEntry) {
      const overlay = getEditorOverlayLayout();
      this.overlayGraphics.fillStyle(COLORS.overlay, 0.85);
      this.overlayGraphics.fillRect(0, 0, PANEL_WIDTH + 40, CANVAS_HEIGHT);
      this.overlayGraphics.fillStyle(0x2a1c12, 1);
      this.overlayGraphics.fillRoundedRect(
        overlay.inputDialogX,
        overlay.inputDialogY,
        overlay.inputDialogWidth,
        overlay.inputDialogHeight,
        16
      );
      this.overlayGraphics.lineStyle(5, COLORS.frameLight, 1);
      this.overlayGraphics.strokeRoundedRect(
        overlay.inputDialogX,
        overlay.inputDialogY,
        overlay.inputDialogWidth,
        overlay.inputDialogHeight,
        16
      );
      this.overlayText.setWordWrapWidth(overlay.inputWrapWidth);
      this.overlayText.setPosition(CANVAS_CENTER_X, overlay.inputTextY);
      this.overlayText.setVisible(true);
    } else if (this.transientMessage) {
      const overlay = getEditorOverlayLayout();
      this.overlayGraphics.fillStyle(COLORS.overlay, 0.92);
      this.overlayGraphics.fillRoundedRect(
        overlay.transientDialogX,
        overlay.transientDialogY,
        overlay.transientDialogWidth,
        overlay.transientDialogHeight,
        14
      );
      this.overlayGraphics.lineStyle(4, COLORS.frameLight, 1);
      this.overlayGraphics.strokeRoundedRect(
        overlay.transientDialogX,
        overlay.transientDialogY,
        overlay.transientDialogWidth,
        overlay.transientDialogHeight,
        14
      );
      this.overlayText.setWordWrapWidth(overlay.inputWrapWidth);
      this.overlayText.setText(this.transientMessage);
      this.overlayText.setPosition(CANVAS_CENTER_X, overlay.transientTextY);
      this.overlayText.setVisible(true);
    } else {
      this.overlayText.setVisible(false);
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

  private adjustGoal(delta: number) {
    const currentStep = Math.round(this.draft.completionPct * 20);
    const nextStep = Math.max(1, Math.min(20, currentStep + Math.round(delta * 20)));
    this.draft.completionPct = nextStep / 20;
    this.renderScene();
  }

  private beginNameEntry() {
    this.naming = true;
    this.overlayText.setText(
      `LEVEL NAME\n\n${this.draft.name}\n\nType to edit. Enter saves. Esc cancels.`
    );
    this.renderScene();
    domBridge.beginTextEntry(this.draft.name, {
      onUpdate: (value) => {
        this.overlayText.setText(
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

  private beginBudgetEntry(kind: "hay" | "tnt") {
    const currentValue =
      kind === "hay" ? this.draft.resourceBudget.hayCells : this.draft.resourceBudget.tntCount;
    const label = kind === "hay" ? "HAY" : "TNT";
    this.budgetEntry = kind;
    this.overlayText.setText(
      `${label} BUDGET\n\n${currentValue}\n\nEnter a whole number from 0 to 999.`
    );
    this.renderScene();
    domBridge.beginNumberEntry(currentValue, {
      onUpdate: (value) => {
        this.overlayText.setText(
          `${label} BUDGET\n\n${value || "(empty)"}\n\nEnter a whole number from 0 to 999.`
        );
      },
      onCommit: (value) => {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isInteger(parsed) || parsed < 0 || parsed > EditorScene.MAX_RESOURCE_INPUT) {
          this.showTransientMessage("Enter a whole number between 0 and 999.");
        } else if (kind === "hay") {
          // TODO: add authored-budget validation so obviously unreasonable values are flagged before export.
          this.draft.resourceBudget.hayCells = parsed;
        } else {
          // TODO: add authored-budget validation so obviously unreasonable values are flagged before export.
          this.draft.resourceBudget.tntCount = parsed;
        }
        this.budgetEntry = null;
        this.renderScene();
      },
      onCancel: () => {
        this.budgetEntry = null;
        this.renderScene();
      }
    });
  }

  private async importLevel() {
    try {
      const raw = await domBridge.pickJsonFile();
      if (!raw) {
        this.showTransientMessage("Import cancelled.");
        return;
      }
      this.draft = parseLevelFile(raw);
      session.replaceEditorDraft(this.draft);
      this.showTransientMessage("Imported level into the editor.");
      this.renderScene();
    } catch (error) {
      this.showTransientMessage(error instanceof Error ? error.message : "Import failed.");
    }
  }

  private exportLevel() {
    const errors = validateLevel(this.draft);
    if (errors.length) {
      this.showTransientMessage(errors[0]);
      return;
    }
    domBridge.downloadText(`${slugify(this.draft.name || this.draft.id)}.json`, serializeLevel(this.draft));
    session.addCustomLevel(cloneLevel(this.draft));
    this.showTransientMessage("Exported level JSON.");
  }

  private playTest() {
    const errors = validateLevel(this.draft);
    if (errors.length) {
      this.showTransientMessage(errors[0]);
      return;
    }
    session.replaceEditorDraft(this.draft);
    this.scene.start("GameScene", {
      level: cloneLevel(this.draft),
      fromEditor: true
    });
  }

  private showTransientMessage(message: string) {
    this.transientMessage = message;
    this.transientMessageTimer?.remove(false);
    this.transientMessageTimer = this.time.delayedCall(1800, () => {
      this.transientMessage = null;
      this.renderScene();
    });
    this.renderScene();
  }
}

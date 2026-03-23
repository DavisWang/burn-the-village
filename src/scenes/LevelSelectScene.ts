import Phaser from "phaser";

import {
  HEADER_Y,
  HUD_ORIGIN,
  MAP_ORIGIN,
  PANEL_WIDTH,
  SIDEBAR_ORIGIN
} from "../game/constants";
import { parseLevelFile } from "../game/level-io";
import { session } from "../game/session";
import type { LevelCatalogEntry } from "../game/types";
import { drawLevelThumbnail, drawPanelFrame } from "../ui/board-renderer";
import { domBridge } from "../ui/dom-bridge";
import { PixelButton } from "../ui/pixel-button";

export class LevelSelectScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super("LevelSelectScene");
  }

  create() {
    const frame = this.add.graphics();
    drawPanelFrame(frame);

    this.add
      .text(MAP_ORIGIN.x, HEADER_Y, "LEVEL SELECT", {
        fontFamily: "Courier New",
        fontSize: "24px",
        color: "#fce7b2",
        fontStyle: "bold",
        resolution: 2
      })
      .setOrigin(0, 0.5);

    this.statusText = this.add
      .text(HUD_ORIGIN.x, HUD_ORIGIN.y + 88, "", {
        fontFamily: "Courier New",
        fontSize: "16px",
        color: "#83dd4c",
        resolution: 2,
        wordWrap: { width: PANEL_WIDTH - 48 }
      })
      .setOrigin(0, 0);

    this.buildCards(session.getCatalog());
    this.buildSidebar();
  }

  private buildCards(entries: LevelCatalogEntry[]) {
    const cardWidth = 238;
    const cardHeight = 94;
    const cardGapX = 20;
    const cardGapY = 10;
    const maxCards = 10;

    entries.slice(0, maxCards).forEach((entry, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = MAP_ORIGIN.x + column * (cardWidth + cardGapX);
      const y = MAP_ORIGIN.y + row * (cardHeight + cardGapY);
      const sourceLabel = entry.source === "built-in" ? "BUILT-IN" : "CUSTOM";
      const statsText = [
        sourceLabel,
        `GOAL ${(entry.level.completionPct * 100).toFixed(0)}%`,
        `HAY ${entry.level.resourceBudget.hayCells}`,
        `TNT ${entry.level.resourceBudget.tntCount}`
      ].join("\n");

      const card = this.add.rectangle(x, y, cardWidth, cardHeight, 0x281a11).setOrigin(0);
      card.setStrokeStyle(3, 0x6b4d26);
      card.setInteractive({ useHandCursor: true });
      card.on("pointerdown", () => {
        this.scene.start("GameScene", { levelId: entry.level.id });
      });

      const preview = this.add.graphics();
      drawLevelThumbnail(preview, entry.level, x + 10, y + 10, 72);

      this.add
        .text(x + 92, y + 12, entry.level.name, {
          fontFamily: "Courier New",
          fontSize: "15px",
          color: "#fce7b2",
          fontStyle: "bold",
          resolution: 2,
          wordWrap: { width: 132 }
        })
        .setOrigin(0, 0);

      this.add
        .text(
          x + 92,
          y + 38,
          statsText,
          {
            fontFamily: "Courier New",
            fontSize: "11px",
            color: "#bfa16e",
            resolution: 2,
            lineSpacing: 2,
            wordWrap: { width: 132 }
          }
        )
        .setOrigin(0, 0);
    });
  }

  private buildSidebar() {
    this.add
      .text(SIDEBAR_ORIGIN.x, SIDEBAR_ORIGIN.y + 8, "PLAYABLE LEVELS", {
        fontFamily: "Courier New",
        fontSize: "18px",
        color: "#fce7b2",
        fontStyle: "bold",
        resolution: 2
      })
      .setOrigin(0, 0);

    this.add
      .text(
        SIDEBAR_ORIGIN.x,
        SIDEBAR_ORIGIN.y + 46,
        "Pick a built-in level or import a JSON file.\nCustom levels stay in memory for this session and can be re-exported from the editor.",
        {
          fontFamily: "Courier New",
          fontSize: "14px",
          color: "#bfa16e",
          resolution: 2,
          wordWrap: { width: 180 }
        }
      )
      .setOrigin(0, 0);

    new PixelButton({
      scene: this,
      x: SIDEBAR_ORIGIN.x,
      y: SIDEBAR_ORIGIN.y + 152,
      width: 180,
      height: 52,
      label: "IMPORT JSON",
      onClick: () => void this.importLevel()
    });

    new PixelButton({
      scene: this,
      x: SIDEBAR_ORIGIN.x,
      y: SIDEBAR_ORIGIN.y + 218,
      width: 180,
      height: 52,
      label: "EDITOR",
      onClick: () => this.scene.start("EditorScene")
    });

    new PixelButton({
      scene: this,
      x: SIDEBAR_ORIGIN.x,
      y: SIDEBAR_ORIGIN.y + 284,
      width: 180,
      height: 52,
      label: "BACK",
      onClick: () => this.scene.start("MenuScene")
    });
  }

  private async importLevel() {
    try {
      const raw = await domBridge.pickJsonFile();
      if (!raw) {
        this.statusText.setText("Import cancelled.");
        return;
      }
      const level = parseLevelFile(raw);
      session.addCustomLevel(level);
      this.scene.restart();
    } catch (error) {
      this.statusText.setText(error instanceof Error ? error.message : "Import failed.");
    }
  }
}

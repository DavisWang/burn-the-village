import Phaser from "phaser";

import { playCue, unlockAudio } from "../audio/controller";
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
import { addGlobalAudioToggle } from "../ui/global-audio-toggle";
import { getLevelCardStatsText, getLevelSelectSidebarCopy } from "../ui/level-select-content";
import { clampLevelSelectScroll, getLevelSelectGridLayout, getLevelSelectSidebarLayout } from "../ui/layout";
import { PixelButton } from "../ui/pixel-button";
import { PIXEL_FONT_FAMILY, pixelFontSize } from "../ui/typography";

export class LevelSelectScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;
  private cardContainer!: Phaser.GameObjects.Container;
  private cards: Phaser.GameObjects.Container[] = [];
  private scrollOffset = 0;
  private maxScroll = 0;

  constructor() {
    super("LevelSelectScene");
  }

  create() {
    const frame = this.add.graphics();
    drawPanelFrame(frame);
    addGlobalAudioToggle(this);

    this.add
      .text(MAP_ORIGIN.x, HEADER_Y, "LEVEL SELECT", {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: pixelFontSize(24),
        color: "#fce7b2",
        fontStyle: "bold",
        resolution: 2
      })
      .setOrigin(0, 0.5);

    this.statusText = this.add
      .text(HUD_ORIGIN.x, HUD_ORIGIN.y + 88, "", {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: pixelFontSize(16),
        color: "#83dd4c",
        resolution: 2,
        wordWrap: { width: PANEL_WIDTH - 48 }
      })
      .setOrigin(0, 0);

    this.buildCards(session.getCatalog());
    this.buildSidebar();
    this.bindScrollControls(session.getCatalog().length);
  }

  private buildCards(entries: LevelCatalogEntry[]) {
    const grid = getLevelSelectGridLayout(entries.length);
    const maskGraphics = this.make.graphics();
    maskGraphics.fillStyle(0xffffff, 1);
    maskGraphics.fillRect(grid.viewportX, grid.viewportY, grid.viewportWidth, grid.viewportHeight);
    this.cardContainer = this.add.container(0, 0);
    this.cardContainer.setMask(maskGraphics.createGeometryMask());
    this.maxScroll = grid.maxScroll;

    entries.forEach((entry, index) => {
      const column = index % grid.columns;
      const row = Math.floor(index / grid.columns);
      const x = MAP_ORIGIN.x + column * (grid.cardWidth + grid.cardGapX);
      const y = MAP_ORIGIN.y + row * (grid.cardHeight + grid.cardGapY);
      const statsText = getLevelCardStatsText(entry);
      const cardContainer = this.add.container(x, y);

      const card = this.add.rectangle(0, 0, grid.cardWidth, grid.cardHeight, 0x281a11).setOrigin(0);
      card.setStrokeStyle(3, 0x6b4d26);
      card.setInteractive({ useHandCursor: true });
      card.on("pointerdown", () => {
        unlockAudio(this);
        playCue(this, "uiClick");
        this.scene.start("GameScene", { levelId: entry.level.id });
      });

      const preview = this.add.graphics();
      drawLevelThumbnail(preview, entry.level, 10, 10, 72);

      const title = this.add
        .text(92, 12, entry.level.name, {
          fontFamily: PIXEL_FONT_FAMILY,
          fontSize: pixelFontSize(15),
          color: "#fce7b2",
          fontStyle: "bold",
          resolution: 2,
          wordWrap: { width: 132 }
        })
        .setOrigin(0, 0);

      const children: Phaser.GameObjects.GameObject[] = [card, preview, title];
      if (statsText) {
        const stats = this.add
          .text(92, 38, statsText, {
            fontFamily: PIXEL_FONT_FAMILY,
            fontSize: pixelFontSize(15),
            color: "#bfa16e",
            resolution: 2,
            wordWrap: { width: 132 }
          })
          .setOrigin(0, 0);
        children.push(stats);
      }

      cardContainer.add(children);
      cardContainer.setData("baseY", y);
      this.cards.push(cardContainer);
      this.cardContainer.add(cardContainer);
    });

    this.updateCardScroll();
  }

  private buildSidebar() {
    const layout = getLevelSelectSidebarLayout();

    this.add
      .text(layout.headingX, SIDEBAR_ORIGIN.y + 8, "PLAYABLE LEVELS", {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: pixelFontSize(18),
        color: "#fce7b2",
        fontStyle: "bold",
        resolution: 2
      })
      .setOrigin(0, 0);

    this.add
      .text(
        layout.bodyX,
        SIDEBAR_ORIGIN.y + 46,
        getLevelSelectSidebarCopy(),
        {
          fontFamily: PIXEL_FONT_FAMILY,
          fontSize: pixelFontSize(14),
          color: "#bfa16e",
          resolution: 2,
          wordWrap: { width: layout.contentWidth }
        }
      )
      .setOrigin(0, 0);

    new PixelButton({
      scene: this,
      x: layout.contentX,
      y: layout.firstButtonY,
      width: layout.contentWidth,
      height: layout.buttonHeight,
      label: "IMPORT JSON",
      onClick: () => void this.importLevel()
    });

    new PixelButton({
      scene: this,
      x: layout.contentX,
      y: layout.secondButtonY,
      width: layout.contentWidth,
      height: layout.buttonHeight,
      label: "EDITOR",
      onClick: () => this.scene.start("EditorScene")
    });

    new PixelButton({
      scene: this,
      x: layout.contentX,
      y: layout.thirdButtonY,
      width: layout.contentWidth,
      height: layout.buttonHeight,
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

  private bindScrollControls(entryCount: number) {
    const grid = getLevelSelectGridLayout(entryCount);
    const rowStep = grid.cardHeight + grid.cardGapY;
    const pageStep = grid.viewportHeight - rowStep;
    const onWheel = (pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      if (
        pointer.worldX < grid.viewportX ||
        pointer.worldX > grid.viewportX + grid.viewportWidth ||
        pointer.worldY < grid.viewportY ||
        pointer.worldY > grid.viewportY + grid.viewportHeight
      ) {
        return;
      }
      this.setScrollOffset(this.scrollOffset + dy * 0.75, entryCount);
    };
    const onUp = () => this.setScrollOffset(this.scrollOffset - rowStep, entryCount);
    const onDown = () => this.setScrollOffset(this.scrollOffset + rowStep, entryCount);
    const onPageUp = () => this.setScrollOffset(this.scrollOffset - pageStep, entryCount);
    const onPageDown = () => this.setScrollOffset(this.scrollOffset + pageStep, entryCount);

    this.input.on("wheel", onWheel);
    this.input.keyboard?.on("keydown-UP", onUp);
    this.input.keyboard?.on("keydown-DOWN", onDown);
    this.input.keyboard?.on("keydown-PAGEUP", onPageUp);
    this.input.keyboard?.on("keydown-PAGEDOWN", onPageDown);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off("wheel", onWheel);
      this.input.keyboard?.off("keydown-UP", onUp);
      this.input.keyboard?.off("keydown-DOWN", onDown);
      this.input.keyboard?.off("keydown-PAGEUP", onPageUp);
      this.input.keyboard?.off("keydown-PAGEDOWN", onPageDown);
    });
  }

  private setScrollOffset(nextOffset: number, entryCount: number) {
    this.scrollOffset = clampLevelSelectScroll(entryCount, nextOffset);
    this.updateCardScroll();
  }

  private updateCardScroll() {
    const grid = getLevelSelectGridLayout(this.cards.length);
    this.cards.forEach((card) => {
      const baseY = card.getData("baseY") as number;
      const nextY = baseY - this.scrollOffset;
      card.y = nextY;
      const visible =
        nextY + grid.cardHeight >= grid.viewportY && nextY <= grid.viewportY + grid.viewportHeight;
      card.setVisible(visible);
    });
  }
}

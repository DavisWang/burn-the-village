import Phaser from "phaser";

import { playCue, unlockAudio } from "../audio/controller";
import {
  HEADER_Y,
  HUD_ORIGIN,
  MAP_ORIGIN,
  PANEL_WIDTH,
  SIDEBAR_ORIGIN
} from "../game/constants";
import { getDisplayLevelName, getLocale, getTranslations, type Locale } from "../i18n";
import { parseLevelFile } from "../game/level-io";
import { session } from "../game/session";
import type { LevelCatalogEntry } from "../game/types";
import { drawLevelThumbnail, drawPanelFrame } from "../ui/board-renderer";
import { domBridge } from "../ui/dom-bridge";
import { addGlobalAudioToggle } from "../ui/global-audio-toggle";
import { getLevelCardStatsText, getLevelSelectSidebarCopy } from "../ui/level-select-content";
import { clampLevelSelectScroll, getLevelSelectGridLayout, getLevelSelectSidebarLayout } from "../ui/layout";
import { PixelButton } from "../ui/pixel-button";
import { getPixelFontFamily, getPixelFontStyle, pixelFontSize } from "../ui/typography";

export class LevelSelectScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;
  private cardContainer!: Phaser.GameObjects.Container;
  private scrollbarTrack!: Phaser.GameObjects.Rectangle;
  private scrollbarThumb!: Phaser.GameObjects.Rectangle;
  private cards: Phaser.GameObjects.Container[] = [];
  private scrollOffset = 0;
  private maxScroll = 0;
  private locale: Locale = "en";

  constructor() {
    super("LevelSelectScene");
  }

  create() {
    this.locale = getLocale();
    const strings = getTranslations(this.locale);
    const fontFamily = getPixelFontFamily(this.locale);
    const frame = this.add.graphics();
    drawPanelFrame(frame);
    addGlobalAudioToggle(this);

    this.add
      .text(MAP_ORIGIN.x, HEADER_Y, strings.levelSelect.heading, {
        fontFamily,
        fontSize: pixelFontSize(24, this.locale),
        color: "#fce7b2",
        fontStyle: getPixelFontStyle(this.locale),
        resolution: 2
      })
      .setOrigin(0, 0.5);

    this.statusText = this.add
      .text(HUD_ORIGIN.x, HUD_ORIGIN.y + 88, "", {
        fontFamily,
        fontSize: pixelFontSize(16, this.locale),
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
    this.scrollbarTrack = this.add
      .rectangle(
        grid.scrollbarX + grid.scrollbarWidth / 2,
        grid.scrollbarY + grid.scrollbarHeight / 2,
        grid.scrollbarWidth,
        grid.scrollbarHeight,
        0x150d08
      )
      .setOrigin(0.5)
      .setStrokeStyle(2, 0x6b4d26);
    this.scrollbarThumb = this.add
      .rectangle(
        grid.scrollbarX + grid.scrollbarWidth / 2,
        grid.scrollbarY + grid.scrollbarThumbMinHeight / 2,
        grid.scrollbarWidth - 2,
        grid.scrollbarThumbMinHeight,
        0xc59b5b
      )
      .setOrigin(0.5)
      .setStrokeStyle(1, 0xfce7b2);

    entries.forEach((entry, index) => {
      const column = index % grid.columns;
      const row = Math.floor(index / grid.columns);
      const x = MAP_ORIGIN.x + column * (grid.cardWidth + grid.cardGapX);
      const y = MAP_ORIGIN.y + row * (grid.cardHeight + grid.cardGapY);
      const statsText = getLevelCardStatsText(entry, this.locale);
      const fontFamily = getPixelFontFamily(this.locale);
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
        .text(92, 12, getDisplayLevelName(entry.level, this.locale), {
          fontFamily,
          fontSize: pixelFontSize(15, this.locale),
          color: "#fce7b2",
          fontStyle: getPixelFontStyle(this.locale),
          resolution: 2,
          wordWrap: { width: 132 }
        })
        .setOrigin(0, 0);

      const children: Phaser.GameObjects.GameObject[] = [card, preview, title];
      if (statsText) {
        const stats = this.add
          .text(92, 38, statsText, {
            fontFamily,
            fontSize: pixelFontSize(15, this.locale),
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
    const strings = getTranslations(this.locale);
    const fontFamily = getPixelFontFamily(this.locale);

    this.add
      .text(layout.headingX, SIDEBAR_ORIGIN.y + 8, strings.levelSelect.sidebarTitle, {
        fontFamily,
        fontSize: pixelFontSize(18, this.locale),
        color: "#fce7b2",
        fontStyle: getPixelFontStyle(this.locale),
        resolution: 2
      })
      .setOrigin(0, 0);

    this.add
      .text(
        layout.bodyX,
        SIDEBAR_ORIGIN.y + 46,
        getLevelSelectSidebarCopy(this.locale),
        {
          fontFamily,
          fontSize: pixelFontSize(14, this.locale),
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
      label: strings.levelSelect.importJson,
      locale: this.locale,
      onClick: () => void this.importLevel()
    });

    new PixelButton({
      scene: this,
      x: layout.contentX,
      y: layout.secondButtonY,
      width: layout.contentWidth,
      height: layout.buttonHeight,
      label: strings.common.editor,
      locale: this.locale,
      onClick: () => this.scene.start("EditorScene")
    });

    new PixelButton({
      scene: this,
      x: layout.contentX,
      y: layout.thirdButtonY,
      width: layout.contentWidth,
      height: layout.buttonHeight,
      label: strings.common.back,
      locale: this.locale,
      onClick: () => this.scene.start("MenuScene")
    });
  }

  private async importLevel() {
    try {
      const strings = getTranslations(this.locale);
      const raw = await domBridge.pickJsonFile();
      if (!raw) {
        this.statusText.setText(strings.common.importCancelled);
        return;
      }
      const level = parseLevelFile(raw, this.locale);
      session.addCustomLevel(level);
      this.scene.restart();
    } catch (error) {
      this.statusText.setText(error instanceof Error ? error.message : getTranslations(this.locale).common.importFailed);
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

    const thumbHeight = Math.min(
      grid.scrollbarHeight,
      Math.max(
        grid.scrollbarThumbMinHeight,
        Math.round((grid.viewportHeight / grid.contentHeight) * grid.scrollbarHeight)
      )
    );
    const travel = Math.max(0, grid.scrollbarHeight - thumbHeight);
    const progress = this.maxScroll === 0 ? 0 : this.scrollOffset / this.maxScroll;
    const thumbCenterY = grid.scrollbarY + thumbHeight / 2 + travel * progress;
    const isScrollable = this.maxScroll > 0;

    this.scrollbarTrack.setVisible(isScrollable);
    this.scrollbarThumb
      .setVisible(isScrollable)
      .setSize(grid.scrollbarWidth - 2, thumbHeight)
      .setPosition(grid.scrollbarX + grid.scrollbarWidth / 2, thumbCenterY);
  }
}

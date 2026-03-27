import Phaser from "phaser";

import { addGlobalAudioToggle } from "../ui/global-audio-toggle";
import { drawPanelFrame, drawSimulationBoard } from "../ui/board-renderer";
import { getHowToPlayLayout } from "../ui/layout";
import { PixelButton } from "../ui/pixel-button";
import { getPixelFontFamily, getPixelFontStyle, pixelFontSize } from "../ui/typography";
import { HEADER_Y, MAP_ORIGIN } from "../game/constants";
import { createHowToPlayPreviewState } from "../game/how-to-play-preview";
import { getLocale, getTranslations, type Locale } from "../i18n";

export class HowToPlayScene extends Phaser.Scene {
  private previewGraphics!: Phaser.GameObjects.Graphics;
  private previewState = createHowToPlayPreviewState();
  private locale: Locale = "en";
  private previewTick = -1;

  constructor() {
    super("HowToPlayScene");
  }

  create() {
    this.locale = getLocale();
    this.previewState = createHowToPlayPreviewState();
    this.previewTick = -1;
    const strings = getTranslations(this.locale);
    const fontFamily = getPixelFontFamily(this.locale);
    const layout = getHowToPlayLayout();

    drawPanelFrame(this.add.graphics());
    addGlobalAudioToggle(this);

    this.add
      .text(MAP_ORIGIN.x, HEADER_Y, strings.howToPlay.heading, {
        fontFamily,
        fontSize: pixelFontSize(24, this.locale),
        color: "#fce7b2",
        fontStyle: getPixelFontStyle(this.locale),
        resolution: 2
      })
      .setOrigin(0, 0.5);

    this.previewGraphics = this.add.graphics();
    this.renderPreview();
    this.buildMapLabels();

    this.add
      .text(layout.sidebarContentX, layout.introY, strings.howToPlay.intro, {
        fontFamily,
        fontSize: pixelFontSize(13, this.locale),
        color: "#bfa16e",
        resolution: 2,
        lineSpacing: 4,
        wordWrap: { width: layout.sidebarContentWidth }
      })
      .setOrigin(0, 0);

    this.buildSidebarSection(
      strings.howToPlay.objectiveTitle,
      strings.howToPlay.objectiveCopy,
      layout.sidebarContentX,
      layout.objectiveTitleY,
      layout.objectiveBodyY,
      layout.sidebarContentWidth
    );
    this.buildSidebarSection(
      strings.howToPlay.toolsTitle,
      strings.howToPlay.toolsCopy,
      layout.sidebarContentX,
      layout.toolsTitleY,
      layout.toolsBodyY,
      layout.sidebarContentWidth
    );
    this.buildSidebarSection(
      strings.howToPlay.terrainTitle,
      strings.howToPlay.terrainCopy,
      layout.sidebarContentX,
      layout.terrainTitleY,
      layout.terrainBodyY,
      layout.sidebarContentWidth
    );

    const bottomSections = [
      { key: "structures", title: strings.howToPlay.structuresTitle, body: strings.howToPlay.structuresCopy },
      { key: "controls", title: strings.howToPlay.controlsTitle, body: strings.howToPlay.controlsCopy },
      { key: "scoring", title: strings.howToPlay.scoringTitle, body: strings.howToPlay.scoringCopy }
    ] as const;

    bottomSections.forEach((section) => {
      const column = layout.hudColumns.find((item) => item.key === section.key);
      if (!column) {
        return;
      }
      this.buildBottomSection(section.title, section.body, column.x, column.titleY, column.bodyY, column.width);
    });

    new PixelButton({
      scene: this,
      x: layout.buttonX,
      y: layout.levelSelectButtonY,
      width: layout.buttonWidth,
      height: layout.buttonHeight,
      label: strings.menu.levelSelect,
      locale: this.locale,
      onClick: () => this.scene.start("LevelSelectScene")
    });

    new PixelButton({
      scene: this,
      x: layout.buttonX,
      y: layout.backButtonY,
      width: layout.buttonWidth,
      height: layout.buttonHeight,
      label: strings.common.back,
      locale: this.locale,
      onClick: () => this.scene.start("MenuScene")
    });
  }

  update(time: number) {
    const nextTick = Math.floor(time / 140);
    if (nextTick === this.previewTick) {
      return;
    }
    this.previewTick = nextTick;
    this.previewState.tick = nextTick;
    this.renderPreview();
  }

  private renderPreview() {
    this.previewGraphics.clear();
    drawSimulationBoard(this.previewGraphics, this.previewState);
  }

  private buildMapLabels() {
    const strings = getTranslations(this.locale);
    const fontFamily = getPixelFontFamily(this.locale);
    const layout = getHowToPlayLayout();

    layout.mapLabels.forEach((label) => {
      const text = this.add
        .text(label.x, label.y, strings.howToPlay.mapLabels[label.key as keyof typeof strings.howToPlay.mapLabels], {
          fontFamily,
          fontSize: pixelFontSize(11, this.locale),
          color: "#fce7b2",
          fontStyle: getPixelFontStyle(this.locale),
          stroke: "#2a1c12",
          strokeThickness: 4,
          resolution: 2,
          wordWrap: { width: label.maxWidth, useAdvancedWrap: true }
        })
        .setOrigin(label.originX, label.originY)
        .setDepth(3);

      const bounds = text.getBounds();
      this.add
        .rectangle(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, bounds.width + 10, bounds.height + 6, 0x120d09, 0.82)
        .setStrokeStyle(2, 0x6b4d26, 0.95)
        .setDepth(2);
      text.setDepth(3);
    });
  }

  private buildSidebarSection(title: string, body: string, x: number, titleY: number, bodyY: number, width: number) {
    const fontFamily = getPixelFontFamily(this.locale);

    this.add
      .text(x, titleY, title, {
        fontFamily,
        fontSize: pixelFontSize(15, this.locale),
        color: "#fce7b2",
        fontStyle: getPixelFontStyle(this.locale),
        resolution: 2
      })
      .setOrigin(0, 0);

    this.add
      .text(x, bodyY, body, {
        fontFamily,
        fontSize: pixelFontSize(12, this.locale),
        color: "#bfa16e",
        resolution: 2,
        lineSpacing: 4,
        wordWrap: { width }
      })
      .setOrigin(0, 0);
  }

  private buildBottomSection(title: string, body: string, x: number, titleY: number, bodyY: number, width: number) {
    const fontFamily = getPixelFontFamily(this.locale);

    this.add
      .text(x, titleY, title, {
        fontFamily,
        fontSize: pixelFontSize(15, this.locale),
        color: "#fce7b2",
        fontStyle: getPixelFontStyle(this.locale),
        resolution: 2
      })
      .setOrigin(0, 0);

    this.add
      .text(x, bodyY, body, {
        fontFamily,
        fontSize: pixelFontSize(12, this.locale),
        color: "#bfa16e",
        resolution: 2,
        lineSpacing: 4,
        wordWrap: { width }
      })
      .setOrigin(0, 0);
  }
}

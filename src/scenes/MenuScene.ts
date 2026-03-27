import Phaser from "phaser";

import { COLORS } from "../game/constants";
import { getLocale, getTranslations, setLocale, type Locale } from "../i18n";
import { playCue, unlockAudio } from "../audio/controller";
import { addGlobalAudioToggle } from "../ui/global-audio-toggle";
import { drawMenuFrame } from "../ui/board-renderer";
import { getMenuLocaleToggleLayout, getMenuPanelLayout } from "../ui/layout";
import { PixelButton } from "../ui/pixel-button";
import { getPixelFontFamily, getPixelFontStyle, pixelFontSize } from "../ui/typography";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const locale = getLocale();
    const strings = getTranslations(locale);
    const fontFamily = getPixelFontFamily(locale);

    drawMenuFrame(this.add.graphics());
    addGlobalAudioToggle(this);
    const layout = getMenuPanelLayout();

    this.add
      .text(layout.titleCenterX, layout.contentY + 86, strings.menu.titleTop, {
        fontFamily,
        fontSize: pixelFontSize(locale === "en" ? 38 : 32, locale),
        fontStyle: getPixelFontStyle(locale),
        color: "#e9bb42",
        resolution: 2
      })
      .setOrigin(0.5);

    this.add
      .text(layout.titleCenterX, layout.contentY + 146, strings.menu.titleBottom, {
        fontFamily,
        fontSize: pixelFontSize(locale === "en" ? 66 : 54, locale),
        fontStyle: getPixelFontStyle(locale),
        color: "#fce7b2",
        stroke: "#7b2e17",
        strokeThickness: 10,
        resolution: 2
      })
      .setOrigin(0.5);

    this.add
      .text(layout.titleCenterX, layout.contentY + 220, strings.menu.tagline, {
        fontFamily,
        fontSize: pixelFontSize(locale === "en" ? 18 : 16, locale),
        color: "#bfa16e",
        align: "center",
        resolution: 2,
        wordWrap: { width: layout.textWidth }
      })
      .setOrigin(0.5);

    new PixelButton({
      scene: this,
      x: layout.buttonX,
      y: layout.buttonYs[0],
      width: layout.buttonWidth,
      height: layout.buttonHeight,
      label: strings.menu.levelSelect,
      locale,
      fontSize: "18px",
      onClick: () => this.scene.start("LevelSelectScene")
    });

    new PixelButton({
      scene: this,
      x: layout.buttonX,
      y: layout.buttonYs[1],
      width: layout.buttonWidth,
      height: layout.buttonHeight,
      label: strings.menu.howToPlay,
      locale,
      fontSize: "18px",
      onClick: () => this.scene.start("HowToPlayScene")
    });

    new PixelButton({
      scene: this,
      x: layout.buttonX,
      y: layout.buttonYs[2],
      width: layout.buttonWidth,
      height: layout.buttonHeight,
      label: strings.menu.levelEditor,
      locale,
      fontSize: "18px",
      onClick: () => this.scene.start("EditorScene")
    });

    this.add
      .text(layout.footnoteX, layout.footnoteY, strings.menu.byline, {
        fontFamily,
        fontSize: pixelFontSize(14, locale),
        color: "#bfa16e",
        resolution: 2
      })
      .setOrigin(0.5, 1);

    this.buildLocaleToggle(locale);
  }

  private buildLocaleToggle(locale: Locale) {
    const layout = getMenuLocaleToggleLayout();
    const container = this.add.container(layout.x, layout.y);
    const frame = this.add
      .rectangle(0, 0, layout.width, layout.height, 0x281a11)
      .setOrigin(0)
      .setStrokeStyle(3, COLORS.frameDark);
    const activeX = locale === "en" ? 0 : layout.segmentWidth;
    const activePanel = this.add
      .rectangle(activeX, 0, layout.segmentWidth, layout.height, 0x6e4716)
      .setOrigin(0)
      .setStrokeStyle(2, COLORS.warning, 0.8);
    const divider = this.add
      .rectangle(layout.segmentWidth - 1, 5, 2, layout.height - 10, COLORS.frameLight, 0.45)
      .setOrigin(0);
    const englishLabel = this.add
      .text(layout.segmentWidth / 2, layout.height / 2 + 1, "EN", {
        fontFamily: getPixelFontFamily("en"),
        fontSize: pixelFontSize(14, "en"),
        color: locale === "en" ? "#fce7b2" : "#bfa16e",
        fontStyle: getPixelFontStyle("en"),
        resolution: 2
      })
      .setOrigin(0.5);
    const chineseLabel = this.add
      .text(layout.segmentWidth + layout.segmentWidth / 2, layout.height / 2 + 1, "中文", {
        fontFamily: getPixelFontFamily("zhHans"),
        fontSize: pixelFontSize(13, "zhHans"),
        color: locale === "zhHans" ? "#fce7b2" : "#bfa16e",
        fontStyle: getPixelFontStyle("zhHans"),
        resolution: 2
      })
      .setOrigin(0.5);
    const englishHit = this.add.zone(0, 0, layout.segmentWidth, layout.height).setOrigin(0);
    const chineseHit = this.add.zone(layout.segmentWidth, 0, layout.segmentWidth, layout.height).setOrigin(0);
    const switchLocale = (nextLocale: Locale) => {
      if (nextLocale === locale) {
        return;
      }
      unlockAudio(this);
      playCue(this, "uiClick");
      setLocale(nextLocale);
      this.scene.restart();
    };

    englishHit.setInteractive({ useHandCursor: true }).on("pointerdown", () => switchLocale("en"));
    chineseHit.setInteractive({ useHandCursor: true }).on("pointerdown", () => switchLocale("zhHans"));

    container.add([activePanel, frame, divider, englishLabel, chineseLabel, englishHit, chineseHit]);
  }
}

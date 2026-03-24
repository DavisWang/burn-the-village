import Phaser from "phaser";

import { addGlobalAudioToggle } from "../ui/global-audio-toggle";
import { drawMenuFrame } from "../ui/board-renderer";
import { getMenuPanelLayout } from "../ui/layout";
import { PixelButton } from "../ui/pixel-button";
import { PIXEL_FONT_FAMILY, pixelFontSize } from "../ui/typography";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    drawMenuFrame(this.add.graphics());
    addGlobalAudioToggle(this);
    const layout = getMenuPanelLayout();

    this.add
      .text(layout.titleCenterX, layout.contentY + 86, "BURN THE", {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: pixelFontSize(38),
        fontStyle: "bold",
        color: "#e9bb42",
        resolution: 2
      })
      .setOrigin(0.5);

    this.add
      .text(layout.titleCenterX, layout.contentY + 146, "VILLAGE", {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: pixelFontSize(66),
        fontStyle: "bold",
        color: "#fce7b2",
        stroke: "#7b2e17",
        strokeThickness: 10,
        resolution: 2
      })
      .setOrigin(0.5);

    this.add
      .text(layout.titleCenterX, layout.contentY + 220, "LAY THE TRAIL. LIGHT THE FUSE.\nLEAVE NOTHING STANDING.", {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: pixelFontSize(18),
        color: "#bfa16e",
        align: "center",
        resolution: 2,
        wordWrap: { width: layout.textWidth }
      })
      .setOrigin(0.5);

    new PixelButton({
      scene: this,
      x: layout.buttonX,
      y: layout.firstButtonY,
      width: layout.buttonWidth,
      height: layout.buttonHeight,
      label: "LEVEL SELECT",
      fontSize: "18px",
      onClick: () => this.scene.start("LevelSelectScene")
    });

    new PixelButton({
      scene: this,
      x: layout.buttonX,
      y: layout.secondButtonY,
      width: layout.buttonWidth,
      height: layout.buttonHeight,
      label: "LEVEL EDITOR",
      fontSize: "18px",
      onClick: () => this.scene.start("EditorScene")
    });

    this.add
      .text(layout.footnoteX, layout.footnoteY, "By Davis Wang", {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: pixelFontSize(14),
        color: "#bfa16e",
        resolution: 2
      })
      .setOrigin(0.5, 1);
  }
}

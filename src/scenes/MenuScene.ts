import Phaser from "phaser";

import { drawMenuFrame } from "../ui/board-renderer";
import { getMenuPanelLayout } from "../ui/layout";
import { PixelButton } from "../ui/pixel-button";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    drawMenuFrame(this.add.graphics());
    const layout = getMenuPanelLayout();

    this.add
      .text(layout.titleCenterX, layout.contentY + 86, "BURN THE", {
        fontFamily: "Courier New",
        fontSize: "38px",
        fontStyle: "bold",
        color: "#e9bb42",
        resolution: 2
      })
      .setOrigin(0.5);

    this.add
      .text(layout.titleCenterX, layout.contentY + 146, "VILLAGE", {
        fontFamily: "Courier New",
        fontSize: "66px",
        fontStyle: "bold",
        color: "#fce7b2",
        stroke: "#7b2e17",
        strokeThickness: 10,
        resolution: 2
      })
      .setOrigin(0.5);

    this.add
      .text(layout.titleCenterX, layout.contentY + 220, "LAY THE TRAIL. LIGHT THE FUSE.\nLEAVE NOTHING STANDING.", {
        fontFamily: "Courier New",
        fontSize: "18px",
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
        fontFamily: "Courier New",
        fontSize: "14px",
        color: "#bfa16e",
        resolution: 2
      })
      .setOrigin(1, 1);
  }
}

import Phaser from "phaser";

import { MAP_ORIGIN, MAP_SIZE, PLAYFIELD_CENTER_X } from "../game/constants";
import { drawPanelFrame } from "../ui/board-renderer";
import { PixelButton } from "../ui/pixel-button";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const frame = this.add.graphics();
    drawPanelFrame(frame);
    const titleCenterX = PLAYFIELD_CENTER_X;
    const textWidth = MAP_SIZE - 92;

    this.add
      .text(titleCenterX, MAP_ORIGIN.y + 86, "BURN THE", {
        fontFamily: "Courier New",
        fontSize: "38px",
        fontStyle: "bold",
        color: "#e9bb42",
        resolution: 2
      })
      .setOrigin(0.5);

    this.add
      .text(titleCenterX, MAP_ORIGIN.y + 146, "VILLAGE", {
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
      .text(titleCenterX, MAP_ORIGIN.y + 220, "LAY THE TRAIL. LIGHT THE FUSE.\nLEAVE NOTHING STANDING.", {
        fontFamily: "Courier New",
        fontSize: "18px",
        color: "#bfa16e",
        align: "center",
        resolution: 2,
        wordWrap: { width: textWidth }
      })
      .setOrigin(0.5);

    const buttonX = titleCenterX - 124;
    new PixelButton({
      scene: this,
      x: buttonX,
      y: MAP_ORIGIN.y + 298,
      width: 248,
      height: 72,
      label: "LEVEL SELECT",
      fontSize: "18px",
      onClick: () => this.scene.start("LevelSelectScene")
    });

    new PixelButton({
      scene: this,
      x: buttonX,
      y: MAP_ORIGIN.y + 388,
      width: 248,
      height: 72,
      label: "LEVEL EDITOR",
      fontSize: "18px",
      onClick: () => this.scene.start("EditorScene")
    });
  }
}

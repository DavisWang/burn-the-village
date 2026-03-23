import Phaser from "phaser";

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH
} from "./game/constants";
import { BootScene } from "./scenes/BootScene";
import { EditorScene } from "./scenes/EditorScene";
import { GameScene } from "./scenes/GameScene";
import { LevelSelectScene } from "./scenes/LevelSelectScene";
import { MenuScene } from "./scenes/MenuScene";
import "./styles.css";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#0b0906",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT
  },
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  scene: [BootScene, MenuScene, LevelSelectScene, GameScene, EditorScene]
});

declare global {
  interface Window {
    __BTV_GAME__?: Phaser.Game;
  }
}

window.__BTV_GAME__ = game;

window.addEventListener("beforeunload", () => {
  game.destroy(true);
});

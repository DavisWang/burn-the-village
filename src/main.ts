import Phaser from "phaser";
import "@fontsource/pixelify-sans/400.css";
import "@fontsource/pixelify-sans/600.css";
import "@fontsource/pixelify-sans/700.css";
import "@fontsource/jersey-10/400.css";
import "@fontsource/silkscreen/400.css";
import "@fontsource/silkscreen/700.css";
import "@fontsource/tiny5/400.css";

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH
} from "./game/constants";
import { BootScene } from "./scenes/BootScene";
import { EditorScene } from "./scenes/EditorScene";
import { GameScene } from "./scenes/GameScene";
import { HowToPlayScene } from "./scenes/HowToPlayScene";
import { LevelSelectScene } from "./scenes/LevelSelectScene";
import { MenuScene } from "./scenes/MenuScene";
import { waitForPixelFontReady } from "./ui/typography";
import "./styles.css";

let game: Phaser.Game | null = null;

async function bootstrap() {
  await waitForPixelFontReady(document.fonts ?? null);

  game = new Phaser.Game({
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
    scene: [BootScene, MenuScene, HowToPlayScene, LevelSelectScene, GameScene, EditorScene]
  });

  window.__BTV_GAME__ = game;
}

declare global {
  interface Window {
    __BTV_GAME__?: Phaser.Game;
  }
}

void bootstrap();

window.addEventListener("beforeunload", () => {
  game?.destroy(true);
});

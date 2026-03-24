import Phaser from "phaser";

import { preloadAudioAssets } from "../audio/controller";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    preloadAudioAssets(this);
  }

  create() {
    this.cameras.main.setBackgroundColor("#0b0906");
    this.scene.start("MenuScene");
  }
}

import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#0b0906");
    this.scene.start("MenuScene");
  }
}

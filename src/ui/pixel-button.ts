import Phaser from "phaser";

import { COLORS } from "../game/constants";
import { getPixelButtonLayerOrder } from "./pixel-button-order";
import { PIXEL_FONT_FAMILY, PIXEL_FONT_SIZE_STEP } from "./typography";

type PixelButtonOptions = {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  fontSize?: string;
  labelOffsetX?: number;
  labelOffsetY?: number;
  onClick: () => void;
};

export class PixelButton extends Phaser.GameObjects.Container {
  private readonly selectionOutline: Phaser.GameObjects.Rectangle;
  private readonly shadow: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly highlight: Phaser.GameObjects.Rectangle;
  private readonly labelText: Phaser.GameObjects.Text;
  private readonly hitArea: Phaser.GameObjects.Zone;
  private readonly onClick: () => void;
  private readonly buttonWidth: number;
  private readonly baseFontSize: number;
  private enabled = true;
  private selected = false;

  constructor(options: PixelButtonOptions) {
    super(options.scene, options.x, options.y);
    this.onClick = options.onClick;
    this.buttonWidth = options.width;
    this.baseFontSize = Number.parseInt(options.fontSize ?? "18", 10) + PIXEL_FONT_SIZE_STEP;

    this.selectionOutline = options.scene.add
      .rectangle(4, 4, options.width - 8, options.height - 8)
      .setOrigin(0)
      .setStrokeStyle(2, COLORS.frameLight)
      .setVisible(false);
    this.shadow = options.scene.add
      .rectangle(4, 6, options.width, options.height, 0x090604)
      .setOrigin(0);
    this.panel = options.scene.add
      .rectangle(0, 0, options.width, options.height, 0x4f3418)
      .setOrigin(0)
      .setStrokeStyle(4, COLORS.frameDark);
    this.highlight = options.scene.add
      .rectangle(3, 3, options.width - 6, 8, COLORS.frameLight, 0.45)
      .setOrigin(0);
    const labelOffsetX = options.labelOffsetX ?? 0;
    const labelOffsetY = options.labelOffsetY ?? 0;
    this.labelText = options.scene.add
      .text(options.width / 2 + labelOffsetX, options.height / 2 + labelOffsetY, options.label, {
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: `${this.baseFontSize}px`,
        color: "#fce7b2",
        fontStyle: "bold",
        resolution: 2
      })
      .setOrigin(0.5);
    this.hitArea = options.scene.add.zone(0, 0, options.width, options.height).setOrigin(0);
    const layers = {
      shadow: this.shadow,
      panel: this.panel,
      highlight: this.highlight,
      selectionOutline: this.selectionOutline,
      labelText: this.labelText,
      hitArea: this.hitArea
    } as const;

    this.add(getPixelButtonLayerOrder().map((key) => layers[key]));
    this.setSize(options.width, options.height);
    this.hitArea.setInteractive({ useHandCursor: true });
    this.hitArea.on("pointerdown", () => {
      if (this.enabled) {
        this.onClick();
      }
    });
    this.hitArea.on("pointerover", () => this.redraw(true));
    this.hitArea.on("pointerout", () => this.redraw(false));
    this.fitLabelToWidth();
    this.redraw(false);
    options.scene.add.existing(this);
  }

  setLabel(label: string) {
    this.labelText.setText(label);
    this.fitLabelToWidth();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.redraw(false);
  }

  setSelected(selected: boolean) {
    this.selected = selected;
    this.redraw(false);
  }

  private redraw(hovered: boolean) {
    this.selectionOutline.setVisible(this.selected);
    this.selectionOutline.setStrokeStyle(2, this.enabled ? COLORS.frameLight : 0x8b7652);
    this.selectionOutline.setAlpha(this.selected ? (this.enabled ? 0.85 : 0.45) : 0);

    if (!this.enabled) {
      this.panel.setFillStyle(0x2e2418);
      this.panel.setStrokeStyle(4, 0x45331d);
      this.highlight.setAlpha(0.15);
      this.labelText.setAlpha(0.45);
      return;
    }

    if (this.selected) {
      this.panel.setFillStyle(0x6e4716);
      this.panel.setStrokeStyle(4, COLORS.warning);
      this.highlight.setAlpha(0.55);
    } else if (hovered) {
      this.panel.setFillStyle(0x66421a);
      this.panel.setStrokeStyle(4, COLORS.frameLight);
      this.highlight.setAlpha(0.55);
    } else {
      this.panel.setFillStyle(0x4f3418);
      this.panel.setStrokeStyle(4, COLORS.frameDark);
      this.highlight.setAlpha(0.35);
    }
    this.labelText.setAlpha(1);
  }

  private fitLabelToWidth() {
    let fontSize = this.baseFontSize;
    this.labelText.setFontSize(`${fontSize}px`);
    while (fontSize > 16 && this.labelText.width > this.buttonWidth - 22) {
      fontSize -= 1;
      this.labelText.setFontSize(`${fontSize}px`);
    }
  }
}

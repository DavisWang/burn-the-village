import type Phaser from "phaser";

import { bindSceneAudioInput, getAudioRuntimeState, toggleMute } from "../audio/controller";
import { COLORS } from "../game/constants";
import { PixelButton } from "./pixel-button";
import { getGlobalAudioToggleLayout } from "./layout";

export function addGlobalAudioToggle(scene: Phaser.Scene): PixelButton {
  const layout = getGlobalAudioToggleLayout();
  const button = new PixelButton({
    scene,
    x: layout.x,
    y: layout.y,
    width: layout.width,
    height: layout.height,
    label: "",
    fontSize: "12px",
    onClick: () => {
      toggleMute(scene);
      syncLabel();
    }
  });
  button.setDepth(95);
  const icon = scene.add.graphics().setDepth(96);

  const drawIcon = () => {
    const { muted } = getAudioRuntimeState();
    const centerX = layout.x + layout.width / 2;
    const centerY = layout.y + layout.height / 2;
    const speakerColor = muted ? COLORS.textDim : COLORS.text;
    const accentColor = muted ? COLORS.danger : COLORS.frameLight;
    const stemWidth = 2;
    const stemHeight = 6;
    const stemX = centerX - 8;
    const stemY = centerY - stemHeight / 2;
    const coneLeftX = centerX - 6;
    const coneTipX = centerX - 1;
    const coneTopY = centerY - 5;

    icon.clear();
    icon.fillStyle(speakerColor, 1);
    icon.fillRect(stemX, stemY, stemWidth, stemHeight);
    icon.fillTriangle(
      coneLeftX,
      coneTopY,
      coneTipX,
      centerY - 7,
      coneTipX,
      centerY + 7
    );

    icon.lineStyle(2, accentColor, muted ? 0.95 : 0.85);
    if (muted) {
      icon.lineBetween(centerX + 1, centerY - 4, centerX + 5, centerY + 4);
      icon.lineBetween(centerX + 5, centerY - 4, centerX + 1, centerY + 4);
      return;
    }

    icon.lineBetween(centerX + 1, centerY - 2, centerX + 3, centerY - 1);
    icon.lineBetween(centerX + 3, centerY - 1, centerX + 3, centerY + 1);
    icon.lineBetween(centerX + 3, centerY + 1, centerX + 1, centerY + 2);

    icon.lineBetween(centerX + 4, centerY - 4, centerX + 6, centerY - 2);
    icon.lineBetween(centerX + 6, centerY - 2, centerX + 6, centerY + 2);
    icon.lineBetween(centerX + 6, centerY + 2, centerX + 4, centerY + 4);
  };

  const syncLabel = () => {
    button.setLabel("");
    drawIcon();
  };

  bindSceneAudioInput(scene, () => {
    syncLabel();
  });
  syncLabel();

  return button;
}

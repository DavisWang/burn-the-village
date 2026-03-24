import type { AudioCueKey } from "../audio/catalog";

export type PixelButtonPointerEvent = "pointerdown" | "pointerover" | "pointerout";

export function getPixelButtonCueForEvent(
  event: PixelButtonPointerEvent,
  enabled: boolean,
  clickCue?: AudioCueKey | null
): AudioCueKey | null {
  if (event !== "pointerdown" || !enabled) {
    return null;
  }
  return clickCue === undefined ? "uiClick" : clickCue;
}

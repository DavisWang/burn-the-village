export const PIXEL_FONT_FAMILY = '"Tiny5", "Jersey 10", "Silkscreen", "Pixelify Sans", "Courier New", monospace';
export const PIXEL_FONT_LOAD = '16px "Tiny5"';
export const PIXEL_FONT_SIZE_STEP = 6;

type FontLoader = {
  load: (font: string) => Promise<unknown>;
  ready: Promise<unknown>;
};

export function pixelFontSize(size: number | `${number}px`) {
  const baseSize =
    typeof size === "number" ? size : Number.parseInt(size.replace("px", ""), 10);
  return `${baseSize + PIXEL_FONT_SIZE_STEP}px`;
}

export async function waitForPixelFontReady(fonts?: FontLoader | null) {
  if (!fonts) {
    return;
  }

  await fonts.load(PIXEL_FONT_LOAD);
  await fonts.ready;
}

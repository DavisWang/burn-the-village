import type { Locale } from "../i18n";

export const PIXEL_FONT_FAMILY = '"Tiny5", "Jersey 10", "Silkscreen", "Pixelify Sans", "Courier New", monospace';
export const PIXEL_FONT_FAMILY_ZH_HANS =
  '"Fusion Pixel ZH", "Tiny5", "Jersey 10", "Silkscreen", "Pixelify Sans", "Courier New", monospace';
export const PIXEL_FONT_LOAD = '16px "Tiny5"';
export const PIXEL_FONT_ZH_HANS_LOAD = '16px "Fusion Pixel ZH"';
export const PIXEL_FONT_LOADS = [PIXEL_FONT_LOAD, PIXEL_FONT_ZH_HANS_LOAD] as const;
export const PIXEL_FONT_SIZE_STEP = 6;
export const ZH_HANS_FONT_SIZE_ADJUSTMENT = -2;

type FontLoader = {
  load: (font: string) => Promise<unknown>;
  ready: Promise<unknown>;
  add?: (font: FontFace) => void;
};

let zhHansFontRegistration: Promise<void> | null = null;

export function pixelFontSize(size: number | `${number}px`, locale: Locale = "en") {
  const baseSize =
    typeof size === "number" ? size : Number.parseInt(size.replace("px", ""), 10);
  const localeAdjustment = locale === "zhHans" ? ZH_HANS_FONT_SIZE_ADJUSTMENT : 0;
  return `${baseSize + PIXEL_FONT_SIZE_STEP + localeAdjustment}px`;
}

export function getPixelFontFamily(locale: Locale) {
  return locale === "zhHans" ? PIXEL_FONT_FAMILY_ZH_HANS : PIXEL_FONT_FAMILY;
}

export function getPixelFontStyle(locale: Locale) {
  return locale === "zhHans" ? "normal" : "bold";
}

export async function waitForPixelFontReady(fonts?: FontLoader | null) {
  if (!fonts) {
    return;
  }

  await registerZhHansFont(fonts);
  await Promise.all(PIXEL_FONT_LOADS.map((font) => fonts.load(font)));
  await fonts.ready;
}

async function registerZhHansFont(fonts: FontLoader) {
  if (typeof FontFace === "undefined" || zhHansFontRegistration) {
    return zhHansFontRegistration ?? Promise.resolve();
  }

  zhHansFontRegistration = (async () => {
    const baseUrl = import.meta.env.BASE_URL ?? "./";
    const fontUrl = `${baseUrl}fonts/fusion-pixel/fusion-pixel-12px-proportional-zh_hans.otf.woff2`;
    const font = new FontFace("Fusion Pixel ZH", `url(${fontUrl})`, {
      style: "normal",
      weight: "400"
    });
    await font.load();
    fonts.add?.(font);
  })();

  return zhHansFontRegistration;
}

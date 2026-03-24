import { describe, expect, it, vi } from "vitest";

import {
  PIXEL_FONT_FAMILY,
  PIXEL_FONT_FAMILY_ZH_HANS,
  PIXEL_FONT_LOAD,
  PIXEL_FONT_LOADS,
  PIXEL_FONT_ZH_HANS_LOAD,
  getPixelFontFamily,
  getPixelFontStyle,
  PIXEL_FONT_SIZE_STEP,
  pixelFontSize,
  ZH_HANS_FONT_SIZE_ADJUSTMENT,
  waitForPixelFontReady
} from "../src/ui/typography";

describe("typography", () => {
  it("uses Tiny5 first with retro/pixel fallbacks", () => {
    expect(PIXEL_FONT_FAMILY).toContain("Tiny5");
    expect(PIXEL_FONT_FAMILY).toContain("Jersey 10");
    expect(PIXEL_FONT_FAMILY).toContain("Silkscreen");
    expect(PIXEL_FONT_FAMILY).toContain("Pixelify Sans");
    expect(PIXEL_FONT_FAMILY).toContain("Courier New");
    expect(PIXEL_FONT_FAMILY).toContain("monospace");
  });

  it("switches to Fusion Pixel for Simplified Chinese copy", () => {
    expect(PIXEL_FONT_FAMILY_ZH_HANS).toContain("Fusion Pixel ZH");
    expect(getPixelFontFamily("en")).toBe(PIXEL_FONT_FAMILY);
    expect(getPixelFontFamily("zhHans")).toBe(PIXEL_FONT_FAMILY_ZH_HANS);
  });

  it("bumps pixel font sizes one level globally", () => {
    expect(PIXEL_FONT_SIZE_STEP).toBe(6);
    expect(pixelFontSize(14)).toBe("20px");
    expect(pixelFontSize("20px")).toBe("26px");
    expect(ZH_HANS_FONT_SIZE_ADJUSTMENT).toBe(-2);
    expect(pixelFontSize(14, "zhHans")).toBe("18px");
    expect(getPixelFontStyle("en")).toBe("bold");
    expect(getPixelFontStyle("zhHans")).toBe("normal");
  });

  it("waits for the readable pixel font before booting the game", async () => {
    const load = vi.fn().mockResolvedValue(undefined);
    const ready = Promise.resolve();

    await waitForPixelFontReady({ load, ready });

    expect(PIXEL_FONT_LOADS).toEqual([PIXEL_FONT_LOAD, PIXEL_FONT_ZH_HANS_LOAD]);
    expect(load).toHaveBeenCalledWith(PIXEL_FONT_LOAD);
    expect(load).toHaveBeenCalledWith(PIXEL_FONT_ZH_HANS_LOAD);
  });

  it("does nothing when the browser font loader is unavailable", async () => {
    await expect(waitForPixelFontReady(null)).resolves.toBeUndefined();
  });
});

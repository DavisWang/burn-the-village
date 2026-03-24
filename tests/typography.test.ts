import { describe, expect, it, vi } from "vitest";

import {
  PIXEL_FONT_FAMILY,
  PIXEL_FONT_LOAD,
  PIXEL_FONT_SIZE_STEP,
  pixelFontSize,
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

  it("bumps pixel font sizes one level globally", () => {
    expect(PIXEL_FONT_SIZE_STEP).toBe(6);
    expect(pixelFontSize(14)).toBe("20px");
    expect(pixelFontSize("20px")).toBe("26px");
  });

  it("waits for the readable pixel font before booting the game", async () => {
    const load = vi.fn().mockResolvedValue(undefined);
    const ready = Promise.resolve();

    await waitForPixelFontReady({ load, ready });

    expect(load).toHaveBeenCalledWith(PIXEL_FONT_LOAD);
  });

  it("does nothing when the browser font loader is unavailable", async () => {
    await expect(waitForPixelFontReady(null)).resolves.toBeUndefined();
  });
});

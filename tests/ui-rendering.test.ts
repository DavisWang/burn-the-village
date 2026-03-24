import { describe, expect, it } from "vitest";

import { getGrassTextureFrame, getStructureTextureFrame } from "../src/ui/board-textures";
import { getPixelButtonLayerOrder, getPixelButtonSelectionOutlineMetrics } from "../src/ui/pixel-button-order";
import { getRankDisplay } from "../src/ui/rank-display";

describe("board textures", () => {
  it("uses more than a two-tone checkerboard for grass frames", () => {
    const colors = new Set<number>();
    for (let y = 0; y < 3; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        colors.add(getGrassTextureFrame({ x, y }).baseColor);
      }
    }

    expect(colors.size).toBeGreaterThan(2);
  });

  it("provides roof and wall detail data for each structure type", () => {
    const hut = getStructureTextureFrame("hut", { x: 1, y: 1 });
    const house = getStructureTextureFrame("house", { x: 1, y: 1 });
    const hall = getStructureTextureFrame("hall", { x: 1, y: 1 });

    expect(hut.roofColor).not.toBe(hut.wallColor);
    expect(house.roofShadeColor).not.toBe(house.roofColor);
    expect(hall.ridgeColor).not.toBe(hall.roofColor);
  });
});

describe("rank display", () => {
  it("maps ranks to title-cased labels and medal colors", () => {
    expect(getRankDisplay("bronze")).toEqual({ label: "Bronze", color: "#c58f52" });
    expect(getRankDisplay("silver")).toEqual({ label: "Silver", color: "#d8d1c4" });
    expect(getRankDisplay("gold")).toEqual({ label: "Gold", color: "#f4d35e" });
  });
});

describe("pixel button layering", () => {
  it("renders the selected outline above the panel fill", () => {
    const order = getPixelButtonLayerOrder();

    expect(order.indexOf("selectionOutline")).toBeGreaterThan(order.indexOf("panel"));
    expect(order.indexOf("selectionOutline")).toBeGreaterThan(order.indexOf("highlight"));
  });

  it("uses a thicker near-edge outline so selected buttons stay visible", () => {
    const outline = getPixelButtonSelectionOutlineMetrics();

    expect(outline.inset).toBeLessThanOrEqual(2);
    expect(outline.strokeWidth).toBeGreaterThanOrEqual(3);
  });
});

import { describe, expect, it } from "vitest";

import { CELL_SIZE, MAP_ORIGIN } from "../src/game/constants";
import { HOW_TO_PLAY_PREVIEW_FEATURE_BOUNDS, createHowToPlayPreviewState } from "../src/game/how-to-play-preview";
import { getHowToPlayLayout } from "../src/ui/layout";

describe("how to play preview", () => {
  it("includes every mechanic shown on the reference screen", () => {
    const state = createHowToPlayPreviewState();
    const materials = new Set<string>();
    const terrains = new Set<string>();
    const structures = new Set<string>();

    for (const row of state.grid) {
      for (const cell of row) {
        if (cell.material !== "empty") {
          materials.add(cell.material);
        }
        if (cell.terrain !== "ground") {
          terrains.add(cell.terrain);
        }
        if (cell.structureType) {
          structures.add(cell.structureType);
        }
      }
    }

    expect(materials).toEqual(new Set(["fireSource", "hay", "tnt", "structure"]));
    expect(terrains).toEqual(new Set(["deepWater", "wetTerrain", "wall"]));
    expect(structures).toEqual(new Set(["hut", "house", "hall"]));
  });

  it("keeps label anchors outside the feature they describe", () => {
    const layout = getHowToPlayLayout();

    layout.mapLabels.forEach((label) => {
      const bounds = HOW_TO_PLAY_PREVIEW_FEATURE_BOUNDS[label.key as keyof typeof HOW_TO_PLAY_PREVIEW_FEATURE_BOUNDS];
      const cellX = (label.x - MAP_ORIGIN.x) / CELL_SIZE;
      const cellY = (label.y - MAP_ORIGIN.y) / CELL_SIZE;
      const insideX = cellX >= bounds.x && cellX < bounds.x + bounds.width;
      const insideY = cellY >= bounds.y && cellY < bounds.y + bounds.height;

      expect(insideX && insideY).toBe(false);
    });
  });

  it("keeps each label closest to its own feature center", () => {
    const layout = getHowToPlayLayout();

    layout.mapLabels.forEach((label) => {
      const labelX = (label.x - MAP_ORIGIN.x) / CELL_SIZE;
      const labelY = (label.y - MAP_ORIGIN.y) / CELL_SIZE;
      const distances = Object.entries(HOW_TO_PLAY_PREVIEW_FEATURE_BOUNDS).map(([key, bounds]) => {
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const dx = labelX - centerX;
        const dy = labelY - centerY;

        return {
          key,
          distanceSq: dx * dx + dy * dy
        };
      }).sort((left, right) => left.distanceSq - right.distanceSq);

      expect(distances[0]?.key).toBe(label.key);
    });
  });
});

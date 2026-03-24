import { describe, expect, it } from "vitest";

import {
  HUD_HEIGHT,
  HUD_ORIGIN,
  MAP_SIZE,
  SIDEBAR_ORIGIN,
  SIDEBAR_WIDTH
} from "../src/game/constants";
import { createSimulation } from "../src/game/simulation";
import type { LevelDefinition } from "../src/game/types";
import { getEditorBottomStats, getGameBottomStats, getGameSidebarLines } from "../src/ui/hud-content";
import { getLevelCardStatsStyle, getLevelCardStatsText } from "../src/ui/level-select-content";
import {
  getEditorBottomControlLayout,
  clampLevelSelectScroll,
  getEditorBottomActionLayout,
  getEditorHudStatSlots,
  getEditorSidebarLayout,
  getGameHudStatSlots,
  getGameProgressMarkers,
  getGameSidebarLayout,
  getGameSummaryLayout,
  getLevelSelectGridLayout,
  getMenuPanelLayout,
  getLevelSelectSidebarLayout
} from "../src/ui/layout";

function makeLevel(overrides: Partial<LevelDefinition> = {}): LevelDefinition {
  return {
    id: "layout-test",
    name: "LAYOUT TEST",
    gridSize: 32,
    resourceBudget: { hayCells: 4, tntCount: 2 },
    completionPct: 0.5,
    fireSources: [{ x: 0, y: 0 }],
    structures: [
      {
        id: "hut-1",
        type: "hut",
        origin: { x: 12, y: 12 },
        size: { x: 1, y: 1 },
        maxHp: 1
      }
    ],
    ...overrides
  };
}

describe("editor layout", () => {
  it("centers sidebar content inside the sidebar frame", () => {
    const layout = getEditorSidebarLayout();
    const leftMargin = layout.contentX - SIDEBAR_ORIGIN.x;
    const rightMargin = SIDEBAR_ORIGIN.x + SIDEBAR_WIDTH - (layout.contentX + layout.contentWidth);

    expect(leftMargin).toBe(rightMargin);
  });

  it("keeps the editor bottom action cluster inside the HUD right section", () => {
    const layout = getEditorBottomActionLayout();

    expect(layout.contentX + layout.contentWidth).toBeLessThanOrEqual(SIDEBAR_ORIGIN.x + SIDEBAR_WIDTH);
    expect(layout.menuY + layout.menuHeight).toBeLessThanOrEqual(HUD_ORIGIN.y + HUD_HEIGHT);
  });

  it("keeps the editor goal controls and stats left of the action cluster", () => {
    const controls = getEditorBottomControlLayout();
    const actions = getEditorBottomActionLayout();
    const statSlots = getEditorHudStatSlots();
    const rightMostStat = Math.max(...statSlots.map((slot) => slot.valueX + slot.width));
    const goalRightEdge = controls.goalStepperX + controls.goalStepperWidth * 2 + controls.goalStepperGap;

    expect(goalRightEdge).toBeLessThan(actions.contentX);
    expect(rightMostStat).toBeLessThan(actions.contentX);
  });

  it("defines HUD stat slots for read-only editor stats", () => {
    const slots = getEditorHudStatSlots();

    expect(slots.map((slot) => slot.key)).toEqual(["fires", "structures", "shape"]);
    expect(slots.every((slot) => slot.labelX >= HUD_ORIGIN.x)).toBe(true);
  });
});

describe("game HUD content", () => {
  it("keeps goal, destroyed, score, and medal in the bottom HUD stats", () => {
    const state = createSimulation(makeLevel(), 7);
    state.destroyedStructureCells = 1;
    state.totalStructureCells = 1;
    state.destructionPct = 1;
    state.score = 880;
    state.medal = "gold";

    const stats = getGameBottomStats(makeLevel(), state);

    expect(stats.map((item) => item.key)).toEqual(["goal", "destroyed", "score", "medal", "hay", "tnt"]);
    expect(stats.map((item) => item.value)).toEqual(["50%", "100%", "880", "GOLD", "4", "2"]);
  });

  it("removes read-only run copy from the gameplay sidebar", () => {
    const lines = getGameSidebarLines(createSimulation(makeLevel(), 9)).join(" ");

    expect(lines).toBe("");
    expect(lines).not.toContain("GOAL");
    expect(lines).not.toContain("DESTROYED");
    expect(lines).not.toContain("SCORE");
    expect(lines).not.toContain("MEDAL");
    expect(lines).not.toContain("ACTIVE RUN");
    expect(lines).not.toContain("LAY HAY");
  });

  it("keeps gameplay HUD stat slots inside the bottom bar", () => {
    const slots = getGameHudStatSlots();
    const lastSlot = slots[slots.length - 1];
    const haySlot = slots.find((slot) => slot.key === "hay");

    expect(lastSlot.valueX + lastSlot.width).toBeLessThanOrEqual(SIDEBAR_ORIGIN.x);
    expect(haySlot?.labelY).toBeGreaterThan(HUD_ORIGIN.y + 98);
  });

  it("provides explicit progress markers for pass and medal thresholds", () => {
    const markers = getGameProgressMarkers(HUD_ORIGIN.x + 22, 676, 0.7);

    expect(markers.map((marker) => marker.key)).toEqual(["pass", "bronze", "silver", "gold"]);
    expect(markers[0]?.label).toBe("PASS");
    expect(markers[3]?.x).toBeLessThanOrEqual(HUD_ORIGIN.x + 22 + 676);
  });

  it("centers gameplay sidebar control rows inside the sidebar frame", () => {
    const layout = getGameSidebarLayout();
    const leftMargin = layout.contentX - SIDEBAR_ORIGIN.x;
    const rightMargin = SIDEBAR_ORIGIN.x + SIDEBAR_WIDTH - (layout.contentX + layout.contentWidth);
    const brushRowWidth = layout.brushButtonWidth * 3 + layout.brushGap * 2;
    const brushLeftMargin = layout.brushRowX - SIDEBAR_ORIGIN.x;
    const brushRightMargin = SIDEBAR_ORIGIN.x + SIDEBAR_WIDTH - (layout.brushRowX + brushRowWidth);

    expect(leftMargin).toBe(rightMargin);
    expect(brushLeftMargin).toBe(brushRightMargin);
    expect(layout.actionBottomY + layout.actionHeight).toBeLessThanOrEqual(SIDEBAR_ORIGIN.y + MAP_SIZE);
  });

  it("keeps the summary button stack inside the summary dialog", () => {
    const layout = getGameSummaryLayout();

    expect(layout.buttonX).toBeGreaterThanOrEqual(layout.dialogX);
    expect(layout.buttonX + layout.buttonWidth).toBeLessThanOrEqual(layout.dialogX + layout.dialogWidth);
    expect(layout.thirdButtonY + layout.buttonHeight).toBeLessThanOrEqual(layout.dialogY + layout.dialogHeight);
  });
});

describe("editor HUD content", () => {
  it("moves read-only editor status into bottom stats", () => {
    const stats = getEditorBottomStats(makeLevel());

    expect(stats.map((item) => item.key)).toEqual(["fires", "structures", "shape"]);
    expect(stats.find((item) => item.key === "shape")?.value).toBe("VALID");
  });
});

describe("level select layout", () => {
  it("uses a full-height clamped scroll viewport for the level grid", () => {
    const layout = getLevelSelectGridLayout(14);

    expect(layout.maxScroll).toBeGreaterThan(0);
    expect(clampLevelSelectScroll(14, -40)).toBe(0);
    expect(clampLevelSelectScroll(14, layout.maxScroll + 40)).toBe(layout.maxScroll);
  });

  it("uses larger stat typography for level tiles", () => {
    const style = getLevelCardStatsStyle();

    expect(style.fontSize).toBe("15px");
    expect(style.lineSpacing).toBe(4);
  });

  it("uses only goal, hay, and tnt in the level tile stats block", () => {
    const stats = getLevelCardStatsText({
      level: makeLevel({ completionPct: 0.7, resourceBudget: { hayCells: 9, tntCount: 2 } }),
      source: "built-in"
    });

    expect(stats).toBe(["GOAL 70%", "HAY 9", "TNT 2"].join("\n"));
    expect(stats).not.toContain("BUILT-IN");
    expect(stats).not.toContain("CUSTOM");
  });

  it("centers level select sidebar content within the sidebar frame", () => {
    const layout = getLevelSelectSidebarLayout();
    const leftMargin = layout.contentX - SIDEBAR_ORIGIN.x;
    const rightMargin = SIDEBAR_ORIGIN.x + SIDEBAR_WIDTH - (layout.contentX + layout.contentWidth);

    expect(leftMargin).toBe(rightMargin);
    expect(layout.contentX + layout.contentWidth).toBeLessThanOrEqual(SIDEBAR_ORIGIN.x + SIDEBAR_WIDTH);
  });
});

describe("menu layout", () => {
  it("uses a full-panel menu layout without sidebar or hud sections", () => {
    const layout = getMenuPanelLayout();

    expect(layout.hasSidebarFrame).toBe(false);
    expect(layout.hasHudFrame).toBe(false);
    expect(layout.contentWidth).toBeGreaterThan(MAP_SIZE);
    expect(layout.buttonX + layout.buttonWidth / 2).toBe(layout.titleCenterX);
  });
});

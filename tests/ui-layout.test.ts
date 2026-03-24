import { describe, expect, it } from "vitest";

import {
  HUD_HEIGHT,
  HUD_ORIGIN,
  MAP_SIZE,
  SIDEBAR_ORIGIN,
  SIDEBAR_WIDTH,
  CANVAS_CENTER_X
} from "../src/game/constants";
import { getDefaultGameplayControls } from "../src/game/gameplay-controls";
import { createSimulation } from "../src/game/simulation";
import type { LevelDefinition } from "../src/game/types";
import { getGameBottomStats, getGameSidebarLines } from "../src/ui/hud-content";
import { getLevelCardStatsText, getLevelSelectSidebarCopy } from "../src/ui/level-select-content";
import {
  getEditorBottomControlLayout,
  clampLevelSelectScroll,
  getEditorBottomActionLayout,
  getEditorOverlayDepths,
  getEditorOverlayLayout,
  getEditorSidebarLayout,
  getGameHudStatSlots,
  getGameProgressBarLayout,
  getGameProgressMarkers,
  getGameSidebarLayout,
  getGameSummaryDepths,
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
    terrainTiles: [],
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

  it("fits the editor tool grid within the sidebar content width", () => {
    const layout = getEditorSidebarLayout();
    const toolGridWidth = layout.toolButtonWidth * 2 + layout.toolGap;

    expect(toolGridWidth).toBeLessThanOrEqual(layout.contentWidth);
    expect(layout.toolButtonHeight).toBeLessThan(50);
  });

  it("keeps the editor bottom action cluster inside the HUD right section", () => {
    const layout = getEditorBottomActionLayout();

    expect(layout.contentX + layout.contentWidth).toBeLessThanOrEqual(SIDEBAR_ORIGIN.x + SIDEBAR_WIDTH);
    expect(layout.menuY + layout.menuHeight).toBeLessThanOrEqual(HUD_ORIGIN.y + HUD_HEIGHT);
  });

  it("keeps the editor goal controls and stats left of the action cluster", () => {
    const controls = getEditorBottomControlLayout();
    const actions = getEditorBottomActionLayout();
    const goalRightEdge = controls.goalStepperX + controls.goalStepperWidth * 2 + controls.goalStepperGap;

    expect(goalRightEdge).toBeLessThan(actions.contentX);
    expect(controls.goalValueX).toBeLessThan(controls.goalStepperX);
  });

  it("pads editor budget field text away from the top-left edge", () => {
    const controls = getEditorBottomControlLayout();

    expect(controls.budgetButtonWidth).toBeLessThanOrEqual(controls.groupWidth);
    expect(controls.budgetTextOffsetX).toBeGreaterThan(0);
    expect(controls.budgetTextOffsetY).toBeGreaterThan(0);
    expect(Number.parseInt(controls.budgetFontSize, 10)).toBeLessThanOrEqual(18);
    expect(controls.groupControlY - controls.groupLabelY).toBeGreaterThanOrEqual(30);
  });

  it("sizes the editor overlay dialog so budget copy fits inside the popup", () => {
    const overlay = getEditorOverlayLayout();

    expect(overlay.inputDialogHeight).toBeGreaterThanOrEqual(180);
    expect(overlay.inputWrapWidth).toBeLessThan(overlay.inputDialogWidth);
    expect(overlay.inputTextY).toBeGreaterThan(overlay.inputDialogY + 24);
  });

  it("draws editor overlays above the rest of the editor UI", () => {
    const depths = getEditorOverlayDepths();

    expect(depths.overlay).toBeGreaterThan(0);
    expect(depths.text).toBeGreaterThan(depths.overlay);
  });
});

describe("game HUD content", () => {
  it("defaults gameplay controls to hay and the medium brush for each fresh run", () => {
    const controls = getDefaultGameplayControls();

    expect(controls.tool).toBe("hay");
    expect(controls.brushIndex).toBe(1);
    expect(controls.hoverCells).toEqual([]);
    expect(controls.accumulator).toBe(0);
  });

  it("keeps goal, destroyed, score, and medal in the bottom HUD stats", () => {
    const state = createSimulation(makeLevel(), 7);
    state.destroyedStructureCells = 1;
    state.totalStructureCells = 1;
    state.destructionPct = 1;
    state.score = 880;
    state.medal = "gold";

    const stats = getGameBottomStats(makeLevel(), state);

    expect(stats.map((item) => item.key)).toEqual(["goal", "destroyed", "score", "medal", "hay", "tnt"]);
    expect(stats.map((item) => item.label)).toEqual(["GOAL", "DESTROYED", "SCORE", "RANK", "HAY", "TNT"]);
    expect(stats.map((item) => item.value)).toEqual(["50%", "100%", "880", "GOLD", "4", "2"]);
    expect(stats.find((item) => item.key === "medal")?.color).toBe("#f4d35e");
  });

  it("hides the medal slot copy when no medal is earned", () => {
    const stats = getGameBottomStats(makeLevel(), createSimulation(makeLevel(), 3));
    const medal = stats.find((item) => item.key === "medal");

    expect(medal?.label).toBe("");
    expect(medal?.value).toBe("");
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

  it("keeps the gameplay sidebar empty even when terrain is present", () => {
    const lines = getGameSidebarLines(
      createSimulation(
        makeLevel({
          terrainTiles: [
            { x: 1, y: 1, type: "deepWater" },
            { x: 2, y: 1, type: "wetTerrain" },
            { x: 3, y: 1, type: "wall" }
          ]
        }),
        10
      )
    );

    expect(lines).toEqual([]);
  });

  it("keeps gameplay HUD stat slots inside the bottom bar", () => {
    const slots = getGameHudStatSlots();
    const lastSlot = slots[slots.length - 1];
    const haySlot = slots.find((slot) => slot.key === "hay");
    const destroyedSlot = slots.find((slot) => slot.key === "destroyed");
    const scoreSlot = slots.find((slot) => slot.key === "score");

    expect(lastSlot.valueX + lastSlot.width).toBeLessThanOrEqual(SIDEBAR_ORIGIN.x);
    expect(haySlot?.labelY).toBeGreaterThan(HUD_ORIGIN.y + 98);
    expect(scoreSlot?.labelX).toBeGreaterThan((destroyedSlot?.labelX ?? 0) + (destroyedSlot?.width ?? 0) + 12);
  });

  it("provides pass and medal threshold markers", () => {
    const markers = getGameProgressMarkers(HUD_ORIGIN.x + 22, 676, 0.7);

    expect(markers.map((marker) => marker.key)).toEqual(["pass", "bronze", "silver", "gold"]);
    expect(markers[0]?.color).toBe("#68bfd6");
    expect(markers[0]?.color).not.toBe(markers[3]?.color);
    expect(markers[3]?.x).toBeLessThanOrEqual(HUD_ORIGIN.x + 22 + 676);
  });

  it("centers the progress label inside the destruction meter", () => {
    const meter = getGameProgressBarLayout();

    expect(meter.centerX).toBe(meter.x + meter.width / 2);
    expect(meter.centerY).toBe(meter.y + meter.height / 2);
    expect(meter.labelY).toBeLessThan(meter.centerY);
    expect(meter.labelY).toBeGreaterThan(meter.y + meter.height / 3);
    expect(meter.width).toBeGreaterThan(300);
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
    expect(layout.speedLabelMaxWidth).toBeGreaterThan(40);
  });

  it("keeps the summary button stack inside the summary dialog", () => {
    const layout = getGameSummaryLayout();

    expect(layout.buttonX).toBeGreaterThanOrEqual(layout.dialogX);
    expect(layout.buttonX + layout.buttonWidth).toBeLessThanOrEqual(layout.dialogX + layout.dialogWidth);
    expect(layout.thirdButtonY + layout.buttonHeight).toBeLessThanOrEqual(layout.dialogY + layout.dialogHeight);
    expect(layout.summaryContentBottomY).toBeLessThan(layout.firstButtonY);
  });

  it("draws the summary overlay above regular gameplay controls", () => {
    const depths = getGameSummaryDepths();

    expect(depths.overlay).toBeGreaterThan(0);
    expect(depths.text).toBeGreaterThan(depths.overlay);
    expect(depths.buttons).toBeGreaterThan(depths.text);
  });
});

describe("level select layout", () => {
  it("uses a full-height clamped scroll viewport for the level grid", () => {
    const layout = getLevelSelectGridLayout(14);

    expect(layout.maxScroll).toBeGreaterThan(0);
    expect(clampLevelSelectScroll(14, -40)).toBe(0);
    expect(clampLevelSelectScroll(14, layout.maxScroll + 40)).toBe(layout.maxScroll);
  });

  it("removes stat copy from the level tile body", () => {
    const stats = getLevelCardStatsText({
      level: makeLevel({ completionPct: 0.7, resourceBudget: { hayCells: 9, tntCount: 2 } }),
      source: "built-in"
    });

    expect(stats).toBe("");
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

  it("uses the shortened sidebar copy under playable levels", () => {
    expect(getLevelSelectSidebarCopy()).toBe("Pick a level or import from a json file.");
  });
});

describe("menu layout", () => {
  it("uses a full-panel menu layout without sidebar or hud sections", () => {
    const layout = getMenuPanelLayout();

    expect(layout.hasSidebarFrame).toBe(false);
    expect(layout.hasHudFrame).toBe(false);
    expect(layout.contentWidth).toBeGreaterThan(MAP_SIZE);
    expect(layout.buttonX + layout.buttonWidth / 2).toBe(layout.titleCenterX);
    expect(layout.footnoteX).toBe(CANVAS_CENTER_X);
  });
});

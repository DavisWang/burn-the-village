import { afterEach, describe, expect, it } from "vitest";

import { parseLevelFile, validateLevel } from "../src/game/level-io";
import type { LevelDefinition } from "../src/game/types";
import {
  buildBudgetEntryText,
  buildNameEntryText,
  getDisplayLevelName,
  getLocale,
  getSpeedLabel,
  getTranslations,
  setLocale,
  toggleLocale
} from "../src/i18n";
import { getGameBottomStats } from "../src/ui/hud-content";
import { createSimulation } from "../src/game/simulation";

function makeLevel(overrides: Partial<LevelDefinition> = {}): LevelDefinition {
  return {
    id: "ember-path",
    name: "EMBER PATH",
    gridSize: 32,
    resourceBudget: { hayCells: 4, tntCount: 2 },
    completionPct: 0.55,
    fireSources: [{ x: 0, y: 0 }],
    structures: [
      {
        id: "hut-1",
        type: "hut",
        origin: { x: 2, y: 2 },
        size: { x: 1, y: 1 },
        maxHp: 1
      }
    ],
    terrainTiles: [],
    ...overrides
  };
}

afterEach(() => {
  setLocale("en");
});

describe("i18n runtime", () => {
  it("defaults to English and toggles between English and Simplified Chinese", () => {
    expect(getLocale()).toBe("en");
    expect(toggleLocale()).toBe("zhHans");
    expect(getLocale()).toBe("zhHans");
    expect(toggleLocale()).toBe("en");
  });

  it("keeps locale state in module runtime until explicitly changed", () => {
    setLocale("zhHans");

    expect(getLocale()).toBe("zhHans");
    expect(getTranslations(getLocale()).menu.levelSelect).toBe("关卡选择");
  });
});

describe("localized helpers", () => {
  it("translates built-in level names while leaving authored data intact", () => {
    const builtIn = makeLevel();
    const custom = makeLevel({ id: "my-custom", name: "My Custom Level" });

    expect(getDisplayLevelName(builtIn, "en")).toBe("EMBER PATH");
    expect(getDisplayLevelName(builtIn, "zhHans")).toBe("余烬小径");
    expect(getDisplayLevelName(custom, "zhHans")).toBe("My Custom Level");
  });

  it("produces localized gameplay HUD labels and speed labels", () => {
    const level = makeLevel();
    const state = createSimulation(level, 3);
    state.destroyedStructureCells = 1;
    state.totalStructureCells = 1;
    state.destructionPct = 1;
    state.score = 990;
    state.medal = "gold";

    const stats = getGameBottomStats(level, state, "zhHans");

    expect(stats.map((item) => item.label)).toEqual(["目标", "焚毁", "得分", "评级", "干草", "TNT"]);
    expect(stats.map((item) => item.value)).toEqual(["55%", "100%", "990", "金", "4", "2"]);
    expect(getSpeedLabel(2, "zhHans")).toBe("标准");
  });

  it("builds localized overlay copy for naming and budget entry", () => {
    expect(buildNameEntryText("zhHans", "村庄")).toContain("关卡名称");
    expect(buildNameEntryText("zhHans", "")).toContain("(空)");
    expect(buildBudgetEntryText("zhHans", "干草", "12")).toContain("预算");
    expect(buildBudgetEntryText("zhHans", "干草", "")).toContain("(空)");
  });
});

describe("localized level file errors", () => {
  it("returns localized validation errors", () => {
    const errors = validateLevel(
      makeLevel({
        resourceBudget: { hayCells: 1_000, tntCount: 2 }
      }),
      "zhHans"
    );

    expect(errors[0]).toContain("资源预算");
    expect(errors[0]).toContain("999");
  });

  it("returns localized parse errors for malformed files", () => {
    expect(() => parseLevelFile("{bad json", "zhHans")).toThrow("关卡文件格式不正确。");
  });
});

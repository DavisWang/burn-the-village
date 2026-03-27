import type { LevelDefinition, Medal, TerrainType } from "../game/types";
import {
  GENERATED_CAMPAIGN_NAME_MAP_EN,
  GENERATED_CAMPAIGN_NAME_MAP_ZH_HANS
} from "../game/generated-campaign";

export type Locale = "en" | "zhHans";

type TranslationCatalog = {
  common: {
    menu: string;
    back: string;
    editor: string;
    levels: string;
    import: string;
    export: string;
    playTest: string;
    rename: string;
    replay: string;
    retry: string;
    tryAgain: string;
    nextLevel: string;
    importCancelled: string;
    importFailed: string;
  };
  menu: {
    titleTop: string;
    titleBottom: string;
    tagline: string;
    levelSelect: string;
    howToPlay: string;
    levelEditor: string;
    byline: string;
  };
  howToPlay: {
    heading: string;
    intro: string;
    objectiveTitle: string;
    objectiveCopy: string;
    toolsTitle: string;
    toolsCopy: string;
    terrainTitle: string;
    terrainCopy: string;
    structuresTitle: string;
    structuresCopy: string;
    controlsTitle: string;
    controlsCopy: string;
    scoringTitle: string;
    scoringCopy: string;
    mapLabels: Record<
      "fireSource" | "hay" | "tnt" | "hut" | "house" | "hall" | "deepWater" | "wetTerrain" | "wall",
      string
    >;
  };
  levelSelect: {
    heading: string;
    sidebarTitle: string;
    sidebarCopy: string;
    importJson: string;
  };
  gameplay: {
    progress: string;
    goal: string;
    destroyed: string;
    score: string;
    rank: string;
    hay: string;
    tnt: string;
    brush: string;
    speed: string;
    reset: string;
    levelCleared: string;
    runFailed: string;
    destructionLine: (percent: string) => string;
    scoreLine: (score: number) => string;
    rankLine: (rank: string) => string;
  };
  editor: {
    heading: string;
    toolLabels: Record<
      "fire" | "hut" | "house" | "hall" | "deepWater" | "wetTerrain" | "wall" | "erase",
      string
    >;
    name: string;
    goal: string;
    defaultLevelName: string;
    nameEntryTitle: string;
    emptyPlaceholder: string;
    nameEntryHint: string;
    budgetEntryHint: string;
    hayBudget: string;
    tntBudget: string;
    invalidBudget: string;
    importedToEditor: string;
    exportedJson: string;
  };
  ranks: Record<Medal, string>;
  speedLabels: readonly string[];
  builtInLevelNames: Partial<Record<string, string>>;
  levelIO: {
    requiredLevelId: string;
    requiredLevelName: string;
    gridSizeMustBe: (size: number) => string;
    fireSourceRequired: string;
    structureRequired: string;
    completionThreshold: string;
    resourceBudgetNegative: string;
    resourceBudgetRange: (max: number) => string;
    overlapDetected: (key: string, first: string, second: string) => string;
    fireSourceOutOfBounds: (x: number, y: number) => string;
    terrainOutOfBounds: (x: number, y: number) => string;
    structureStartsOutOfBounds: (id: string) => string;
    structureExceedsGrid: (id: string) => string;
    unsupportedFile: string;
    malformedFile: string;
    invalidFireSourceCoordinates: string;
    invalidStructureDefinition: string;
    invalidTerrainTileDefinition: string;
    occupancyFireSource: string;
    occupancyTerrain: (type: TerrainType) => string;
    occupancyStructure: (id: string) => string;
  };
};

const TRANSLATIONS = {
  en: {
    common: {
      menu: "MENU",
      back: "BACK",
      editor: "EDITOR",
      levels: "LEVELS",
      import: "IMPORT",
      export: "EXPORT",
      playTest: "PLAY TEST",
      rename: "RENAME",
      replay: "REPLAY",
      retry: "RETRY",
      tryAgain: "TRY AGAIN",
      nextLevel: "NEXT LEVEL",
      importCancelled: "Import cancelled.",
      importFailed: "Import failed."
    },
    menu: {
      titleTop: "BURN THE",
      titleBottom: "VILLAGE",
      tagline: "LAY THE TRAIL. LIGHT THE FUSE.\nLEAVE NOTHING STANDING.",
      levelSelect: "LEVEL SELECT",
      howToPlay: "HOW TO PLAY",
      levelEditor: "LEVEL EDITOR",
      byline: "By Davis Wang"
    },
    howToPlay: {
      heading: "HOW TO PLAY",
      intro: "Burn buildings. Hit the goal.",
      objectiveTitle: "OBJECTIVE",
      objectiveCopy: "Reach the goal %.",
      toolsTitle: "TOOLS",
      toolsCopy: "Hay spreads fire. TNT opens gaps.",
      terrainTitle: "TERRAIN",
      terrainCopy: "Water blocks. Marsh weakens fire. Walls need TNT.",
      structuresTitle: "STRUCTURES",
      structuresCopy: "Hut < House < Hall.",
      controlsTitle: "CONTROLS",
      controlsCopy: "Drag hay. Click TNT. Reset to retry.",
      scoringTitle: "SCORING",
      scoringCopy: "More damage + less waste = better rank.",
      mapLabels: {
        fireSource: "FIRE",
        hay: "HAY",
        tnt: "TNT",
        hut: "HUT",
        house: "HOUSE",
        hall: "HALL",
        deepWater: "WATER",
        wetTerrain: "MARSH",
        wall: "WALL"
      }
    },
    levelSelect: {
      heading: "LEVEL SELECT",
      sidebarTitle: "PLAYABLE LEVELS",
      sidebarCopy: "Pick a level or import from a json file.",
      importJson: "IMPORT JSON"
    },
    gameplay: {
      progress: "Progress",
      goal: "GOAL",
      destroyed: "DESTROYED",
      score: "SCORE",
      rank: "RANK",
      hay: "HAY",
      tnt: "TNT",
      brush: "BRUSH",
      speed: "SPEED",
      reset: "RESET",
      levelCleared: "Level Cleared!",
      runFailed: "Run Failed!",
      destructionLine: (percent: string) => `Destruction: ${percent}`,
      scoreLine: (score: number) => `Score: ${score}`,
      rankLine: (rank: string) => `Rank: ${rank}`
    },
    editor: {
      heading: "LEVEL EDITOR",
      toolLabels: {
        fire: "FIRE",
        hut: "HUT",
        house: "HOUSE",
        hall: "HALL",
        deepWater: "WATER",
        wetTerrain: "MARSH",
        wall: "WALL",
        erase: "ERASE"
      },
      name: "NAME",
      goal: "GOAL",
      defaultLevelName: "Custom Level",
      nameEntryTitle: "LEVEL NAME",
      emptyPlaceholder: "(empty)",
      nameEntryHint: "Type to edit. Enter saves. Esc cancels.",
      budgetEntryHint: "Enter a whole number from 0 to 999.",
      hayBudget: "HAY",
      tntBudget: "TNT",
      invalidBudget: "Enter a whole number between 0 and 999.",
      importedToEditor: "Imported level into the editor.",
      exportedJson: "Exported level JSON."
    },
    ranks: {
      none: "None",
      bronze: "Bronze",
      silver: "Silver",
      gold: "Gold"
    },
    speedLabels: ["SLOWEST", "SLOW", "NORMAL", "FAST", "FASTEST"],
    builtInLevelNames: GENERATED_CAMPAIGN_NAME_MAP_EN,
    levelIO: {
      requiredLevelId: "Level id is required.",
      requiredLevelName: "Level name is required.",
      gridSizeMustBe: (size: number) => `Grid size must be ${size}.`,
      fireSourceRequired: "At least one fire source is required.",
      structureRequired: "At least one structure is required.",
      completionThreshold: "Completion threshold must be between 0 and 1.",
      resourceBudgetNegative: "Resource budgets cannot be negative.",
      resourceBudgetRange: (max: number) => `Resource budgets must be between 0 and ${max}.`,
      overlapDetected: (key: string, first: string, second: string) =>
        `Overlap detected at ${key} (${first} and ${second}).`,
      fireSourceOutOfBounds: (x: number, y: number) => `Fire source at ${x},${y} is out of bounds.`,
      terrainOutOfBounds: (x: number, y: number) => `Terrain tile at ${x},${y} is out of bounds.`,
      structureStartsOutOfBounds: (id: string) => `Structure ${id} starts out of bounds.`,
      structureExceedsGrid: (id: string) => `Structure ${id} exceeds the grid bounds.`,
      unsupportedFile: "File is not a supported Burn the Village level.",
      malformedFile: "Level file is malformed.",
      invalidFireSourceCoordinates: "Invalid fire source coordinates.",
      invalidStructureDefinition: "Invalid structure definition.",
      invalidTerrainTileDefinition: "Invalid terrain tile definition.",
      occupancyFireSource: "fire source",
      occupancyTerrain: (type: TerrainType) => `terrain:${type}`,
      occupancyStructure: (id: string) => `structure:${id}`
    }
  },
  zhHans: {
    common: {
      menu: "菜单",
      back: "返回",
      editor: "编辑器",
      levels: "关卡",
      import: "导入",
      export: "导出",
      playTest: "试玩",
      rename: "改名",
      replay: "重玩",
      retry: "重试",
      tryAgain: "再试一次",
      nextLevel: "下一关",
      importCancelled: "已取消导入。",
      importFailed: "导入失败。"
    },
    menu: {
      titleTop: "焚毁",
      titleBottom: "村庄",
      tagline: "铺好引线，点燃导火索。\n让一切化为灰烬。",
      levelSelect: "关卡选择",
      howToPlay: "玩法说明",
      levelEditor: "关卡编辑器",
      byline: "Davis Wang 制作"
    },
    howToPlay: {
      heading: "玩法说明",
      intro: "烧掉建筑，打到目标线。",
      objectiveTitle: "目标",
      objectiveCopy: "把焚毁率推到过关线。",
      toolsTitle: "工具",
      toolsCopy: "干草传火。TNT 炸开缺口。",
      terrainTitle: "地形",
      terrainCopy: "深水阻挡，湿地减弱火势，墙要用 TNT。",
      structuresTitle: "建筑",
      structuresCopy: "小屋 < 民居 < 大厅。",
      controlsTitle: "操作",
      controlsCopy: "拖动铺干草。单击放 TNT。重置可重来。",
      scoringTitle: "计分",
      scoringCopy: "烧得越多、浪费越少，评级越高。",
      mapLabels: {
        fireSource: "火",
        hay: "干草",
        tnt: "TNT",
        hut: "小屋",
        house: "民居",
        hall: "大厅",
        deepWater: "深水",
        wetTerrain: "湿地",
        wall: "墙"
      }
    },
    levelSelect: {
      heading: "关卡选择",
      sidebarTitle: "可玩关卡",
      sidebarCopy: "选择一个关卡，或导入 JSON 文件。",
      importJson: "导入 JSON"
    },
    gameplay: {
      progress: "进度",
      goal: "目标",
      destroyed: "焚毁",
      score: "得分",
      rank: "评级",
      hay: "干草",
      tnt: "TNT",
      brush: "笔刷",
      speed: "速度",
      reset: "重置",
      levelCleared: "关卡完成！",
      runFailed: "行动失败！",
      destructionLine: (percent: string) => `焚毁率：${percent}`,
      scoreLine: (score: number) => `得分：${score}`,
      rankLine: (rank: string) => `评级：${rank}`
    },
    editor: {
      heading: "关卡编辑器",
      toolLabels: {
        fire: "火源",
        hut: "小屋",
        house: "民居",
        hall: "大厅",
        deepWater: "深水",
        wetTerrain: "湿地",
        wall: "墙",
        erase: "清除"
      },
      name: "名称",
      goal: "目标",
      defaultLevelName: "自定义关卡",
      nameEntryTitle: "关卡名称",
      emptyPlaceholder: "(空)",
      nameEntryHint: "输入以编辑。回车保存，Esc 取消。",
      budgetEntryHint: "输入 0 到 999 的整数。",
      hayBudget: "干草",
      tntBudget: "TNT",
      invalidBudget: "请输入 0 到 999 的整数。",
      importedToEditor: "已将关卡导入编辑器。",
      exportedJson: "已导出关卡 JSON。"
    },
    ranks: {
      none: "无",
      bronze: "铜",
      silver: "银",
      gold: "金"
    },
    speedLabels: ["最慢", "慢速", "标准", "快速", "最快"],
    builtInLevelNames: GENERATED_CAMPAIGN_NAME_MAP_ZH_HANS,
    levelIO: {
      requiredLevelId: "关卡 ID 不能为空。",
      requiredLevelName: "关卡名称不能为空。",
      gridSizeMustBe: (size: number) => `网格尺寸必须为 ${size}。`,
      fireSourceRequired: "至少需要一个火源。",
      structureRequired: "至少需要一个建筑。",
      completionThreshold: "完成目标必须介于 0 和 1 之间。",
      resourceBudgetNegative: "资源预算不能为负数。",
      resourceBudgetRange: (max: number) => `资源预算必须介于 0 和 ${max} 之间。`,
      overlapDetected: (key: string, first: string, second: string) =>
        `检测到 ${key} 位置重叠（${first} 与 ${second}）。`,
      fireSourceOutOfBounds: (x: number, y: number) => `火源 ${x},${y} 超出边界。`,
      terrainOutOfBounds: (x: number, y: number) => `地形格 ${x},${y} 超出边界。`,
      structureStartsOutOfBounds: (id: string) => `建筑 ${id} 的起点超出边界。`,
      structureExceedsGrid: (id: string) => `建筑 ${id} 超出了网格边界。`,
      unsupportedFile: "该文件不是受支持的 Burn the Village 关卡文件。",
      malformedFile: "关卡文件格式不正确。",
      invalidFireSourceCoordinates: "火源坐标无效。",
      invalidStructureDefinition: "建筑定义无效。",
      invalidTerrainTileDefinition: "地形定义无效。",
      occupancyFireSource: "火源",
      occupancyTerrain: (type: TerrainType) =>
        `地形:${type === "deepWater" ? "深水" : type === "wetTerrain" ? "湿地" : "墙"}`,
      occupancyStructure: (id: string) => `建筑:${id}`
    }
  }
} satisfies Record<Locale, TranslationCatalog>;

let currentLocale: Locale = "en";

export function getLocale() {
  return currentLocale;
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  return currentLocale;
}

export function toggleLocale() {
  currentLocale = currentLocale === "en" ? "zhHans" : "en";
  return currentLocale;
}

export function getTranslations(locale: Locale) {
  return TRANSLATIONS[locale];
}

export function getDisplayLevelName(level: LevelDefinition, locale: Locale) {
  const builtInLevelNames = getTranslations(locale).builtInLevelNames as Record<string, string | undefined>;
  return builtInLevelNames[level.id] ?? level.name;
}

export function getRankLabel(rank: Medal, locale: Locale) {
  return getTranslations(locale).ranks[rank];
}

export function getSpeedLabel(speedIndex: number, locale: Locale) {
  return getTranslations(locale).speedLabels[speedIndex] ?? getTranslations(locale).speedLabels[0];
}

export function getDefaultCustomLevelName(locale: Locale) {
  return getTranslations(locale).editor.defaultLevelName;
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function buildNameEntryText(locale: Locale, value: string) {
  const editor = getTranslations(locale).editor;
  return [
    editor.nameEntryTitle,
    "",
    value || editor.emptyPlaceholder,
    "",
    editor.nameEntryHint
  ].join("\n");
}

export function buildBudgetEntryText(locale: Locale, label: string, value: string) {
  const editor = getTranslations(locale).editor;
  return [
    `${label} ${locale === "en" ? "BUDGET" : "预算"}`,
    "",
    value || editor.emptyPlaceholder,
    "",
    editor.budgetEntryHint
  ].join("\n");
}

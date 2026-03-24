import type { Locale } from "../i18n";
import { formatPercent, getTranslations } from "../i18n";
import { isLevelValid } from "../game/editor-draft";
import type { LevelDefinition, SimulationState } from "../game/types";
import { getRankDisplay } from "./rank-display";

export type HudStatItem = {
  key: string;
  label: string;
  value: string;
  color?: string;
  tone?: "default" | "warning" | "danger" | "success";
};

export function getEditorBottomStats(level: LevelDefinition, locale: Locale): HudStatItem[] {
  const valid = isLevelValid(level);

  return [
    {
      key: "fires",
      label: locale === "en" ? "FIRES" : "火源",
      value: String(level.fireSources.length)
    },
    {
      key: "structures",
      label: locale === "en" ? "STRUCTURES" : "建筑",
      value: String(level.structures.length)
    },
    {
      key: "shape",
      label: locale === "en" ? "SHAPE" : "形态",
      value: valid ? (locale === "en" ? "VALID" : "有效") : locale === "en" ? "INVALID" : "无效",
      tone: valid ? "default" : "danger"
    }
  ];
}

export function getGameBottomStats(level: LevelDefinition, state: SimulationState, locale: Locale): HudStatItem[] {
  const strings = getTranslations(locale);
  const rank = getRankDisplay(state.medal, locale);

  return [
    {
      key: "goal",
      label: strings.gameplay.goal,
      value: formatPercent(level.completionPct)
    },
    {
      key: "destroyed",
      label: strings.gameplay.destroyed,
      value: formatPercent(state.destructionPct)
    },
    {
      key: "score",
      label: strings.gameplay.score,
      value: String(state.score)
    },
    {
      key: "medal",
      label: state.medal === "none" ? "" : strings.gameplay.rank,
      value: state.medal === "none" ? "" : locale === "en" ? rank.label.toUpperCase() : rank.label,
      color: state.medal === "none" ? undefined : rank.color
    },
    {
      key: "hay",
      label: strings.gameplay.hay,
      value: String(state.hayRemaining)
    },
    {
      key: "tnt",
      label: strings.gameplay.tnt,
      value: String(state.tntRemaining)
    }
  ];
}

export function getGameSidebarLines(state: SimulationState, _locale: Locale): string[] {
  void state;
  return [];
}

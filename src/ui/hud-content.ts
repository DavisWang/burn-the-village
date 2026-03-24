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

export function getEditorBottomStats(level: LevelDefinition): HudStatItem[] {
  const valid = isLevelValid(level);

  return [
    {
      key: "fires",
      label: "FIRES",
      value: String(level.fireSources.length)
    },
    {
      key: "structures",
      label: "STRUCTURES",
      value: String(level.structures.length)
    },
    {
      key: "shape",
      label: "SHAPE",
      value: valid ? "VALID" : "INVALID",
      tone: valid ? "default" : "danger"
    }
  ];
}

export function getGameBottomStats(level: LevelDefinition, state: SimulationState): HudStatItem[] {
  const rank = getRankDisplay(state.medal);

  return [
    {
      key: "goal",
      label: "GOAL",
      value: `${(level.completionPct * 100).toFixed(0)}%`
    },
    {
      key: "destroyed",
      label: "DESTROYED",
      value: `${(state.destructionPct * 100).toFixed(0)}%`
    },
    {
      key: "score",
      label: "SCORE",
      value: String(state.score)
    },
    {
      key: "medal",
      label: state.medal === "none" ? "" : "RANK",
      value: state.medal === "none" ? "" : rank.label.toUpperCase(),
      color: state.medal === "none" ? undefined : rank.color
    },
    {
      key: "hay",
      label: "HAY",
      value: String(state.hayRemaining)
    },
    {
      key: "tnt",
      label: "TNT",
      value: String(state.tntRemaining)
    }
  ];
}

export function getGameSidebarLines(state: SimulationState): string[] {
  void state;
  return [];
}

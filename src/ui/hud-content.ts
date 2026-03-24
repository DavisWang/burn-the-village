import { isLevelValid } from "../game/editor-draft";
import type { LevelDefinition, SimulationState } from "../game/types";

export type HudStatItem = {
  key: string;
  label: string;
  value: string;
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
      label: "MEDAL",
      value: state.medal.toUpperCase(),
      tone:
        state.medal === "gold"
          ? "warning"
          : state.medal === "none"
            ? "default"
            : "success"
    },
    {
      key: "hay",
      label: "HAY LEFT",
      value: String(state.hayRemaining)
    },
    {
      key: "tnt",
      label: "TNT LEFT",
      value: String(state.tntRemaining)
    }
  ];
}

export function getGameSidebarLines(state: SimulationState): string[] {
  return [];
}

import type { SimulationState } from "../game/types";
import type { AudioCueKey } from "./catalog";

export function getGameplayAudioCues(
  previous: SimulationState,
  next: SimulationState
): AudioCueKey[] {
  const cues: AudioCueKey[] = [];

  if (hasNewFuse(previous, next)) {
    cues.push("fuseStart");
  }
  if (hasExplosion(previous, next)) {
    cues.push("explosion");
  }
  if (hasIgnition(previous, next)) {
    cues.push("ignition");
  }
  if (previous.outcome !== "successResolved" && next.outcome === "successResolved") {
    cues.push("levelClear");
  }
  if (previous.outcome !== "failed" && next.outcome === "failed") {
    cues.push("runFailed");
  }

  return cues;
}

function hasNewFuse(previous: SimulationState, next: SimulationState): boolean {
  return hasLifecycleTransition(previous, next, "tnt", "idle", "fuse");
}

function hasExplosion(previous: SimulationState, next: SimulationState): boolean {
  return hasLifecycleTransition(previous, next, "tnt", "fuse", "spent");
}

function hasIgnition(previous: SimulationState, next: SimulationState): boolean {
  for (let y = 0; y < previous.level.gridSize; y += 1) {
    for (let x = 0; x < previous.level.gridSize; x += 1) {
      const previousCell = previous.grid[y][x];
      const nextCell = next.grid[y][x];
      const newlyBurning =
        (nextCell.material === "hay" || nextCell.material === "structure") &&
        nextCell.lifecycle === "burning" &&
        previousCell.lifecycle !== "burning";
      if (newlyBurning) {
        return true;
      }
    }
  }
  return false;
}

function hasLifecycleTransition(
  previous: SimulationState,
  next: SimulationState,
  material: "tnt",
  fromLifecycle: "idle" | "fuse",
  toLifecycle: "fuse" | "spent"
): boolean {
  for (let y = 0; y < previous.level.gridSize; y += 1) {
    for (let x = 0; x < previous.level.gridSize; x += 1) {
      const previousCell = previous.grid[y][x];
      const nextCell = next.grid[y][x];
      if (
        previousCell.material === material &&
        nextCell.material === material &&
        previousCell.lifecycle === fromLifecycle &&
        nextCell.lifecycle === toLifecycle
      ) {
        return true;
      }
    }
  }
  return false;
}

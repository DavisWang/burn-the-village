import { describe, expect, it } from "vitest";

import { getGameplayAudioCues } from "../src/audio/gameplay-cues";
import {
  createAudioRuntimeState,
  getDesiredMusicTrack,
  toggleAudioMuteState,
  unlockAudioState
} from "../src/audio/controller";
import { applyHayBrush, createSimulation, placeTnt, stepSimulation } from "../src/game/simulation";
import type { LevelDefinition } from "../src/game/types";
import { getPixelButtonCueForEvent } from "../src/ui/pixel-button-audio";

function makeLevel(overrides: Partial<LevelDefinition> = {}): LevelDefinition {
  return {
    id: "audio-test",
    name: "AUDIO TEST",
    gridSize: 32,
    resourceBudget: { hayCells: 3, tntCount: 1 },
    completionPct: 0.5,
    fireSources: [{ x: 0, y: 0 }],
    structures: [
      {
        id: "hut-1",
        type: "hut",
        origin: { x: 28, y: 28 },
        size: { x: 1, y: 1 },
        maxHp: 1
      }
    ],
    terrainTiles: [],
    ...overrides
  };
}

describe("audio runtime state", () => {
  it("unlocks music without starting it while muted", () => {
    const initial = createAudioRuntimeState();

    expect(getDesiredMusicTrack(initial)).toBeNull();

    const unlocked = unlockAudioState(initial);
    expect(unlocked.activeMusicTrack).toBe("musicLoop");
    expect(getDesiredMusicTrack(unlocked)).toBe("musicLoop");

    const muted = toggleAudioMuteState(unlocked);
    expect(muted.muted).toBe(true);
    expect(muted.activeMusicTrack).toBe("musicLoop");
    expect(getDesiredMusicTrack(muted)).toBeNull();

    const unmuted = toggleAudioMuteState(muted);
    expect(getDesiredMusicTrack(unmuted)).toBe("musicLoop");
  });
});

describe("gameplay audio cues", () => {
  it("emits a single ignition cue when new fire spreads in a tick", () => {
    const previous = applyHayBrush(createSimulation(makeLevel(), 4), { x: 1, y: 0 }, 0);
    const next = stepSimulation(previous);

    expect(getGameplayAudioCues(previous, next)).toContain("ignition");
  });

  it("emits fuse and explosion cues from TNT state transitions", () => {
    const previous = placeTnt(createSimulation(makeLevel(), 11), { x: 1, y: 0 });
    const fused = stepSimulation(previous);
    const exploded = stepSimulation(fused);

    expect(getGameplayAudioCues(previous, fused)).toContain("fuseStart");
    expect(getGameplayAudioCues(fused, exploded)).toContain("explosion");
  });

  it("emits success and failure cues on outcome transitions", () => {
    const previous = createSimulation(makeLevel(), 15);
    const success = { ...previous, outcome: "successResolved" as const };
    const failed = { ...previous, outcome: "failed" as const };

    expect(getGameplayAudioCues(previous, success)).toContain("levelClear");
    expect(getGameplayAudioCues(previous, failed)).toContain("runFailed");
  });

  it("collapses multiple new burns in one tick into one ignition cue", () => {
    const previous = createSimulation(makeLevel(), 18);
    previous.grid[0][1] = {
      ...previous.grid[0][1],
      material: "hay",
      lifecycle: "idle"
    };
    previous.grid[1][0] = {
      ...previous.grid[1][0],
      material: "hay",
      lifecycle: "idle"
    };
    const next = {
      ...previous,
      grid: previous.grid.map((row) => row.map((cell) => ({ ...cell })))
    };
    next.grid[0][1].lifecycle = "burning";
    next.grid[1][0].lifecycle = "burning";

    expect(getGameplayAudioCues(previous, next).filter((cue) => cue === "ignition")).toEqual(["ignition"]);
  });
});

describe("pixel button audio hooks", () => {
  it("defaults enabled clicks to the shared UI click cue", () => {
    expect(getPixelButtonCueForEvent("pointerdown", true)).toBe("uiClick");
  });

  it("suppresses sound on hover and on disabled clicks", () => {
    expect(getPixelButtonCueForEvent("pointerover", true)).toBeNull();
    expect(getPixelButtonCueForEvent("pointerdown", false)).toBeNull();
    expect(getPixelButtonCueForEvent("pointerdown", true, null)).toBeNull();
  });
});

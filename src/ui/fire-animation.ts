import type { CellMaterial, CellLifecycle, Point } from "../game/types";

export type FireAnimationFrame = {
  mode: "static" | "source" | "burning";
  phase: number;
  glowAlpha: number;
  emberAlpha: number;
  coreRadius: number;
  coreOffsetY: number;
  emberOffsetX: number;
  emberOffsetY: number;
  innerInsetX: number;
  innerInsetY: number;
  innerWidthOffset: number;
  innerHeightOffset: number;
};

function getBasePhase(tick: number, point: Point, cadence: number) {
  return Math.abs(tick + point.x * 3 + point.y * 5) % cadence;
}

export function getCombustionFrame(
  material: CellMaterial,
  lifecycle: CellLifecycle,
  tick: number,
  point: Point
): FireAnimationFrame {
  if (material === "fireSource") {
    const phase = getBasePhase(tick, point, 3);
    return {
      mode: "source",
      phase,
      glowAlpha: [0.18, 0.24, 0.2][phase],
      emberAlpha: [0.45, 0.62, 0.52][phase],
      coreRadius: [6, 7, 6][phase],
      coreOffsetY: [0, -1, -2][phase],
      emberOffsetX: [-1, 1, 0][phase],
      emberOffsetY: [-4, -5, -3][phase],
      innerInsetX: [4, 3, 4][phase],
      innerInsetY: [3, 2, 4][phase],
      innerWidthOffset: [-8, -6, -8][phase],
      innerHeightOffset: [-7, -5, -7][phase]
    };
  }

  if (lifecycle === "burning" && (material === "hay" || material === "structure")) {
    const phase = getBasePhase(tick, point, 4);
    return {
      mode: "burning",
      phase,
      glowAlpha: [0.16, 0.22, 0.2, 0.18][phase],
      emberAlpha: [0.55, 0.7, 0.6, 0.48][phase],
      coreRadius: [0, 0, 0, 0][phase],
      coreOffsetY: [0, -1, -2, -1][phase],
      emberOffsetX: [-1, 0, 1, 0][phase],
      emberOffsetY: [-2, -3, -4, -2][phase],
      innerInsetX: [4, 3, 5, 4][phase],
      innerInsetY: [3, 2, 4, 3][phase],
      innerWidthOffset: [-8, -6, -10, -8][phase],
      innerHeightOffset: [-8, -7, -9, -8][phase]
    };
  }

  return {
    mode: "static",
    phase: 0,
    glowAlpha: 0,
    emberAlpha: 0,
    coreRadius: 0,
    coreOffsetY: 0,
    emberOffsetX: 0,
    emberOffsetY: 0,
    innerInsetX: 0,
    innerInsetY: 0,
    innerWidthOffset: 0,
    innerHeightOffset: 0
  };
}

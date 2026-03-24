import { COLORS } from "../game/constants";
import type { Point, StructureType } from "../game/types";

export type GrassTextureFrame = {
  baseColor: number;
  patchColor: number;
  patchAlpha: number;
  patchX: number;
  patchY: number;
  patchWidth: number;
  patchHeight: number;
  bladeColor: number;
  bladeAlpha: number;
  bladeX: number;
  bladeHeight: number;
  bladeX2: number;
  bladeHeight2: number;
};

export type StructureTextureFrame = {
  roofColor: number;
  roofShadeColor: number;
  roofHighlightColor: number;
  ridgeColor: number;
  wallColor: number;
  wallShadeColor: number;
  accentX: number;
  accentY: number;
};

function hashPoint(point: Point) {
  return Math.abs(point.x * 17 + point.y * 31 + point.x * point.y * 7);
}

export function getGrassTextureFrame(point: Point): GrassTextureFrame {
  const seed = hashPoint(point);
  const baseColors = [COLORS.grassA, 0x76aa48, 0x6f9d43];
  const patchColors = [0x9dcb63, 0x88bb53, 0x7eaf4e];
  const bladeColors = [0x90c65a, 0x7cab4d, 0x658e3d];

  return {
    baseColor: baseColors[seed % baseColors.length],
    patchColor: patchColors[(seed + 1) % patchColors.length],
    patchAlpha: [0.16, 0.11, 0.14, 0.09][seed % 4],
    patchX: 2 + (seed % 5),
    patchY: 3 + ((seed >> 2) % 6),
    patchWidth: 4 + (seed % 4),
    patchHeight: 2 + ((seed >> 1) % 3),
    bladeColor: bladeColors[(seed + 2) % bladeColors.length],
    bladeAlpha: [0.2, 0.16, 0.24][seed % 3],
    bladeX: 2 + ((seed >> 1) % 8),
    bladeHeight: 5 + (seed % 4),
    bladeX2: 8 + ((seed >> 3) % 5),
    bladeHeight2: 4 + ((seed >> 2) % 4)
  };
}

export function getStructureTextureFrame(type: StructureType, point: Point): StructureTextureFrame {
  const seed = hashPoint(point);

  if (type === "hut") {
    return {
      roofColor: 0x8e5d31,
      roofShadeColor: 0x6f4424,
      roofHighlightColor: 0xc48a4f,
      ridgeColor: 0xe3b06a,
      wallColor: 0x5b3d24,
      wallShadeColor: 0x412b19,
      accentX: 4 + (seed % 5),
      accentY: 7 + ((seed >> 2) % 3)
    };
  }

  if (type === "house") {
    return {
      roofColor: 0xa56a37,
      roofShadeColor: 0x814f28,
      roofHighlightColor: 0xce8d51,
      ridgeColor: 0xf2bf75,
      wallColor: 0x65422a,
      wallShadeColor: 0x4a2f1d,
      accentX: 3 + (seed % 6),
      accentY: 7 + ((seed >> 1) % 3)
    };
  }

  return {
    roofColor: 0xb2743e,
    roofShadeColor: 0x8d572d,
    roofHighlightColor: 0xd89a59,
    ridgeColor: 0xf1c377,
    wallColor: 0x71492c,
    wallShadeColor: 0x563720,
    accentX: 3 + (seed % 7),
    accentY: 7 + ((seed >> 2) % 4)
  };
}

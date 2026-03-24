import { COLORS } from "../game/constants";
import type { Point, StructureType, TerrainType } from "../game/types";

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

export type TerrainTextureFrame = {
  baseColor: number;
  accentColor: number;
  accentAlpha: number;
  accentX: number;
  accentY: number;
  accentWidth: number;
  accentHeight: number;
  detailColor: number;
  detailAlpha: number;
  detailX: number;
  detailY: number;
  detailWidth: number;
  detailHeight: number;
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

export function getTerrainTextureFrame(type: TerrainType, point: Point, tick = 0): TerrainTextureFrame {
  const seed = hashPoint(point);
  const phase = (tick + seed) % 12;
  const waveOffset = phase < 6 ? phase : 12 - phase;

  if (type === "deepWater") {
    return {
      baseColor: [COLORS.deepWaterA, 0x296894, 0x1f557d][seed % 3],
      accentColor: COLORS.deepWaterFoam,
      accentAlpha: [0.24, 0.18, 0.14][seed % 3] + waveOffset * 0.01,
      accentX: 1 + ((seed + waveOffset) % 6),
      accentY: 3 + ((seed >> 1) % 7),
      accentWidth: 5 + (seed % 4),
      accentHeight: 2 + ((seed >> 2) % 2),
      detailColor: COLORS.deepWaterB,
      detailAlpha: [0.42, 0.35, 0.28][seed % 3] - waveOffset * 0.01,
      detailX: 2 + ((seed >> 2) % 5),
      detailY: 8 + ((seed + waveOffset) % 4),
      detailWidth: 8 + (seed % 4),
      detailHeight: 2 + ((seed >> 1) % 2)
    };
  }

  if (type === "wetTerrain") {
    const shimmerOffset = (tick + seed) % 8;
    return {
      baseColor: [COLORS.wetTerrainA, 0x5b6e42, 0x485a33][seed % 3],
      accentColor: COLORS.wetTerrainB,
      accentAlpha: [0.4, 0.32, 0.28][seed % 3] + (shimmerOffset % 4) * 0.015,
      accentX: 2 + (seed % 5),
      accentY: 5 + ((seed + shimmerOffset) % 6),
      accentWidth: 6 + (seed % 4),
      accentHeight: 4 + ((seed >> 2) % 3),
      detailColor: COLORS.wetTerrainC,
      detailAlpha: [0.18, 0.24, 0.16][seed % 3] + (shimmerOffset % 3) * 0.02,
      detailX: 3 + ((seed >> 2) % 6),
      detailY: 2 + ((seed >> 3) % 4),
      detailWidth: 3 + (seed % 3),
      detailHeight: 3 + ((seed >> 1) % 2)
    };
  }

  return {
    baseColor: [COLORS.wallA, 0x857c70, 0x6d655a][seed % 3],
    accentColor: COLORS.wallB,
    accentAlpha: [0.6, 0.5, 0.42][seed % 3],
    accentX: 0,
    accentY: 4 + ((seed >> 1) % 4),
    accentWidth: 16,
    accentHeight: 2,
    detailColor: COLORS.wallAccent,
    detailAlpha: [0.32, 0.28, 0.24][seed % 3],
    detailX: 3 + (seed % 6),
    detailY: 2 + ((seed >> 2) % 8),
    detailWidth: 2 + (seed % 2),
    detailHeight: 5 + ((seed >> 1) % 3)
  };
}

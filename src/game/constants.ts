export const GRID_SIZE = 32;
export const CELL_SIZE = 16;
export const MAP_SIZE = GRID_SIZE * CELL_SIZE;
export const SIDEBAR_WIDTH = 224;
export const HUD_HEIGHT = 156;
export const CANVAS_MARGIN = 20;
export const SECTION_FRAME_BORDER = 4;
export const PANEL_INNER_MARGIN_X = 20;
export const PANEL_INNER_MARGIN_TOP = 40;
export const PANEL_INNER_MARGIN_BOTTOM = 20;
export const SECTION_FRAME_GAP = 12;

export const MAP_ORIGIN = {
  x: CANVAS_MARGIN + PANEL_INNER_MARGIN_X + SECTION_FRAME_BORDER,
  y: CANVAS_MARGIN + PANEL_INNER_MARGIN_TOP + SECTION_FRAME_BORDER
};
export const SIDEBAR_ORIGIN = {
  x: MAP_ORIGIN.x + MAP_SIZE + SECTION_FRAME_GAP + SECTION_FRAME_BORDER * 2,
  y: MAP_ORIGIN.y
};
export const HUD_ORIGIN = {
  x: MAP_ORIGIN.x,
  y: MAP_ORIGIN.y + MAP_SIZE + SECTION_FRAME_GAP + SECTION_FRAME_BORDER * 2
};

export const PANEL_WIDTH =
  PANEL_INNER_MARGIN_X * 2 +
  (MAP_SIZE + SECTION_FRAME_BORDER * 2) +
  SECTION_FRAME_GAP +
  (SIDEBAR_WIDTH + SECTION_FRAME_BORDER * 2);
export const PANEL_HEIGHT =
  PANEL_INNER_MARGIN_TOP +
  (MAP_SIZE + SECTION_FRAME_BORDER * 2) +
  SECTION_FRAME_GAP +
  (HUD_HEIGHT + SECTION_FRAME_BORDER * 2) +
  PANEL_INNER_MARGIN_BOTTOM;
export const CANVAS_WIDTH = PANEL_WIDTH + CANVAS_MARGIN * 2;
export const CANVAS_HEIGHT = PANEL_HEIGHT + CANVAS_MARGIN * 2;
export const PLAYFIELD_CENTER_X = MAP_ORIGIN.x + MAP_SIZE / 2;
export const CANVAS_CENTER_X = CANVAS_WIDTH / 2;
export const HEADER_Y = CANVAS_MARGIN + 24;

export const TICK_MS = 140;
export const SPEED_OPTIONS = [
  { label: "SLOWEST", multiplier: 0.5 },
  { label: "SLOW", multiplier: 0.75 },
  { label: "NORMAL", multiplier: 1 },
  { label: "FAST", multiplier: 1.5 },
  { label: "FASTEST", multiplier: 2 }
] as const;

export const BRUSH_OPTIONS = [
  { label: "S", size: 1 },
  { label: "M", size: 3 },
  { label: "L", size: 5 }
] as const;

export const COLORS = {
  background: 0x110f0a,
  panel: 0x1d140d,
  panelShadow: 0x090604,
  frameLight: 0xc59b5b,
  frameDark: 0x6b4d26,
  mapBorder: 0xb18340,
  grassA: 0x7bb34a,
  grassB: 0x69953f,
  scorched: 0x35261a,
  hayA: 0xc9962b,
  hayB: 0x8d5f16,
  fireA: 0xfff27a,
  fireB: 0xff7f1f,
  fireC: 0xbb2d14,
  tnt: 0x2f2f37,
  tntFuse: 0xe65d2d,
  structureSmall: 0x7b4e2c,
  structureMedium: 0x8d5831,
  structureLarge: 0x9e6637,
  structureBurning: 0x5c1c14,
  structureRubble: 0x4a3827,
  text: 0xfce7b2,
  textDim: 0xbfa16e,
  success: 0x83dd4c,
  warning: 0xe9bb42,
  danger: 0xd5533c,
  overlay: 0x120d09
} as const;

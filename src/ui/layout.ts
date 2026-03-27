import {
  CANVAS_MARGIN,
  CANVAS_CENTER_X,
  HUD_ORIGIN,
  MAP_ORIGIN,
  MAP_SIZE,
  PANEL_HEIGHT,
  PANEL_INNER_MARGIN_BOTTOM,
  PANEL_INNER_MARGIN_TOP,
  PANEL_INNER_MARGIN_X,
  PANEL_WIDTH,
  SIDEBAR_ORIGIN,
  SIDEBAR_WIDTH
} from "../game/constants";

/*
 * Fixed-canvas geometry lives here on purpose.
 * The project repeatedly regressed when scenes owned their own spacing tweaks,
 * so layout changes should usually start in this file and the tests that lock
 * these values down.
 */
export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type StatSlot = {
  key: string;
  labelX: number;
  labelY: number;
  valueX: number;
  valueY: number;
  width: number;
};

export type ProgressMarker = {
  key: string;
  label: string;
  x: number;
  color: string;
};

export type LegendLabelLayout = {
  key: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  maxWidth: number;
};

export type HowToPlayHudColumnLayout = {
  key: string;
  x: number;
  titleY: number;
  bodyY: number;
  width: number;
};

export function getGameProgressBarLayout() {
  const x = HUD_ORIGIN.x + 22;
  const y = HUD_ORIGIN.y + 68;
  const width = 676;
  const height = 30;
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  return {
    x,
    y,
    width,
    height,
    centerX,
    centerY,
    // Pixel UI text reads better slightly above the raw midpoint.
    labelY: centerY - 2
  };
}

export function getGlobalAudioToggleLayout() {
  const width = 30;
  const height = 20;

  return {
    x: CANVAS_MARGIN + PANEL_WIDTH - PANEL_INNER_MARGIN_X - width,
    y: CANVAS_MARGIN + 12,
    width,
    height
  };
}

export function getMenuPanelLayout() {
  const contentX = CANVAS_MARGIN + PANEL_INNER_MARGIN_X;
  const contentY = CANVAS_MARGIN + PANEL_INNER_MARGIN_TOP;
  const contentWidth = PANEL_WIDTH - PANEL_INNER_MARGIN_X * 2;
  const contentHeight = PANEL_HEIGHT - PANEL_INNER_MARGIN_TOP - PANEL_INNER_MARGIN_BOTTOM;
  const buttonWidth = 280;
  const buttonHeight = 72;
  const buttonGap = 18;
  const buttonStartY = contentY + 278;
  const buttonYs = [
    buttonStartY,
    buttonStartY + buttonHeight + buttonGap,
    buttonStartY + (buttonHeight + buttonGap) * 2
  ] as const;

  return {
    hasSidebarFrame: false,
    hasHudFrame: false,
    contentX,
    contentY,
    contentWidth,
    contentHeight,
    titleCenterX: CANVAS_CENTER_X,
    textWidth: contentWidth - 96,
    buttonX: CANVAS_CENTER_X - buttonWidth / 2,
    buttonWidth,
    buttonHeight,
    buttonGap,
    buttonYs,
    footnoteX: CANVAS_CENTER_X,
    footnoteY: contentY + contentHeight - 24
  };
}

export function getMenuLocaleToggleLayout() {
  const menu = getMenuPanelLayout();
  const width = 104;
  const height = 34;
  const inset = 10;

  return {
    x: menu.contentX + menu.contentWidth - width - inset,
    y: menu.contentY + menu.contentHeight - height - inset,
    width,
    height,
    segmentWidth: width / 2
  };
}

export function getHowToPlayLayout() {
  const sidebarContentWidth = 188;
  const sidebarContentX = SIDEBAR_ORIGIN.x + Math.floor((SIDEBAR_WIDTH - sidebarContentWidth) / 2);
  const buttonHeight = 44;
  const buttonGap = 12;
  const bottomButtonY = SIDEBAR_ORIGIN.y + MAP_SIZE - 18 - buttonHeight;
  const topButtonY = bottomButtonY - buttonGap - buttonHeight;
  const hudLeftX = HUD_ORIGIN.x + 24;
  const hudRightX = SIDEBAR_ORIGIN.x + SIDEBAR_WIDTH - 24;
  const hudColumnGap = 20;
  const hudColumnWidth = Math.floor((hudRightX - hudLeftX - hudColumnGap * 2) / 3);
  const mapLabels: LegendLabelLayout[] = [
    { key: "fireSource", x: MAP_ORIGIN.x + 58, y: MAP_ORIGIN.y + 70, originX: 0.5, originY: 1, maxWidth: 72 },
    { key: "hay", x: MAP_ORIGIN.x + 140, y: MAP_ORIGIN.y + 66, originX: 0.5, originY: 1, maxWidth: 72 },
    { key: "hut", x: MAP_ORIGIN.x + 200, y: MAP_ORIGIN.y + 38, originX: 0.5, originY: 1, maxWidth: 72 },
    { key: "house", x: MAP_ORIGIN.x + 408, y: MAP_ORIGIN.y + 70, originX: 0.5, originY: 1, maxWidth: 84 },
    { key: "deepWater", x: MAP_ORIGIN.x + 432, y: MAP_ORIGIN.y + 286, originX: 0.5, originY: 0, maxWidth: 92 },
    { key: "tnt", x: MAP_ORIGIN.x + 266, y: MAP_ORIGIN.y + 264, originX: 1, originY: 0.5, maxWidth: 72 },
    { key: "wall", x: MAP_ORIGIN.x + 354, y: MAP_ORIGIN.y + 264, originX: 0, originY: 0.5, maxWidth: 72 },
    { key: "wetTerrain", x: MAP_ORIGIN.x + 104, y: MAP_ORIGIN.y + 442, originX: 0.5, originY: 0, maxWidth: 92 },
    { key: "hall", x: MAP_ORIGIN.x + 264, y: MAP_ORIGIN.y + 436, originX: 0.5, originY: 0, maxWidth: 72 }
  ];
  const hudColumns: HowToPlayHudColumnLayout[] = [
    {
      key: "structures",
      x: hudLeftX,
      titleY: HUD_ORIGIN.y + 16,
      bodyY: HUD_ORIGIN.y + 46,
      width: hudColumnWidth
    },
    {
      key: "controls",
      x: hudLeftX + hudColumnWidth + hudColumnGap,
      titleY: HUD_ORIGIN.y + 16,
      bodyY: HUD_ORIGIN.y + 46,
      width: hudColumnWidth
    },
    {
      key: "scoring",
      x: hudLeftX + (hudColumnWidth + hudColumnGap) * 2,
      titleY: HUD_ORIGIN.y + 16,
      bodyY: HUD_ORIGIN.y + 46,
      width: hudColumnWidth
    }
  ];

  return {
    sidebarContentX,
    sidebarContentWidth,
    introY: SIDEBAR_ORIGIN.y + 12,
    objectiveTitleY: SIDEBAR_ORIGIN.y + 88,
    objectiveBodyY: SIDEBAR_ORIGIN.y + 114,
    toolsTitleY: SIDEBAR_ORIGIN.y + 164,
    toolsBodyY: SIDEBAR_ORIGIN.y + 190,
    terrainTitleY: SIDEBAR_ORIGIN.y + 252,
    terrainBodyY: SIDEBAR_ORIGIN.y + 278,
    buttonX: sidebarContentX,
    buttonWidth: sidebarContentWidth,
    buttonHeight,
    levelSelectButtonY: topButtonY,
    backButtonY: bottomButtonY,
    mapLabels,
    hudColumns
  };
}

export function getLevelSelectSidebarLayout() {
  const contentWidth = 180;
  const contentX = SIDEBAR_ORIGIN.x + Math.floor((SIDEBAR_WIDTH - contentWidth) / 2);
  const buttonHeight = 52;
  const buttonGap = 14;
  const firstButtonY = SIDEBAR_ORIGIN.y + 152;
  const secondButtonY = firstButtonY + buttonHeight + buttonGap;
  const thirdButtonY = secondButtonY + buttonHeight + buttonGap;

  return {
    contentX,
    contentWidth,
    headingX: contentX,
    bodyX: contentX,
    firstButtonY,
    secondButtonY,
    thirdButtonY,
    buttonHeight
  };
}

export function getLevelSelectGridLayout(entryCount: number) {
  const cardWidth = 238;
  const cardHeight = 94;
  const cardGapX = 20;
  const cardGapY = 10;
  const columns = 2;
  const viewportX = MAP_ORIGIN.x;
  const viewportY = MAP_ORIGIN.y;
  const viewportWidth = cardWidth * columns + cardGapX;
  const viewportHeight = MAP_SIZE;
  const scrollbarInsetRight = 4;
  const scrollbarWidth = 8;
  const scrollbarHeight = MAP_SIZE - 24;
  const scrollbarX = MAP_ORIGIN.x + MAP_SIZE - scrollbarInsetRight - scrollbarWidth;
  const scrollbarY = MAP_ORIGIN.y + Math.floor((MAP_SIZE - scrollbarHeight) / 2);
  const scrollbarThumbMinHeight = 36;
  const rows = Math.max(1, Math.ceil(entryCount / columns));
  const contentHeight = rows * cardHeight + Math.max(0, rows - 1) * cardGapY;
  const maxScroll = Math.max(0, contentHeight - viewportHeight);

  return {
    cardWidth,
    cardHeight,
    cardGapX,
    cardGapY,
    columns,
    viewportX,
    viewportY,
    viewportWidth,
    viewportHeight,
    scrollbarInsetRight,
    scrollbarWidth,
    scrollbarHeight,
    scrollbarX,
    scrollbarY,
    scrollbarThumbMinHeight,
    rows,
    contentHeight,
    maxScroll
  };
}

export function clampLevelSelectScroll(entryCount: number, requestedOffset: number) {
  const layout = getLevelSelectGridLayout(entryCount);
  return Math.max(0, Math.min(layout.maxScroll, requestedOffset));
}

export function getEditorSidebarLayout() {
  const horizontalInset = 18;
  const contentWidth = SIDEBAR_WIDTH - horizontalInset * 2;
  const contentX = SIDEBAR_ORIGIN.x + Math.floor((SIDEBAR_WIDTH - contentWidth) / 2);
  const toolGap = 8;
  const toolButtonWidth = Math.floor((contentWidth - toolGap) / 2);
  const toolButtonHeight = 42;
  const toolRowGap = 8;
  const actionGap = 8;
  const actionWidth = Math.floor((contentWidth - actionGap) / 2);
  const actionRowWidth = actionWidth * 2 + actionGap;
  const actionX = SIDEBAR_ORIGIN.x + Math.floor((SIDEBAR_WIDTH - actionRowWidth) / 2);
  const menuHeight = 40;
  const actionHeight = 38;
  const clusterGap = 8;
  const menuGap = 12;
  const menuY = SIDEBAR_ORIGIN.y + MAP_SIZE - 18 - menuHeight;
  const secondRowY = menuY - menuGap - actionHeight;
  const firstRowY = secondRowY - clusterGap - actionHeight;

  return {
    contentX,
    contentWidth,
    toolButtonWidth,
    toolButtonHeight,
    toolGap,
    toolRowGap,
    actionWidth,
    actionGap,
    actionX,
    firstRowY,
    secondRowY,
    menuY,
    menuRect: {
      x: contentX,
      y: menuY,
      width: contentWidth,
      height: menuHeight
    }
  };
}

export function getEditorBottomActionLayout() {
  const contentWidth = 196;
  const rightInset = 28;
  const contentX = SIDEBAR_ORIGIN.x + SIDEBAR_WIDTH - rightInset - contentWidth;
  const pairGap = 8;
  const pairWidth = Math.floor((contentWidth - pairGap) / 2);
  const buttonHeight = 30;
  const menuHeight = 32;
  const rowGap = 6;
  const topY = HUD_ORIGIN.y + 18;

  return {
    contentX,
    contentWidth,
    pairWidth,
    pairGap,
    buttonHeight,
    menuHeight,
    topY,
    secondRowY: topY + buttonHeight + rowGap,
    menuY: topY + (buttonHeight + rowGap) * 2
  };
}

export function getEditorBottomControlLayout() {
  const actions = getEditorBottomActionLayout();
  const leftX = HUD_ORIGIN.x + 24;
  const rightX = actions.contentX - 16;
  const width = rightX - leftX;
  const groupGap = 12;
  const groupWidth = Math.floor((width - groupGap * 2) / 3);
  const goalGroupX = leftX + (groupWidth + groupGap) * 2;
  const goalStepperWidth = 34;
  const goalStepperGap = 6;
  const goalStepperX = goalGroupX + groupWidth - (goalStepperWidth * 2 + goalStepperGap);
  const budgetButtonWidth = 108;

  return {
    leftX,
    rightX,
    width,
    nameLabelY: HUD_ORIGIN.y + 18,
    nameValueY: HUD_ORIGIN.y + 48,
    groupLabelY: HUD_ORIGIN.y + 72,
    groupControlY: HUD_ORIGIN.y + 110,
    groupWidth,
    groupGap,
    budgetButtonWidth,
    budgetTextOffsetX: 3,
    budgetTextOffsetY: 3,
    budgetFontSize: "18px",
    goalValueX: goalStepperX - 14,
    goalStepperX,
    goalStepperWidth,
    goalStepperGap
  };
}

export function getEditorOverlayLayout() {
  const inputDialogWidth = 392;
  const inputDialogHeight = 188;
  const inputDialogX = CANVAS_CENTER_X - inputDialogWidth / 2;
  const inputDialogY = 238;

  return {
    inputDialogX,
    inputDialogY,
    inputDialogWidth,
    inputDialogHeight,
    inputTextY: inputDialogY + inputDialogHeight / 2,
    inputWrapWidth: 324,
    transientDialogX: CANVAS_CENTER_X - 210,
    transientDialogY: 130,
    transientDialogWidth: 420,
    transientDialogHeight: 72,
    transientTextY: 166
  };
}

export function getEditorOverlayDepths() {
  return {
    overlay: 90,
    text: 91
  };
}

export function getGameHudStatSlots(): StatSlot[] {
  // Slot order doubles as the visible HUD contract and is protected by tests.
  const slotWidth = 104;
  const gap = 12;
  const startX = HUD_ORIGIN.x + 22;
  const scoreShift = 16;
  const firstRowLabelY = HUD_ORIGIN.y + 8;
  const firstRowValueY = HUD_ORIGIN.y + 28;
  const secondRowLabelY = HUD_ORIGIN.y + 112;
  const secondRowValueY = HUD_ORIGIN.y + 132;

  return [
    {
      key: "goal",
      labelX: startX,
      labelY: firstRowLabelY,
      valueX: startX,
      valueY: firstRowValueY,
      width: slotWidth
    },
    {
      key: "destroyed",
      labelX: startX + slotWidth + gap,
      labelY: firstRowLabelY,
      valueX: startX + slotWidth + gap,
      valueY: firstRowValueY,
      width: slotWidth
    },
    {
      key: "score",
      labelX: startX + (slotWidth + gap) * 2 + scoreShift,
      labelY: firstRowLabelY,
      valueX: startX + (slotWidth + gap) * 2 + scoreShift,
      valueY: firstRowValueY,
      width: slotWidth
    },
    {
      key: "medal",
      labelX: startX + (slotWidth + gap) * 3 + scoreShift,
      labelY: firstRowLabelY,
      valueX: startX + (slotWidth + gap) * 3 + scoreShift,
      valueY: firstRowValueY,
      width: slotWidth
    },
    {
      key: "hay",
      labelX: startX,
      labelY: secondRowLabelY,
      valueX: startX,
      valueY: secondRowValueY,
      width: slotWidth
    },
    {
      key: "tnt",
      labelX: startX + slotWidth + gap,
      labelY: secondRowLabelY,
      valueX: startX + slotWidth + gap,
      valueY: secondRowValueY,
      width: slotWidth
    }
  ];
}

export function getGameSidebarLayout() {
  const contentWidth = 188;
  const contentX = SIDEBAR_ORIGIN.x + Math.floor((SIDEBAR_WIDTH - contentWidth) / 2);
  const dualButtonWidth = 88;
  const dualGap = 12;
  const dualRowX = contentX;
  const brushButtonWidth = 56;
  const brushGap = 8;
  const brushRowWidth = brushButtonWidth * 3 + brushGap * 2;
  const brushRowX = SIDEBAR_ORIGIN.x + Math.floor((SIDEBAR_WIDTH - brushRowWidth) / 2);
  const speedButtonWidth = 56;
  const speedRowX = contentX;
  const brushLabelY = SIDEBAR_ORIGIN.y + 124;
  const brushButtonsY = brushLabelY + 30;
  const speedLabelY = SIDEBAR_ORIGIN.y + 224;
  const speedButtonsY = speedLabelY + 30;
  const actionHeight = 44;
  const actionGap = 12;
  const actionBottomY = SIDEBAR_ORIGIN.y + MAP_SIZE - 18 - actionHeight;
  const actionTopY = actionBottomY - actionGap - actionHeight;

  return {
    contentX,
    contentWidth,
    dualRowX,
    dualButtonWidth,
    dualGap,
    brushRowX,
    brushButtonWidth,
    brushGap,
    brushLabelY,
    brushButtonsY,
    speedRowX,
    speedButtonWidth,
    speedLabelY,
    speedButtonsY,
    speedLabelCenterX: SIDEBAR_ORIGIN.x + Math.floor(SIDEBAR_WIDTH / 2),
    speedLabelMaxWidth: contentWidth - speedButtonWidth * 2 - 16,
    sectionLabelX: contentX,
    actionX: contentX,
    actionHeight,
    actionTopY,
    actionBottomY
  };
}

export function getGameSummaryLayout() {
  const dialogWidth = 356;
  const dialogHeight = 376;
  const dialogX = CANVAS_CENTER_X - dialogWidth / 2;
  const dialogY = 206;
  const titleY = dialogY + 54;
  const statsY = dialogY + 114;
  const rankY = dialogY + 168;
  const buttonWidth = 240;
  const buttonHeight = 46;
  const buttonX = CANVAS_CENTER_X - buttonWidth / 2;
  const buttonGap = 12;
  const bottomPadding = 14;
  const thirdButtonY = dialogY + dialogHeight - bottomPadding - buttonHeight;
  const secondButtonY = thirdButtonY - buttonGap - buttonHeight;
  const firstButtonY = secondButtonY - buttonGap - buttonHeight;

  return {
    dialogX,
    dialogY,
    dialogWidth,
    dialogHeight,
    titleY,
    statsY,
    rankY,
    buttonX,
    buttonWidth,
    buttonHeight,
    firstButtonY,
    secondButtonY,
    thirdButtonY,
    summaryContentBottomY: rankY + 24
  };
}

export function getGameSummaryDepths() {
  return {
    overlay: 90,
    text: 91,
    buttons: 92
  };
}

export function getGameProgressMarkers(meterX: number, meterWidth: number, completionPct: number) {
  const valueX = (value: number) => meterX + meterWidth * value;

  return [
    { key: "pass", label: "PASS", x: valueX(completionPct), color: "#68bfd6" },
    { key: "bronze", label: "BRONZE", x: valueX(0.8), color: "#c58f52" },
    { key: "silver", label: "SILVER", x: valueX(0.9), color: "#d8d1c4" },
    { key: "gold", label: "GOLD", x: valueX(1), color: "#f4d35e" }
  ] satisfies ProgressMarker[];
}

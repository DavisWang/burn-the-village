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

export function getMenuPanelLayout() {
  const contentX = CANVAS_MARGIN + PANEL_INNER_MARGIN_X;
  const contentY = CANVAS_MARGIN + PANEL_INNER_MARGIN_TOP;
  const contentWidth = PANEL_WIDTH - PANEL_INNER_MARGIN_X * 2;
  const contentHeight = PANEL_HEIGHT - PANEL_INNER_MARGIN_TOP - PANEL_INNER_MARGIN_BOTTOM;
  const buttonWidth = 280;
  const buttonHeight = 72;

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
    firstButtonY: contentY + 278,
    secondButtonY: contentY + 368,
    footnoteX: CANVAS_CENTER_X,
    footnoteY: contentY + contentHeight - 24
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
    groupLabelY: HUD_ORIGIN.y + 80,
    groupControlY: HUD_ORIGIN.y + 100,
    groupWidth,
    groupGap,
    budgetButtonWidth,
    budgetTextOffsetX: 2,
    budgetTextOffsetY: 2,
    budgetFontSize: "20px",
    goalValueX: goalStepperX - 14,
    goalStepperX,
    goalStepperWidth,
    goalStepperGap
  };
}

export function getEditorOverlayLayout() {
  const inputDialogWidth = 392;
  const inputDialogHeight = 146;
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

export function getGameHudStatSlots(): StatSlot[] {
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
    speedRowX,
    speedButtonWidth,
    speedLabelCenterX: SIDEBAR_ORIGIN.x + Math.floor(SIDEBAR_WIDTH / 2),
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
  const statsY = dialogY + 102;
  const rankY = dialogY + 148;
  const buttonWidth = 240;
  const buttonHeight = 48;
  const buttonX = CANVAS_CENTER_X - buttonWidth / 2;
  const buttonGap = 14;
  const bottomPadding = 18;
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
    summaryContentBottomY: rankY + 28
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
    { key: "pass", label: "PASS", x: valueX(completionPct), color: "#e9bb42" },
    { key: "bronze", label: "BRONZE", x: valueX(0.8), color: "#c58f52" },
    { key: "silver", label: "SILVER", x: valueX(0.9), color: "#d8d1c4" },
    { key: "gold", label: "GOLD", x: valueX(1), color: "#f4d35e" }
  ] satisfies ProgressMarker[];
}

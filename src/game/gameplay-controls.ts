import type { Point, ToolKind } from "./types";

export type GameplayControlState = {
  tool: ToolKind;
  brushIndex: number;
  hoverCells: Point[];
  accumulator: number;
};

export function getDefaultGameplayControls(): GameplayControlState {
  return {
    tool: "hay",
    brushIndex: 1,
    hoverCells: [],
    accumulator: 0
  };
}

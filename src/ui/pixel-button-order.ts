export function getPixelButtonLayerOrder() {
  return ["shadow", "panel", "highlight", "selectionOutline", "labelText", "hitArea"] as const;
}

export function getPixelButtonSelectionOutlineMetrics() {
  return {
    inset: 2,
    strokeWidth: 3
  };
}

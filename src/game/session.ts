import { BUILT_IN_LEVELS } from "./levels";
import { cloneLevel, createBlankLevel } from "./editor-draft";
import type { LevelCatalogEntry, LevelDefinition } from "./types";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

class GameSession {
  private customLevels: LevelDefinition[] = [];
  private editorDraft = createBlankLevel();

  getCatalog(): LevelCatalogEntry[] {
    return [
      ...BUILT_IN_LEVELS.map((level) => ({ level, source: "built-in" as const })),
      ...this.customLevels.map((level) => ({ level, source: "custom" as const }))
    ];
  }

  getLevelById(levelId: string): LevelDefinition | undefined {
    return this.getCatalog().find((entry) => entry.level.id === levelId)?.level;
  }

  addCustomLevel(level: LevelDefinition): LevelDefinition {
    const next = cloneLevel(level);
    const baseId = slugify(next.id || next.name || "custom-level") || "custom-level";
    let candidate = baseId;
    let suffix = 2;
    while (this.getLevelById(candidate)) {
      candidate = `${baseId}-${suffix}`;
      suffix += 1;
    }
    next.id = candidate;
    this.customLevels = [...this.customLevels.filter((item) => item.id !== next.id), next];
    return next;
  }

  replaceEditorDraft(level: LevelDefinition) {
    this.editorDraft = cloneLevel(level);
  }

  getEditorDraft(): LevelDefinition {
    return cloneLevel(this.editorDraft);
  }

  resetEditorDraft() {
    this.editorDraft = createBlankLevel();
  }
}

export const session = new GameSession();

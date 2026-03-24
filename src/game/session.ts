import { BUILT_IN_LEVELS } from "./levels";
import { cloneLevel, createBlankLevel } from "./editor-draft";
import { getLocale } from "../i18n";
import type { LevelCatalogEntry, LevelDefinition } from "./types";

/*
 * Runtime-only session state.
 * This is intentionally in-memory: it lets the editor, level select, and
 * gameplay scenes share built-ins, imports, and the current draft without
 * pretending the project already has durable persistence.
 */
function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

class GameSession {
  private customLevels: LevelDefinition[] = [];
  private editorDraft = createBlankLevel("custom-level", getLocale());

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
    this.editorDraft = createBlankLevel("custom-level", getLocale());
  }
}

export const session = new GameSession();

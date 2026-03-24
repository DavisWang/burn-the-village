import type { Locale } from "../i18n";
import { getTranslations } from "../i18n";
import type { LevelCatalogEntry } from "../game/types";

export function getLevelCardStatsText(entry: LevelCatalogEntry, _locale: Locale) {
  void entry;
  return "";
}

export function getLevelSelectSidebarCopy(locale: Locale) {
  return getTranslations(locale).levelSelect.sidebarCopy;
}

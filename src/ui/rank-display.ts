import type { Locale } from "../i18n";
import { getRankLabel } from "../i18n";
import type { Medal } from "../game/types";

export type RankDisplay = {
  label: string;
  color: string;
};

export function getRankDisplay(rank: Medal, locale: Locale): RankDisplay {
  if (rank === "bronze") {
    return { label: getRankLabel(rank, locale), color: "#c58f52" };
  }
  if (rank === "silver") {
    return { label: getRankLabel(rank, locale), color: "#d8d1c4" };
  }
  if (rank === "gold") {
    return { label: getRankLabel(rank, locale), color: "#f4d35e" };
  }
  return { label: getRankLabel(rank, locale), color: "#fce7b2" };
}

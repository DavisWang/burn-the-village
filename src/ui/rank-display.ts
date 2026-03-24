import type { Medal } from "../game/types";

export type RankDisplay = {
  label: string;
  color: string;
};

export function getRankDisplay(rank: Medal): RankDisplay {
  if (rank === "bronze") {
    return { label: "Bronze", color: "#c58f52" };
  }
  if (rank === "silver") {
    return { label: "Silver", color: "#d8d1c4" };
  }
  if (rank === "gold") {
    return { label: "Gold", color: "#f4d35e" };
  }
  return { label: "None", color: "#fce7b2" };
}

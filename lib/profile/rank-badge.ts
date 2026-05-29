import { resolveAdventurerTitleLabel } from "@/lib/adventure/adventure-dashboard-client"

export type ProfileRankBadge = "bronze" | "silver" | "gold" | "diamond" | "master"

export function resolveRankBadge(adventureLevel: number): ProfileRankBadge {
  const level = Math.max(1, Math.floor(adventureLevel))
  if (level <= 15) return "bronze"
  if (level <= 30) return "silver"
  if (level <= 45) return "gold"
  if (level < 60) return "diamond"
  return "master"
}

export { resolveAdventurerTitleLabel }

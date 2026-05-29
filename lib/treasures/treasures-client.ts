import type { TreasureListItem } from "@/lib/treasures/types"

export interface TreasuresApiPayload {
  items: TreasureListItem[]
  preview: TreasureListItem[]
  unlockedCount: number
  totalCount: number
  newlyUnlocked: string[]
}

export async function fetchUserTreasures(): Promise<TreasuresApiPayload | null> {
  try {
    const response = await fetch("/api/treasures", { cache: "no-store" })
    const payload = await response.json()
    if (!response.ok || !payload?.data) return null
    return payload.data as TreasuresApiPayload
  } catch {
    return null
  }
}

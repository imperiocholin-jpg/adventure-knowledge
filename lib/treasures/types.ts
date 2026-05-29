export type TreasureRewardType = "pet" | "skin" | "badge" | "area" | "item" | "title"
export type TreasureRarity = "rare" | "epic" | "legendary"

export type TreasureConditionType =
  | "stars_total"
  | "daily_streak"
  | "book_complete"
  | "books_read_count"
  | "post_read_books_count"
  | "regions_unlocked"
  | "region_progress"
  | "world_progress"

export interface TreasureDefinition {
  id: string
  name: string
  icon: string
  type: TreasureRewardType
  rarity: TreasureRarity
  description: string
  requirement: string
  conditionType: TreasureConditionType
  targetValue: number
  conditionPayload: Record<string, unknown>
  sortOrder: number
}

export interface TreasureUserMetrics {
  totalStars: number
  worldProgress: number
  dailyStreak: number
  regionsUnlocked: number
  regionProgress: Record<string, number>
  booksReadCount: number
  postReadBooksCount: number
  completedBookIds: Set<string>
}

export interface TreasureListItem {
  id: string
  name: string
  icon: string
  type: TreasureRewardType
  rarity: TreasureRarity
  description: string
  requirement: string
  progress: number
  unlocked: boolean
  unlockedAt: string | null
}

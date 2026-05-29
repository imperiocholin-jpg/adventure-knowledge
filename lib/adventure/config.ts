import { resolveReadingRewardGrant } from "@/lib/economy/reward-policy"
import {
  ADVENTURE_REGION_META,
  ADVENTURE_REGION_UNLOCK_ORDER,
  type AdventureRegionId,
} from "@/lib/library/adventure-regions"
import { getLocalBooksByRegion } from "@/lib/library/local-book-catalog"

export type StoryEntryMode = "post_read" | "direct"

export interface RegionBookConfig {
  /** 阅读器 bookId（有正文时）或 moe-xxx 占位 */
  bookId: string
  moeId: string
  challengeChapterId: string
}

export interface RegionShelfConfig {
  name: string
  /** 区域内闯关关卡数（与书目数量解耦） */
  totalStages: number
  unlockedByDefault?: boolean
  unlockWhenPrevProgressAtLeast?: number
  books: RegionBookConfig[]
}

export const REGION_UNLOCK_ORDER = ADVENTURE_REGION_UNLOCK_ORDER

export interface ChallengeRewardPolicy {
  experienceGain: number
  petExpGain: number
  stars: number
}

function buildRegionBooks(regionId: AdventureRegionId): RegionBookConfig[] {
  return getLocalBooksByRegion(regionId).map((book) => ({
    bookId: book.id,
    moeId: book.id,
    challengeChapterId: `chapter_${book.id}`,
  }))
}

export const REGION_SHELF_CONFIG: Record<string, RegionShelfConfig> = Object.fromEntries(
  (Object.keys(ADVENTURE_REGION_META) as AdventureRegionId[]).map((regionId) => {
    const meta = ADVENTURE_REGION_META[regionId]
    return [
      regionId,
      {
        name: meta.name,
        totalStages: meta.totalStages,
        unlockedByDefault: meta.unlockedByDefault,
        unlockWhenPrevProgressAtLeast: meta.unlockWhenPrevProgressAtLeast,
        books: buildRegionBooks(regionId),
      },
    ]
  }),
)

export const DIRECT_CHALLENGE_DAILY_LIMIT = 3

const POST_READ_REWARD = resolveReadingRewardGrant("post_read")
const DIRECT_READ_REWARD = resolveReadingRewardGrant("direct")

/** 阅读挑战奖励（宠物经验与 coins 与 reward-policy 单源对齐） */
export const CHALLENGE_REWARD_POLICY: Record<StoryEntryMode, ChallengeRewardPolicy> = {
  post_read: {
    experienceGain: 20,
    petExpGain: POST_READ_REWARD.petExp,
    stars: 3,
  },
  direct: {
    experienceGain: 10,
    petExpGain: DIRECT_READ_REWARD.petExp,
    stars: 1,
  },
}

export function challengeOwnerCoins(mode: StoryEntryMode) {
  return resolveReadingRewardGrant(mode).ownerCoins
}

export function resolveRegionIdByBookId(bookId: string) {
  const entry = Object.entries(REGION_SHELF_CONFIG).find(([, region]) =>
    region.books.some((bookConfig) => bookConfig.bookId === bookId || bookConfig.moeId === bookId),
  )
  return entry?.[0] ?? null
}

export function resolveRegionIdByMoeId(moeId: string) {
  const entry = Object.entries(REGION_SHELF_CONFIG).find(([, region]) =>
    region.books.some((bookConfig) => bookConfig.moeId === moeId),
  )
  return entry?.[0] ?? null
}

/** 玩法奖励总表（见 产品规则定稿表 §7） */

export type BattleResult = "win" | "lose" | "draw"

export interface BattleRewardGrant {
  petExp: number
  ownerCoins: number
  firstWinBonusPetExp: number
}

export interface ReadingRewardGrant {
  ownerCoins: number
  petExp: number
}

export const DAILY_TASK_COIN_TIERS = {
  small: 15,
  medium: 25,
  large: 35,
} as const

export function resolveBattleRewardGrant(
  result: BattleResult,
  hasFirstWinBonus: boolean,
): BattleRewardGrant {
  if (result === "win") {
    return {
      petExp: 20,
      ownerCoins: 12,
      firstWinBonusPetExp: hasFirstWinBonus ? 10 : 0,
    }
  }
  if (result === "draw") {
    return {
      petExp: 12,
      ownerCoins: 6,
      firstWinBonusPetExp: 0,
    }
  }
  return {
    petExp: 8,
    ownerCoins: 3,
    firstWinBonusPetExp: 0,
  }
}

export function resolveReadingRewardGrant(entryMode: "post_read" | "direct"): ReadingRewardGrant {
  if (entryMode === "direct") {
    return { ownerCoins: 4, petExp: 6 }
  }
  return { ownerCoins: 8, petExp: 12 }
}

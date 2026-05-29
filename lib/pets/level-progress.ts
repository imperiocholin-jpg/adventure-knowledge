/** 方案 A：线性递增升级经验（见 产品规则定稿表 §6） */

export const PET_EXP_BASE = 80
export const PET_EXP_STEP = 8
export const PET_LEVEL_CAP = 50

/** 当前等级 L（1..49）升到 L+1 所需经验 */
export function expToNextLevel(level: number) {
  const L = Math.max(1, Math.min(PET_LEVEL_CAP - 1, Math.floor(level)))
  return PET_EXP_BASE + (L - 1) * PET_EXP_STEP
}

/** 到达等级 L（L>=1）所需的累计 pet_exp 下限；L=1 为 0 */
export function cumulativeExpForLevel(level: number) {
  const target = Math.max(1, Math.min(PET_LEVEL_CAP, Math.floor(level)))
  if (target <= 1) return 0
  const n = target - 1
  return n * PET_EXP_BASE + (PET_EXP_STEP * (n - 1) * n) / 2
}

/** 总经验 → 当前等级 1..50 */
export function levelFromTotalExp(totalExp: number) {
  const exp = Math.max(0, Math.floor(totalExp))
  let level = 1
  while (level < PET_LEVEL_CAP && exp >= cumulativeExpForLevel(level + 1)) {
    level += 1
  }
  return level
}

/** 当前级内进度 0..100 */
export function progressInLevel(totalExp: number) {
  const exp = Math.max(0, Math.floor(totalExp))
  const level = levelFromTotalExp(exp)
  if (level >= PET_LEVEL_CAP) return 100
  const floor = cumulativeExpForLevel(level)
  const need = expToNextLevel(level)
  if (need <= 0) return 100
  return Math.min(100, Math.round(((exp - floor) / need) * 100))
}

export function resolveLifeStageFromLevel(level: number): "幼崽" | "成年" | "壮年" {
  const L = Math.max(1, Math.min(PET_LEVEL_CAP, Math.floor(level)))
  if (L >= 26) return "壮年"
  if (L >= 11) return "成年"
  return "幼崽"
}

/** @deprecated 使用 progressInLevel */
export function getPetLevelProgressPercentFromExp(totalExp: number) {
  return progressInLevel(totalExp)
}

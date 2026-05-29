import { resolveBattleRewardGrant } from "@/lib/economy/reward-policy"

export type BattleLifeStage = "幼崽" | "成年" | "壮年"

export interface BattleEquipmentBonus {
  slot: "accessory" | "outfit" | "special"
  atkPct?: number
  hpPct?: number
  allPct?: number
}

export interface PetBattleStats {
  level: number
  lifeStage: BattleLifeStage
  attack: number
  maxHealth: number
}

export interface DamageCalcInput {
  attackerAttack: number
  attackerLevel: number
  defenderLevel: number
  comboStreak: number
  extraDamagePct?: number
  randomValue?: number
}

export interface DamageCalcResult {
  damage: number
  comboFactor: number
  protectFactor: number
  randomFactor: number
}

export interface BattleRewardResult {
  petExp: number
  ownerPoints: number
  firstWinBonusExp: number
}

const BASE_ATTACK_START = 18
const BASE_ATTACK_GROWTH = 3
const BASE_HEALTH_START = 120
const BASE_HEALTH_GROWTH = 18

const ROUND_LIMIT = 20

export const battleConstants = {
  roundLimit: ROUND_LIMIT,
  timeLimitSeconds: 12,
  randomFactorMin: 0.9,
  randomFactorMax: 1.1,
}

export function resolveBattleLifeStage(level: number): BattleLifeStage {
  if (level >= 26) return "壮年"
  if (level >= 11) return "成年"
  return "幼崽"
}

export function resolveStageFactor(level: number) {
  const stage = resolveBattleLifeStage(level)
  if (stage === "幼崽") return 0.95
  if (stage === "壮年") return 1.08
  return 1
}

export function calcBattleStats(level: number, equipmentBonuses: BattleEquipmentBonus[] = []): PetBattleStats {
  const safeLevel = Math.max(1, Math.floor(level))
  const stageFactor = resolveStageFactor(safeLevel)
  const baseAttack = BASE_ATTACK_START + safeLevel * BASE_ATTACK_GROWTH
  const baseHealth = BASE_HEALTH_START + safeLevel * BASE_HEALTH_GROWTH

  const atkBonusTotal = equipmentBonuses.reduce(
    (sum, item) => sum + (item.atkPct ?? 0) + (item.allPct ?? 0),
    0,
  )
  const hpBonusTotal = equipmentBonuses.reduce(
    (sum, item) => sum + (item.hpPct ?? 0) + (item.allPct ?? 0),
    0,
  )

  return {
    level: safeLevel,
    lifeStage: resolveBattleLifeStage(safeLevel),
    attack: Math.floor(baseAttack * stageFactor * (1 + atkBonusTotal)),
    maxHealth: Math.floor(baseHealth * stageFactor * (1 + hpBonusTotal)),
  }
}

export function resolveComboFactor(comboStreak: number) {
  if (comboStreak <= 1) return 1
  const layers = Math.min(3, comboStreak - 1)
  return 1 + layers * 0.1
}

export function resolveProtectFactor(attackerLevel: number, defenderLevel: number) {
  const levelDiff = Math.floor(attackerLevel) - Math.floor(defenderLevel)
  if (levelDiff > 8) return 0.92
  return 1
}

export function calcBattleDamage(input: DamageCalcInput): DamageCalcResult {
  const randomBase = input.randomValue ?? Math.random()
  const randomFactor =
    battleConstants.randomFactorMin +
    (battleConstants.randomFactorMax - battleConstants.randomFactorMin) * Math.max(0, Math.min(1, randomBase))
  const comboFactor = resolveComboFactor(input.comboStreak)
  const protectFactor = resolveProtectFactor(input.attackerLevel, input.defenderLevel)
  const extraDamageFactor = 1 + (input.extraDamagePct ?? 0)
  const damage = Math.max(1, Math.floor(input.attackerAttack * randomFactor * comboFactor * protectFactor * extraDamageFactor))

  return {
    damage,
    comboFactor,
    protectFactor,
    randomFactor,
  }
}

export function resolveBattleRewards(result: "win" | "lose" | "draw", hasFirstWinBonus: boolean): BattleRewardResult {
  const grant = resolveBattleRewardGrant(result, hasFirstWinBonus)
  return {
    petExp: grant.petExp,
    ownerPoints: grant.ownerCoins,
    firstWinBonusExp: grant.firstWinBonusPetExp,
  }
}

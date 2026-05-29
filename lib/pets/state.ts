import type { PetInteractAction } from "@/lib/pets/shop"
import { progressInLevel } from "@/lib/pets/level-progress"

/** 饱食度（库字段仍为 hunger / pet_hunger） */
export interface PetVitalState {
  satiety: number
  spirit: number
  bond: number
  isDead: boolean
  deadAt: string | null
}

export interface PetInventoryMap {
  [itemId: string]: number
}

export const PET_STATE_MAX = 100
export const DEFAULT_PET_VITAL = 80
/** 每日固定衰减 20 点 */
export const DAILY_SATIETY_DECAY = 20
/** 每日亲密衰减 10 点 */
export const DAILY_BOND_DECAY = 10
/** 对战一次饱食度衰减 10 点 */
export const BATTLE_SATIETY_COST = 10
/** 对战一次精神值衰减 10 点 */
export const BATTLE_SPIRIT_COST = 10
/** 饱食度低于此值不可对战 */
export const MIN_SATIETY_FOR_BATTLE = 20
/** 精神值低于此值不可对战 */
export const MIN_SPIRIT_FOR_BATTLE = 10
/** 亲密值低于此值不可对战 */
export const MIN_BOND_FOR_BATTLE = 10

const HOME_MOOD_THRESHOLD = 50

export function clampPetState(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(PET_STATE_MAX, Math.floor(value)))
}

export function normalizePetState(raw: Partial<PetVitalState> | null | undefined): PetVitalState {
  const satiety = clampPetState(raw?.satiety ?? DEFAULT_PET_VITAL)
  const spirit = clampPetState(raw?.spirit ?? DEFAULT_PET_VITAL)
  const bond = clampPetState(raw?.bond ?? DEFAULT_PET_VITAL)
  const dead = Boolean(raw?.isDead) || satiety <= 0
  return {
    satiety,
    spirit,
    bond,
    isDead: dead,
    deadAt: dead ? raw?.deadAt ?? new Date().toISOString() : null,
  }
}

export function normalizeInventory(raw: unknown): PetInventoryMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  const map: PetInventoryMap = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const count = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : Number(value)
    if (Number.isFinite(count) && count > 0) {
      map[key] = Math.max(1, Math.floor(count))
    }
  }
  return map
}

/** 展示心情：饱食度低→饥饿，亲密低→无聊，精神低→犯困 */
export type HomePetMood = "happy" | "hungry" | "bored" | "sleepy"

export function getHomePetMood(state: Pick<PetVitalState, "satiety" | "spirit" | "bond" | "isDead">): HomePetMood {
  if (state.isDead) return "sleepy"
  if (state.satiety < HOME_MOOD_THRESHOLD) return "hungry"
  if (state.bond < HOME_MOOD_THRESHOLD) return "bored"
  if (state.spirit < HOME_MOOD_THRESHOLD) return "sleepy"
  return "happy"
}

/** 2D 场景 mood：与 getHomePetMood 四态对齐 */
export function mapHomeMoodToSceneMood(mood: HomePetMood): "happy" | "hungry" | "listless" | "sleepy" {
  if (mood === "hungry") return "hungry"
  if (mood === "bored") return "listless"
  if (mood === "sleepy") return "sleepy"
  return "happy"
}

function readRecordNumber(record: Record<string, unknown>, fields: string[], fallback: number) {
  const field = fields.find((name) => name in record)
  if (!field) return fallback
  const value = record[field]
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export function parsePetVitalsFromRecord(record: Record<string, unknown> | null | undefined): PetVitalState {
  if (!record) return normalizePetState(null)
  return normalizePetState({
    satiety: readRecordNumber(record, ["hunger", "pet_hunger", "satiety", "pet_satiety"], DEFAULT_PET_VITAL),
    spirit: readRecordNumber(record, ["spirit", "pet_spirit", "energy", "pet_energy"], DEFAULT_PET_VITAL),
    bond: readRecordNumber(record, ["bond", "pet_bond", "happiness", "intimacy", "affection_level"], DEFAULT_PET_VITAL),
    isDead: Boolean(record.is_dead ?? record.pet_dead),
    deadAt:
      typeof record.dead_at === "string"
        ? record.dead_at
        : typeof record.pet_dead_at === "string"
          ? record.pet_dead_at
          : null,
  })
}

export function getPetLevelProgressPercent(record: Record<string, unknown> | null | undefined) {
  if (!record) return 0
  const exp = readRecordNumber(record, ["pet_exp", "exp", "experience"], 0)
  return progressInLevel(exp)
}

/** 每日饱食度 + 亲密衰减 */
export function applyDailyVitalDecay(state: PetVitalState) {
  if (state.isDead) return state
  return normalizePetState({
    ...state,
    satiety: state.satiety - DAILY_SATIETY_DECAY,
    bond: state.bond - DAILY_BOND_DECAY,
  })
}

/** @deprecated 使用 applyDailyVitalDecay */
export const applyDailySatietyDecay = applyDailyVitalDecay

export function applyBattleVitalCost(state: PetVitalState) {
  if (state.isDead) return state
  return normalizePetState({
    ...state,
    satiety: state.satiety - BATTLE_SATIETY_COST,
    spirit: state.spirit - BATTLE_SPIRIT_COST,
  })
}

/** @deprecated 使用 applyBattleVitalCost */
export const consumeBattleCost = applyBattleVitalCost

export function canEnterBattle(state: PetVitalState) {
  if (state.isDead) return { ok: false, reason: "宠物已离世，无法参与战斗。" }
  if (state.satiety < MIN_SATIETY_FOR_BATTLE) {
    return { ok: false, reason: `饱食度需 ≥ ${MIN_SATIETY_FOR_BATTLE} 才可对战。` }
  }
  if (state.spirit < MIN_SPIRIT_FOR_BATTLE) {
    return { ok: false, reason: `精神值需 ≥ ${MIN_SPIRIT_FOR_BATTLE} 才可对战。` }
  }
  if (state.bond < MIN_BOND_FOR_BATTLE) {
    return { ok: false, reason: `亲密值需 ≥ ${MIN_BOND_FOR_BATTLE} 才可对战。` }
  }
  return { ok: true, reason: null as string | null }
}

export function applyInteractEffects(
  state: PetVitalState,
  effect: { satiety?: number; hunger?: number; spirit?: number; bond?: number },
) {
  if (state.isDead) return state
  const satietyDelta = effect.satiety ?? effect.hunger ?? 0
  return normalizePetState({
    ...state,
    satiety: state.satiety + satietyDelta,
    spirit: state.spirit + (effect.spirit ?? 0),
    bond: state.bond + (effect.bond ?? 0),
  })
}

export function getRequiredItemNotice(action: PetInteractAction) {
  if (action === "feed") return "需要先在商城购买食物。"
  if (action === "train") return "需要先在商城购买训练工具。"
  if (action === "sleep") return "需要先在商城购买休息装备。"
  return "需要先在商城购买玩具。"
}

export function writeVitalFieldsToPayload(
  state: PetVitalState,
  fields: {
    satietyField?: string | null
    spiritField?: string | null
    bondField?: string | null
    deadField?: string | null
    deadAtField?: string | null
  },
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (fields.satietyField) payload[fields.satietyField] = state.satiety
  if (fields.spiritField) payload[fields.spiritField] = state.spirit
  if (fields.bondField) payload[fields.bondField] = state.bond
  if (fields.deadField) payload[fields.deadField] = state.isDead
  if (fields.deadAtField) payload[fields.deadAtField] = state.deadAt
  return payload
}

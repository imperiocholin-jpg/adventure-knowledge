import {
  BATTLE_SATIETY_COST,
  BATTLE_SPIRIT_COST,
  PET_STATE_MAX,
  type PetVitalState,
} from "@/lib/pets/state"

export interface BattleVitalCostPreview {
  satietyCost: number
  spiritCost: number
  satietyPercent: number
  spiritPercent: number
  satietyBefore: number
  spiritBefore: number
  satietyAfter: number
  spiritAfter: number
}

/** 单场对战状态消耗（产品规则：饱食 -10、精神 -10，即满值 100 的 10%） */
export function getBattleVitalCostPreview(state: Pick<PetVitalState, "satiety" | "spirit">): BattleVitalCostPreview {
  const satietyPercent = Math.round((BATTLE_SATIETY_COST / PET_STATE_MAX) * 100)
  const spiritPercent = Math.round((BATTLE_SPIRIT_COST / PET_STATE_MAX) * 100)
  return {
    satietyCost: BATTLE_SATIETY_COST,
    spiritCost: BATTLE_SPIRIT_COST,
    satietyPercent,
    spiritPercent,
    satietyBefore: state.satiety,
    spiritBefore: state.spirit,
    satietyAfter: Math.max(0, state.satiety - BATTLE_SATIETY_COST),
    spiritAfter: Math.max(0, state.spirit - BATTLE_SPIRIT_COST),
  }
}

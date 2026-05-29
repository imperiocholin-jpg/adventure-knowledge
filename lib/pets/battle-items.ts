import { listItemsByCategory } from "@/lib/pets/shop"

export type BattleItemEffectType =
  | "bonus_attack"
  | "block_hit"
  | "combo_boost"
  | "heal_instant"
  | "armor_pierce"
  | "counter_reflect"

export interface BattleItemConfig {
  itemId: string
  effectType: BattleItemEffectType
  label: string
  /** 触发时机说明（展示用） */
  triggerHint: string
  bonusAttack?: number
  healAmount?: number
  piercePct?: number
  reflectPct?: number
}

export const BATTLE_ITEM_CONFIGS: BattleItemConfig[] = [
  {
    itemId: "equip-collar",
    effectType: "bonus_attack",
    label: "强攻护符",
    triggerHint: "首次答对时自动 +50 攻击",
    bonusAttack: 50,
  },
  {
    itemId: "equip-tag",
    effectType: "block_hit",
    label: "守护护盾",
    triggerHint: "受击时自动抵挡 1 次伤害",
  },
  {
    itemId: "equip-bell",
    effectType: "combo_boost",
    label: "连击推进器",
    triggerHint: "答对时自动额外 +1 连击",
  },
  {
    itemId: "equip-bandana",
    effectType: "heal_instant",
    label: "应急药剂",
    triggerHint: "血量低于 50% 时自动回复",
    healAmount: 80,
  },
  {
    itemId: "equip-badge",
    effectType: "armor_pierce",
    label: "破甲符文",
    triggerHint: "首次攻击时自动破防 30%",
    piercePct: 0.3,
  },
  {
    itemId: "equip-charm",
    effectType: "counter_reflect",
    label: "反击棱镜",
    triggerHint: "受击后自动反弹 25% 伤害",
    reflectPct: 0.25,
  },
]

const configById = new Map(BATTLE_ITEM_CONFIGS.map((item) => [item.itemId, item]))

export function getBattleItemConfig(itemId: string) {
  return configById.get(itemId) ?? null
}

export function listBattleItemConfigs() {
  return BATTLE_ITEM_CONFIGS
}

export function listOwnedBattleItems(inventory: Record<string, number>) {
  const equipmentIds = new Set(listItemsByCategory("equipment").map((item) => item.id))
  return BATTLE_ITEM_CONFIGS.filter(
    (config) => equipmentIds.has(config.itemId) && (inventory[config.itemId] ?? 0) > 0,
  ).map((config) => ({
    ...config,
    owned: inventory[config.itemId] ?? 0,
    shopItem: listItemsByCategory("equipment").find((item) => item.id === config.itemId)!,
  }))
}

export interface BattleItemRuntimeState {
  itemId: string
  effectType: BattleItemEffectType
  consumed: boolean
  /** 单次型效果是否已触发 */
  triggered: boolean
}

export function createBattleItemRuntime(selectedIds: string[]): BattleItemRuntimeState[] {
  return selectedIds
    .map((itemId) => {
      const config = getBattleItemConfig(itemId)
      if (!config) return null
      return {
        itemId,
        effectType: config.effectType,
        consumed: false,
        triggered: false,
      }
    })
    .filter((item): item is BattleItemRuntimeState => item !== null)
}

export function getUnusedBattleItems(state: BattleItemRuntimeState[]) {
  return state.filter((item) => !item.consumed)
}

export function markBattleItemConsumed(state: BattleItemRuntimeState[], itemId: string) {
  return state.map((item) => (item.itemId === itemId ? { ...item, consumed: true, triggered: true } : item))
}

export function markBattleItemTriggered(state: BattleItemRuntimeState[], itemId: string) {
  return state.map((item) => (item.itemId === itemId ? { ...item, triggered: true } : item))
}

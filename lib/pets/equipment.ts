import type { BattleEquipmentBonus } from "@/lib/battle/rules"

export type PetEquipmentSlot = "accessory" | "outfit" | "special"
export type PetEquipmentRarity = "common" | "rare" | "epic" | "legendary"

export interface PetEquipmentItem {
  id: string
  name: string
  type: PetEquipmentSlot
  rarity: PetEquipmentRarity
  emoji: string
  bonus: string
  atkPct?: number
  hpPct?: number
  allPct?: number
}

export interface PetEquipmentViewItem extends PetEquipmentItem {
  equipped: boolean
}

export const PET_EQUIPMENT_STORAGE_KEY = "ak_pet_equipment_v1"

export const PET_EQUIPMENT_LIBRARY: PetEquipmentItem[] = [
  {
    id: "lucky-scarf",
    name: "幸运围巾",
    type: "accessory",
    rarity: "rare",
    emoji: "🧣",
    bonus: "攻击 +6%",
    atkPct: 0.06,
  },
  {
    id: "sage-glasses",
    name: "智慧眼镜",
    type: "accessory",
    rarity: "epic",
    emoji: "👓",
    bonus: "攻击 +8%",
    atkPct: 0.08,
  },
  {
    id: "adventurer-cloak",
    name: "勇者披风",
    type: "outfit",
    rarity: "legendary",
    emoji: "🦸",
    bonus: "血量 +12%",
    hpPct: 0.12,
  },
  {
    id: "guardian-badge",
    name: "守护徽章",
    type: "special",
    rarity: "epic",
    emoji: "🛡️",
    bonus: "全属性 +5%",
    allPct: 0.05,
  },
]

const equipmentById = new Map(PET_EQUIPMENT_LIBRARY.map((item) => [item.id, item]))

export function getDefaultEquippedIds() {
  const defaultBySlot = new Map<PetEquipmentSlot, string>()
  for (const item of PET_EQUIPMENT_LIBRARY) {
    if (!defaultBySlot.has(item.type)) defaultBySlot.set(item.type, item.id)
  }
  return Array.from(defaultBySlot.values())
}

export function parseEquippedIds(input: unknown) {
  if (!Array.isArray(input)) return getDefaultEquippedIds()
  const filtered = input.filter((value): value is string => typeof value === "string" && equipmentById.has(value))
  if (filtered.length === 0) return getDefaultEquippedIds()
  const dedupedBySlot = new Map<PetEquipmentSlot, string>()
  for (const id of filtered) {
    const item = equipmentById.get(id)
    if (!item) continue
    if (!dedupedBySlot.has(item.type)) dedupedBySlot.set(item.type, id)
  }
  return Array.from(dedupedBySlot.values())
}

export function resolveEquippedEquipment(equippedIds: string[]): PetEquipmentViewItem[] {
  const equippedSet = new Set(parseEquippedIds(equippedIds))
  return PET_EQUIPMENT_LIBRARY.map((item) => ({
    ...item,
    equipped: equippedSet.has(item.id),
  }))
}

export function applyEquipSelection(currentEquippedIds: string[], nextEquipmentId: string) {
  const target = equipmentById.get(nextEquipmentId)
  if (!target) return parseEquippedIds(currentEquippedIds)
  const normalized = parseEquippedIds(currentEquippedIds)
  const next = normalized.filter((id) => {
    const item = equipmentById.get(id)
    return item?.type !== target.type
  })
  next.push(target.id)
  return parseEquippedIds(next)
}

export function resolveBattleBonusesFromEquipment(equippedIds: string[]): BattleEquipmentBonus[] {
  const normalized = parseEquippedIds(equippedIds)
  return normalized
    .map((id) => equipmentById.get(id))
    .filter((item): item is PetEquipmentItem => Boolean(item))
    .map((item) => ({
      slot: item.type,
      atkPct: item.atkPct,
      hpPct: item.hpPct,
      allPct: item.allPct,
    }))
}

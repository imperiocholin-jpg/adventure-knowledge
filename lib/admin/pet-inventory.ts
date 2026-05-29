import { findShopItem, PET_SHOP_ITEMS } from "@/lib/pets/shop"
import { normalizeInventory, type PetInventoryMap } from "@/lib/pets/state"

const KNOWN_ITEM_IDS = new Set(PET_SHOP_ITEMS.map((item) => item.id))

/** 将后台提交的仓库数据清洗为 { itemId: quantity } */
export function sanitizeAdminInventory(input: unknown): PetInventoryMap {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {}
  const map: PetInventoryMap = {}
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const itemId = key.trim()
    if (!itemId) continue
    const count = typeof value === "number" ? value : Number(value)
    if (!Number.isFinite(count) || count <= 0) continue
    map[itemId] = Math.min(9999, Math.floor(count))
  }
  return map
}

/** 保留库中未知 SKU（不在商城目录里），避免误删探索掉落等特殊道具 */
export function preserveUnknownInventoryKeys(next: PetInventoryMap, existing: PetInventoryMap) {
  const merged = { ...next }
  for (const [itemId, count] of Object.entries(existing)) {
    if (!KNOWN_ITEM_IDS.has(itemId) && count > 0 && merged[itemId] === undefined) {
      merged[itemId] = count
    }
  }
  return merged
}

export function readPetInventoryFromRow(row: Record<string, unknown>) {
  return normalizeInventory(
    row.pet_inventory ?? row.inventory ?? row.pet_loadout ?? row.pet_equipment_ids ?? row.equipment_ids,
  )
}

export function summarizeInventoryForAdmin(inventory: PetInventoryMap) {
  const entries = Object.entries(inventory)
    .filter(([, count]) => count > 0)
    .map(([itemId, count]) => {
      const item = findShopItem(itemId)
      return {
        itemId,
        count,
        name: item?.name ?? itemId,
        icon: item?.icon ?? "📦",
        category: item?.category ?? "unknown",
        known: Boolean(item),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))
  return entries
}

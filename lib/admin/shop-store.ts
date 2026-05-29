import { readJsonFile, writeJsonFile } from "@/lib/admin/file-store"
import { PET_SHOP_ITEMS, type PetShopItem } from "@/lib/pets/shop"

const SHOP_ITEMS_FILE = "data/admin/shop-items.json"

interface ShopItemsFile {
  items: PetShopItem[]
  updatedAt: string
}

let cache: { at: number; items: PetShopItem[] } | null = null
const CACHE_TTL_MS = 3000

export function invalidateShopItemsCache() {
  cache = null
}

export async function loadShopItems(): Promise<PetShopItem[]> {
  const now = Date.now()
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.items

  const file = await readJsonFile<ShopItemsFile | null>(SHOP_ITEMS_FILE, null)
  const items =
    file && Array.isArray(file.items) && file.items.length > 0 ? file.items : [...PET_SHOP_ITEMS]

  cache = { at: now, items }
  return items
}

export async function saveShopItems(items: PetShopItem[]) {
  await writeJsonFile(SHOP_ITEMS_FILE, {
    items,
    updatedAt: new Date().toISOString(),
  } satisfies ShopItemsFile)
  invalidateShopItemsCache()
}

export function findShopItemById(items: PetShopItem[], itemId: string) {
  return items.find((item) => item.id === itemId) ?? null
}

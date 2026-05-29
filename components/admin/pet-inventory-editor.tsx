"use client"

import { useMemo } from "react"

import { PET_SHOP_ITEMS, type PetShopCategory } from "@/lib/pets/shop"
import type { PetInventoryMap } from "@/lib/pets/state"

const CATEGORY_LABEL: Record<PetShopCategory, string> = {
  food: "食物",
  training: "训练",
  rest: "休息",
  toy: "玩具",
  equipment: "装备（对战）",
}

interface PetInventoryEditorProps {
  inventory: PetInventoryMap
  onChange: (next: PetInventoryMap) => void
}

function readCount(inventory: PetInventoryMap, itemId: string) {
  return inventory[itemId] ?? 0
}

export function PetInventoryEditor({ inventory, onChange }: PetInventoryEditorProps) {
  const grouped = useMemo(() => {
    const map = new Map<PetShopCategory, typeof PET_SHOP_ITEMS>()
    for (const item of PET_SHOP_ITEMS) {
      const list = map.get(item.category) ?? []
      list.push(item)
      map.set(item.category, list)
    }
    return map
  }, [])

  const unknownItems = useMemo(() => {
    const known = new Set(PET_SHOP_ITEMS.map((item) => item.id))
    return Object.entries(inventory).filter(([itemId, count]) => !known.has(itemId) && count > 0)
  }, [inventory])

  const ownedCount = useMemo(
    () => Object.values(inventory).filter((count) => count > 0).length,
    [inventory],
  )

  const setItemCount = (itemId: string, raw: string) => {
    const parsed = Number(raw)
    const next = { ...inventory }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      delete next[itemId]
    } else {
      next[itemId] = Math.min(9999, Math.floor(parsed))
    }
    onChange(next)
  }

  const clearAll = () => onChange({})

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          当前持有 <span className="font-medium text-slate-800">{ownedCount}</span> 种道具
        </p>
        <button
          type="button"
          onClick={clearAll}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
        >
          清空仓库
        </button>
      </div>

      {(Object.keys(CATEGORY_LABEL) as PetShopCategory[]).map((category) => {
        const items = grouped.get(category) ?? []
        if (items.length === 0) return null
        return (
          <div key={category}>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {CATEGORY_LABEL[category]}
            </h4>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm"
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate" title={item.name}>
                    {item.name}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={readCount(inventory, item.id) || ""}
                    placeholder="0"
                    onChange={(e) => setItemCount(item.id, e.target.value)}
                    className="w-16 rounded border border-slate-300 px-2 py-1 text-right text-sm"
                  />
                </label>
              ))}
            </div>
          </div>
        )
      })}

      {unknownItems.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">其他 / 未收录 SKU</h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {unknownItems.map(([itemId, count]) => (
              <li key={itemId} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
                <span className="font-mono text-xs">{itemId}</span>
                <span>×{count}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-slate-500">未收录道具保存时会保留，暂不支持在此编辑数量。</p>
        </div>
      )}
    </div>
  )
}

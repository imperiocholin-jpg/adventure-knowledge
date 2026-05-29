"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Coins, ShoppingBag } from "lucide-react"
import { PET_SHOP_ITEMS, type PetShopCategory } from "@/lib/pets/shop"

interface PetShopViewItem {
  id: string
  name: string
  category: PetShopCategory
  price: number
  icon: string
  description: string
  battleHint?: string
  owned: number
}

interface PetEquipmentProps {
  points?: number
  items?: PetShopViewItem[]
  onPurchase?: (itemId: string) => void
}

const categoryLabel: Record<PetShopCategory, string> = {
  food: "食物",
  toy: "玩耍",
  rest: "休息",
  training: "训练",
  equipment: "对战道具",
}

const categoryOrder: PetShopCategory[] = ["food", "toy", "rest", "training", "equipment"]

export function PetEquipment({
  points = 0,
  items = PET_SHOP_ITEMS.map((item) => ({ ...item, owned: 0 })),
  onPurchase,
}: PetEquipmentProps) {
  const [activeCategory, setActiveCategory] = useState<PetShopCategory>("food")

  const filteredItems = useMemo(
    () => items.filter((item) => item.category === activeCategory),
    [items, activeCategory],
  )

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/50 bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
              <ShoppingBag className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">宠物商城</h3>
              <p className="text-[11px] text-muted-foreground">购买后才能执行对应互动</p>
            </div>
          </div>
          <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <Coins className="mr-1 inline h-3.5 w-3.5" />
            积分 {points}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card p-2">
        <div className="grid grid-cols-5 gap-1">
          {categoryOrder.map((category) => {
            const isActive = activeCategory === category
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "rounded-xl px-2 py-2 text-xs font-semibold transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted",
                )}
              >
                {categoryLabel[category]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        {filteredItems.map((item) => {
          const canBuy = points >= item.price
          return (
            <div
              key={item.id}
              className="rounded-xl border border-border/60 bg-background/90 px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {categoryLabel[item.category]} · {item.description}
                    </p>
                    {item.category === "equipment" && item.battleHint && (
                      <p className="mt-1 text-[11px] font-medium text-violet-700">{item.battleHint}</p>
                    )}
                    <p className="mt-1 text-[11px] text-emerald-700">库存：{item.owned}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs font-semibold text-amber-700">{item.price} 积分</span>
                  <button
                    type="button"
                    disabled={!canBuy}
                    onClick={() => onPurchase?.(item.id)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                      canBuy
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    购买
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

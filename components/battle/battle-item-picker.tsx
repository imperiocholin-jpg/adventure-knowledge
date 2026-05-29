"use client"

import { cn } from "@/lib/utils"
import { Package, Sparkles } from "lucide-react"

export interface BattleItemPickerOption {
  itemId: string
  name: string
  icon: string
  owned: number
  triggerHint: string
  battleHint?: string
}

interface BattleItemPickerProps {
  items: BattleItemPickerOption[]
  selectedIds: string[]
  maxSelect?: number
  onChange: (ids: string[]) => void
}

export function BattleItemPicker({
  items,
  selectedIds,
  maxSelect = 2,
  onChange,
}: BattleItemPickerProps) {
  const toggle = (itemId: string) => {
    if (selectedIds.includes(itemId)) {
      onChange(selectedIds.filter((id) => id !== itemId))
      return
    }
    if (selectedIds.length >= maxSelect) return
    onChange([...selectedIds, itemId])
  }

  return (
    <div className="rounded-2xl border border-white/50 bg-white/90 p-4 shadow-lg backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-violet-600" />
          <span className="text-sm font-bold text-foreground">对战道具</span>
        </div>
        <span className="text-[11px] text-muted-foreground">最多选择 {maxSelect} 个</span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">仓库暂无对战道具，可先去宠物商城购买「装备」类道具。</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const selected = selectedIds.includes(item.itemId)
            const disabled = !selected && selectedIds.length >= maxSelect
            return (
              <button
                key={item.itemId}
                type="button"
                disabled={disabled}
                onClick={() => toggle(item.itemId)}
                className={cn(
                  "w-full rounded-xl border px-3 py-2.5 text-left transition-all",
                  selected
                    ? "border-violet-400 bg-violet-50 shadow-sm"
                    : "border-border/60 bg-background/80 hover:bg-muted/40",
                  disabled && "opacity-50",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-xl">{item.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <span className="text-[11px] font-medium text-emerald-700">x{item.owned}</span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-violet-700">
                      <Sparkles className="h-3 w-3 shrink-0" />
                      {item.triggerHint}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

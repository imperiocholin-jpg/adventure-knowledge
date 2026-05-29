"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { PetShopItem } from "@/lib/pets/shop"
import type { PetInventoryMap } from "@/lib/pets/state"

const ACTION_LABEL: Record<string, string> = {
  feed: "选择食物",
  train: "选择训练工具",
  sleep: "选择休息装备",
  play: "选择玩具",
}

interface PetInventoryPickerDialogProps {
  open: boolean
  action: "feed" | "train" | "sleep" | "play"
  items: PetShopItem[]
  inventory: PetInventoryMap
  onClose: () => void
  onSelect: (itemId: string) => void
}

export function PetInventoryPickerDialog({
  open,
  action,
  items,
  inventory,
  onClose,
  onSelect,
}: PetInventoryPickerDialogProps) {
  const owned = items.filter((item) => (inventory[item.id] ?? 0) > 0)

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{ACTION_LABEL[action] ?? "选择道具"}</DialogTitle>
          <DialogDescription>从仓库中选择要消耗的道具</DialogDescription>
        </DialogHeader>

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {owned.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
              onClick={() => onSelect(item.id)}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">{item.icon}</span>
                <span>
                  <span className="font-medium text-foreground">{item.name}</span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">{item.description}</span>
                </span>
              </span>
              <span className="text-xs font-semibold text-primary">×{inventory[item.id]}</span>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" className="w-full rounded-xl" onClick={onClose}>
            取消
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

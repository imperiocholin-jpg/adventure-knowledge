"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getBattleVitalCostPreview } from "@/lib/pets/battle-cost"
import type { PetVitalState } from "@/lib/pets/state"

interface BattleCostDialogProps {
  open: boolean
  modeTitle?: string
  vitals: PetVitalState
  isSubmitting?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

function VitalCostRow({
  label,
  before,
  cost,
  percent,
  after,
  accentClass,
}: {
  label: string
  before: number
  cost: number
  percent: number
  after: number
  accentClass: string
}) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${accentClass}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-xs font-semibold text-rose-600">
          -{cost}（{percent}%）
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          当前 <strong className="text-foreground">{before}</strong>
        </span>
        <span>→</span>
        <span>
          对战后 <strong className="text-foreground">{after}</strong>
        </span>
      </div>
    </div>
  )
}

export function BattleCostDialog({
  open,
  modeTitle,
  vitals,
  isSubmitting = false,
  onOpenChange,
  onConfirm,
}: BattleCostDialogProps) {
  const preview = getBattleVitalCostPreview(vitals)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>确认进入对战？</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left text-sm text-muted-foreground">
              <p>
                {modeTitle ? `「${modeTitle}」` : "本场对战"}开始前将消耗宠物状态（产品规则：满值 100 各扣 10%，即各
                -10 点）。亲密值本场不扣减。
              </p>
              <div className="space-y-2">
                <VitalCostRow
                  label="饱食度"
                  before={preview.satietyBefore}
                  cost={preview.satietyCost}
                  percent={preview.satietyPercent}
                  after={preview.satietyAfter}
                  accentClass="border-amber-100 bg-amber-50/80"
                />
                <VitalCostRow
                  label="精神值"
                  before={preview.spiritBefore}
                  cost={preview.spiritCost}
                  percent={preview.spiritPercent}
                  after={preview.spiritAfter}
                  accentClass="border-sky-100 bg-sky-50/80"
                />
              </div>
              {preview.satietyAfter <= 0 ? (
                <p className="text-xs font-medium text-rose-600">警告：对战后饱食度将为 0，宠物将进入离世状态。</p>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel disabled={isSubmitting}>取消</AlertDialogCancel>
          <AlertDialogAction
            disabled={isSubmitting}
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
          >
            {isSubmitting ? "处理中..." : "确认消耗并开始"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

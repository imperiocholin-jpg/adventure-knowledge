"use client"

import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface PetVitalStatBarsProps {
  satiety: number
  bond: number
  spirit: number
  level: number
  levelProgress: number
  companionDays?: number
  showCompanionDays?: boolean
  className?: string
  compact?: boolean
}

export const PET_CORE_VITAL_ROWS = [
  {
    key: "satiety",
    label: "饱食度",
    valueKey: "satiety" as const,
    bar: "from-amber-400 to-orange-400",
    bg: "bg-amber-100",
    text: "text-amber-700",
  },
  {
    key: "bond",
    label: "亲密值",
    valueKey: "bond" as const,
    bar: "from-pink-400 to-rose-400",
    bg: "bg-pink-100",
    text: "text-pink-700",
  },
  {
    key: "spirit",
    label: "精神值",
    valueKey: "spirit" as const,
    bar: "from-blue-400 to-indigo-500",
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
] as const

export interface VitalStatBarRowData {
  key: string
  label: string
  value: number
  bar: string
  bg: string
  text: string
}

export function PetVitalStatBarRow({
  row,
  compact = false,
  className,
}: {
  row: VitalStatBarRowData
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid items-center gap-x-1.5 rounded-xl bg-white/80 shadow-sm",
        compact
          ? "grid-cols-[2.75rem_minmax(0,1fr)_2rem] px-1 py-1"
          : "grid-cols-[3.25rem_minmax(0,1fr)_2.25rem] px-1.5 py-1.5",
        className,
      )}
    >
      <span className={cn("text-center font-semibold leading-none", row.text, compact ? "text-[10px]" : "text-[11px]")}>
        {row.label}
      </span>
      <div className={cn("relative h-2 min-w-0 overflow-hidden rounded-full", row.bg)}>
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", row.bar)}
          style={{ width: `${row.value}%` }}
        />
        {row.value > 0 && (
          <Sparkles
            className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-white/90 animate-pulse"
            style={{ left: `calc(${Math.max(4, Math.min(97, row.value))}% - 5px)` }}
          />
        )}
      </div>
      <span className={cn("text-right font-bold tabular-nums", row.text, compact ? "text-[10px]" : "text-[11px]")}>
        {row.value}%
      </span>
    </div>
  )
}

export function PetVitalStatBars({
  satiety,
  bond,
  spirit,
  level,
  levelProgress,
  companionDays,
  showCompanionDays = true,
  className,
  compact = false,
}: PetVitalStatBarsProps) {
  const values = { satiety, bond, spirit }
  const coreRows = PET_CORE_VITAL_ROWS.map((row) => ({
    key: row.key,
    label: row.label,
    value: values[row.valueKey],
    bar: row.bar,
    bg: row.bg,
    text: row.text,
  }))
  const levelRow: VitalStatBarRowData = {
    key: "level",
    label: `Lv. ${level}`,
    value: levelProgress,
    bar: "from-violet-400 to-purple-500",
    bg: "bg-violet-100",
    text: "text-violet-700",
  }

  return (
    <div className={cn("flex min-w-0 flex-1 flex-col", className)}>
      <div className={cn("space-y-1.5", compact && "space-y-1")}>
        {coreRows.map((row) => (
          <PetVitalStatBarRow key={row.key} row={row} compact={compact} />
        ))}
        <PetVitalStatBarRow row={levelRow} compact={compact} />
      </div>

      {showCompanionDays && companionDays !== undefined && (
        <div className="mt-1.5 flex justify-end">
          <div className="flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 shadow-sm">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span className="text-[10px] font-medium text-foreground">相伴 {companionDays} 天</span>
          </div>
        </div>
      )}
    </div>
  )
}

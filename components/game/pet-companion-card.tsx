"use client"

import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { PetAvatar } from "@/components/pets/pet-avatar"
import { PetMoodChip } from "@/components/pets/pet-mood-chip"
import {
  PET_CORE_VITAL_ROWS,
  PetVitalStatBarRow,
  type VitalStatBarRowData,
} from "@/components/pets/pet-vital-stat-bars"
import type { HomePetMood } from "@/lib/pets/state"

interface PetCompanionCardProps {
  petName: string
  petLevel?: number
  petMood: HomePetMood
  isDead?: boolean
  petEmoji: string
  petAvatarSrc?: string | null
  satiety: number
  bond: number
  spirit: number
  levelProgress: number
  companionDays?: number
  onClick?: () => void
}

const footerBadgeClass =
  "inline-flex h-6 items-center gap-1 rounded-full border px-2.5 text-[10px] font-semibold leading-none shadow-sm"

export function PetCompanionCard({
  petName = "毛毛",
  petLevel = 1,
  petMood = "happy",
  isDead = false,
  petEmoji = "🐕",
  petAvatarSrc = null,
  satiety = 80,
  bond = 100,
  spirit = 100,
  levelProgress = 0,
  companionDays = 28,
  onClick,
}: PetCompanionCardProps) {
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
    label: `Lv. ${petLevel}`,
    value: levelProgress,
    bar: "from-violet-400 to-purple-500",
    bg: "bg-violet-100",
    text: "text-violet-700",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border border-amber-100/80 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-50/70 p-3 text-left shadow-md",
        "transition-all duration-200 hover:border-primary/30 hover:shadow-lg active:scale-[0.99]",
      )}
    >
      {/* 照片顶对齐饱食度、底对齐精神值；名字在照片下；经验条单独一行 */}
      <div className="grid grid-cols-[5.75rem_minmax(0,1fr)] gap-x-3 gap-y-1">
        <PetAvatar
          src={petAvatarSrc}
          emoji={petEmoji}
          alt={`${petName}头像`}
          rounded="2xl"
          animate
          className="col-start-1 row-start-1 row-span-3 h-full w-[5.75rem] self-stretch border-2 border-white shadow-sm"
          imageClassName="object-cover object-top"
        />

        {coreRows.map((row, index) => (
          <PetVitalStatBarRow
            key={row.key}
            row={row}
            compact
            className={cn("col-start-2", index === 0 ? "row-start-1" : index === 1 ? "row-start-2" : "row-start-3")}
          />
        ))}

        <div className="col-start-1 row-start-4 flex w-[5.75rem] min-w-0 items-baseline justify-center gap-1 px-0.5">
          <span className="truncate text-sm font-bold text-foreground">{petName}</span>
          <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">Lv.{petLevel}</span>
        </div>

        <PetVitalStatBarRow row={levelRow} compact className="col-start-2 row-start-4" />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 pr-1">
        <PetMoodChip mood={petMood} deceased={isDead} size="md" />
        <span className={cn(footerBadgeClass, "border-transparent bg-white/80 text-foreground")}>
          <Sparkles className="h-3 w-3 shrink-0 text-amber-500" />
          相伴 {companionDays} 天
        </span>
      </div>
    </button>
  )
}

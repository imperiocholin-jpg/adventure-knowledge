"use client"

import { cn } from "@/lib/utils"
import type { HomePetMood } from "@/lib/pets/state"

export const HOME_PET_MOOD_CONFIG: Record<
  HomePetMood,
  { label: string; emoji: string; chip: string }
> = {
  happy: { label: "开心", emoji: "💖", chip: "bg-pink-50 text-pink-600 border-pink-200" },
  hungry: { label: "饥饿", emoji: "🍖", chip: "bg-orange-50 text-orange-600 border-orange-200" },
  bored: { label: "无聊", emoji: "😑", chip: "bg-amber-50 text-amber-700 border-amber-200" },
  sleepy: { label: "犯困", emoji: "😴", chip: "bg-blue-50 text-blue-600 border-blue-200" },
}

interface PetMoodChipProps {
  mood: HomePetMood
  /** 宠物已死亡时显示「离世」 */
  deceased?: boolean
  size?: "sm" | "md"
  className?: string
}

const sizeClass = {
  sm: "h-5 gap-0.5 px-2 text-[10px]",
  md: "h-6 gap-1 px-2.5 text-[10px]",
} as const

export function PetMoodChip({ mood, deceased = false, size = "md", className }: PetMoodChipProps) {
  if (deceased) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-full border border-slate-300 bg-slate-100 font-semibold leading-none text-slate-600 shadow-sm",
          sizeClass[size],
          className,
        )}
      >
        <span aria-hidden className={cn("leading-none", size === "sm" ? "text-[10px]" : "text-xs")}>
          🕯️
        </span>
        离世
      </span>
    )
  }

  const config = HOME_PET_MOOD_CONFIG[mood]

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border font-semibold leading-none shadow-sm",
        sizeClass[size],
        config.chip,
        className,
      )}
    >
      <span aria-hidden className={cn("leading-none", size === "sm" ? "text-[10px]" : "text-xs")}>
        {config.emoji}
      </span>
      {config.label}
    </span>
  )
}

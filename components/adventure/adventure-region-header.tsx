"use client"

import { ChevronLeft, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { PlayerStickyHeader } from "@/components/layout/player-page-shell"

interface AdventureRegionHeaderProps {
  regionName: string
  regionStars: number
  completedStages: number
  totalStages: number
}

export function AdventureRegionHeader({
  regionName,
  regionStars,
  completedStages,
  totalStages,
}: AdventureRegionHeaderProps) {
  const router = useRouter()

  return (
    <PlayerStickyHeader className="border-none bg-transparent">
      <div className="relative overflow-hidden px-4 pb-3 pt-2">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-200/60 via-sky-100/30 to-transparent" />

        <div className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/adventure")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70 shadow-sm backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="h-5 w-5 text-foreground/80" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
              <h1 className="truncate text-base font-bold text-foreground">{regionName}</h1>
            </div>
            <p className="text-[10px] text-muted-foreground">
              冒险之路 · 第 {Math.min(completedStages + 1, totalStages)} / {totalStages} 关 · 星星 {regionStars}
            </p>
          </div>
        </div>
      </div>
    </PlayerStickyHeader>
  )
}

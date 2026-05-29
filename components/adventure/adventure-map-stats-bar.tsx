"use client"

import Link from "next/link"
import { BookOpen, Gift, Globe, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { PLAYER_SHELL_MAX_CLASS } from "@/components/layout/player-page-shell"

interface AdventureMapStatsBarProps {
  totalStars: number
  worldProgress: number
  isProgressLoading?: boolean
  className?: string
}

export function AdventureMapStatsBar({
  totalStars,
  worldProgress,
  isProgressLoading = false,
  className,
}: AdventureMapStatsBarProps) {
  return (
    <div className={cn("relative z-50 px-3 -mb-4 translate-y-1", className)}>
      <div
        className={cn(
          "relative mx-auto flex items-center justify-between gap-1 rounded-2xl border border-border/50 bg-white/95 px-3 py-2.5 shadow-md backdrop-blur-md",
          PLAYER_SHELL_MAX_CLASS,
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
          <div className="min-w-0">
            <p className="text-[9px] text-muted-foreground">累计星星</p>
            <p className="text-sm font-bold leading-none text-foreground">{totalStars}</p>
          </div>
        </div>

        <div className="h-8 w-px shrink-0 bg-border/60" />

        <div className="flex min-w-0 flex-1 flex-col items-center">
          <div className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5 text-emerald-600" />
            <p className="text-[9px] text-muted-foreground">世界进度</p>
          </div>
          <div className="mt-0.5 flex w-full max-w-[5.5rem] items-center gap-1">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                style={{ width: `${Math.min(100, Math.max(0, worldProgress))}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-emerald-600">
              {worldProgress}%{isProgressLoading ? "…" : ""}
            </span>
          </div>
        </div>

        <div className="h-8 w-px shrink-0 bg-border/60" />

        <Link
          href="/adventure/collection"
          className="flex shrink-0 flex-col items-center gap-0.5 px-1 transition-opacity hover:opacity-80 active:scale-95"
        >
          <Gift className="h-4 w-4 text-amber-500" />
          <span className="text-[9px] font-medium text-muted-foreground">我的奖励</span>
        </Link>

        <Link
          href="/adventure/progress"
          className="flex shrink-0 flex-col items-center gap-0.5 px-1 transition-opacity hover:opacity-80 active:scale-95"
        >
          <BookOpen className="h-4 w-4 text-sky-500" />
          <span className="text-[9px] font-medium text-muted-foreground">冒险日志</span>
        </Link>
      </div>
    </div>
  )
}

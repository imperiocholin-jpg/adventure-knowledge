"use client"

import Link from "next/link"
import { Bell, ChevronLeft, Compass, Settings, Star, Sparkles } from "lucide-react"
import { PlayerStickyHeader } from "@/components/layout/player-page-shell"

interface AdventureMapHeaderProps {
  totalStars: number
  worldProgress: number
  isProgressLoading?: boolean
}

export function AdventureMapHeader({
  totalStars,
  worldProgress,
  isProgressLoading = false,
}: AdventureMapHeaderProps) {
  return (
    <PlayerStickyHeader className="border-none bg-transparent">
      <div className="relative overflow-hidden px-4 pb-3 pt-2">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-indigo-200/70 via-sky-100/40 to-transparent" />

        <div className="relative flex items-center justify-between">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 shadow-sm backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="h-5 w-5 text-foreground/80" />
          </Link>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md">
                <Compass className="h-3.5 w-3.5 text-white" />
              </div>
              <h1 className="bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-base font-bold text-transparent">
                冒险地图
              </h1>
            </div>
            <p className="text-[10px] text-muted-foreground/80">探索世界，开启主题冒险</p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/70 shadow-sm backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
            >
              <Bell className="h-4 w-4 text-foreground/70" />
              <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                2
              </span>
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 shadow-sm backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
            >
              <Settings className="h-4 w-4 text-foreground/70" />
            </button>
          </div>
        </div>

        <div className="relative mt-3 flex items-center justify-between gap-2 rounded-2xl border border-white/60 bg-white/50 px-3 py-2 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground">累计星星</p>
              <p className="text-sm font-bold leading-none text-amber-700">{totalStars}</p>
            </div>
          </div>

          <div className="h-8 w-px bg-white/80" />

          <div className="flex flex-1 flex-col items-center">
            <p className="text-[9px] text-muted-foreground">世界进度</p>
            <div className="mt-0.5 flex w-full max-w-[7rem] items-center gap-1.5">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, worldProgress))}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-emerald-700">
                {worldProgress}%
                {isProgressLoading ? "…" : ""}
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-white/80" />

          <div className="flex items-center gap-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground">状态</p>
              <p className="text-[11px] font-semibold leading-none text-emerald-700">探索中</p>
            </div>
          </div>
        </div>
      </div>
    </PlayerStickyHeader>
  )
}

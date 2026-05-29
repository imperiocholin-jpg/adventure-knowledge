"use client"

import { cn } from "@/lib/utils"
import {
  Star,
  Map,
  Trophy,
  Flame,
  Sparkles,
  Compass,
  Crown,
  Gem,
} from "lucide-react"
import { REGION_SHELF_CONFIG } from "@/lib/adventure/config"
import type { ProgressSectionRegionRow } from "@/lib/adventure/adventure-dashboard-client"

export type { ProgressSectionRegionRow } from "@/lib/adventure/adventure-dashboard-client"

interface ProgressSectionProps {
  className?: string
  onViewDetails?: () => void
  worldProgress?: number
  totalStars?: number
  adventureLevel?: number
  dailyStreak?: number
  regions?: ProgressSectionRegionRow[]
  isLoading?: boolean
}

export function ProgressSection({
  className,
  onViewDetails,
  worldProgress = 0,
  totalStars = 0,
  adventureLevel = 1,
  dailyStreak = 0,
  regions = [],
  isLoading = false,
}: ProgressSectionProps) {
  const stats = [
    {
      label: "世界进度",
      value: isLoading ? "—" : `${worldProgress}%`,
      icon: Compass,
      color: "text-emerald-500",
      bgGradient: "from-emerald-400/20 to-emerald-500/10",
      glowColor: "rgba(52,211,153,0.3)",
    },
    {
      label: "收集星星",
      value: isLoading ? "—" : String(totalStars),
      icon: Star,
      color: "text-amber-500",
      bgGradient: "from-amber-400/20 to-amber-500/10",
      glowColor: "rgba(251,191,36,0.3)",
    },
    {
      label: "冒险等级",
      value: isLoading ? "—" : `Lv.${adventureLevel}`,
      icon: Crown,
      color: "text-violet-500",
      bgGradient: "from-violet-400/20 to-violet-500/10",
      glowColor: "rgba(167,139,250,0.3)",
    },
    {
      label: "连续冒险",
      value: isLoading ? "—" : `${dailyStreak}天`,
      icon: Flame,
      color: "text-orange-500",
      bgGradient: "from-orange-400/20 to-orange-500/10",
      glowColor: "rgba(251,146,60,0.3)",
    },
  ]

  return (
    <div className={cn("px-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-md">
            <Map className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="text-sm font-bold text-foreground">冒险进度</h3>
        </div>
        <button
          type="button"
          onClick={onViewDetails}
          className="text-xs text-primary font-medium hover:underline"
        >
          详情
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className={cn(
                "relative flex flex-col items-center p-2.5 rounded-2xl overflow-hidden",
                `bg-gradient-to-br ${stat.bgGradient}`,
                "border border-white/60 shadow-sm",
              )}
            >
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-8 rounded-full blur-xl"
                style={{ backgroundColor: stat.glowColor }}
              />
              <div className="relative">
                <Icon className={cn("h-5 w-5 mb-1", stat.color)} />
                {stat.label === "收集星星" && (
                  <Sparkles className="absolute -top-1 -right-2 h-3 w-3 text-amber-300 animate-pulse" />
                )}
              </div>
              <span className="text-sm font-bold text-foreground relative">{stat.value}</span>
              <span className="text-[9px] text-muted-foreground relative">{stat.label}</span>
            </div>
          )
        })}
      </div>

      <div className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm rounded-2xl p-3 shadow-md border border-white/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-emerald-500/5 rounded-full blur-2xl" />

        <div className="relative flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-bold text-foreground">区域进度</span>
          </div>
          <div className="flex items-center gap-1">
            <Gem className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs font-semibold text-violet-600">
              {regions.length}/{Object.keys(REGION_SHELF_CONFIG).length}
            </span>
            <span className="text-[10px] text-muted-foreground">已解锁</span>
          </div>
        </div>

        <div className="space-y-2.5">
          {regions.length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-2">
              {isLoading ? "加载中…" : "完成挑战即可推进区域进度"}
            </p>
          ) : (
            regions.map((region) => (
              <div key={region.name} className="group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{region.icon}</span>
                  <span className="text-[11px] font-medium text-foreground flex-1">{region.name}</span>
                  <span className="text-[11px] font-bold text-foreground">{region.progress}%</span>
                </div>
                <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700 ease-out",
                      region.color,
                    )}
                    style={{ width: `${region.progress}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { BookOpen, Map, Star } from "lucide-react"

interface GrowthProgressProps {
  worldsExplored: number
  completedBooks: number
  collectedStars: number
  currentLevelXp: number
  nextLevelXp: number
  adventureLevel: number
}

export function GrowthProgress({
  worldsExplored = 0,
  completedBooks = 0,
  collectedStars = 0,
  currentLevelXp = 0,
  nextLevelXp = 100,
  adventureLevel = 1,
}: GrowthProgressProps) {
  const xpProgress = nextLevelXp > 0 ? Math.min(100, (currentLevelXp / nextLevelXp) * 100) : 0

  const adventureStats = [
    { icon: Map, label: "探索世界", value: worldsExplored, unit: "个", color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: BookOpen, label: "完成书籍", value: completedBooks, unit: "本", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: Star, label: "收集星星", value: collectedStars, unit: "", color: "text-amber-600", bg: "bg-amber-50" },
  ]

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">冒险等级 {adventureLevel}</span>
          <span className="text-xs text-muted-foreground">
            {currentLevelXp}/{nextLevelXp}
          </span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {adventureStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="flex flex-col items-center rounded-xl border border-border/40 bg-card px-2 py-2.5 shadow-sm"
            >
              <div className={`mb-1 flex h-7 w-7 items-center justify-center rounded-lg ${stat.bg}`}>
                <Icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {stat.value}
                {stat.unit ? <span className="text-[10px] font-normal text-muted-foreground">{stat.unit}</span> : null}
              </span>
              <span className="text-[10px] text-muted-foreground">{stat.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

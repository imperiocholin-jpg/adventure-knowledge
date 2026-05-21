"use client"

import { cn } from "@/lib/utils"
import { Flame, BookOpen, Map, Star } from "lucide-react"

interface GrowthProgressProps {
  readingStreak: number
  worldsExplored: number
  completedBooks: number
  collectedStars: number
  currentLevelXp: number
  nextLevelXp: number
  adventureLevel: number
}

export function GrowthProgress({
  readingStreak = 7,
  worldsExplored = 3,
  completedBooks = 12,
  collectedStars = 156,
  currentLevelXp = 680,
  nextLevelXp = 1000,
  adventureLevel = 12,
}: GrowthProgressProps) {
  const xpProgress = (currentLevelXp / nextLevelXp) * 100
  
  // Only 4 key stats in 2x2 grid
  const stats = [
    { icon: Flame, label: "连续阅读", value: readingStreak, unit: "天", color: "text-orange-500", bg: "bg-orange-50", highlight: readingStreak >= 7 },
    { icon: Map, label: "探索世界", value: worldsExplored, unit: "个", color: "text-emerald-500", bg: "bg-emerald-50" },
    { icon: BookOpen, label: "完成书籍", value: completedBooks, unit: "本", color: "text-blue-500", bg: "bg-blue-50" },
    { icon: Star, label: "收集星星", value: collectedStars, unit: "", color: "text-amber-500", bg: "bg-amber-50" },
  ]

  return (
    <div className="space-y-4">
      {/* Level progress - compact */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-foreground">冒险等级 {adventureLevel}</span>
          <span className="text-xs text-muted-foreground">{currentLevelXp}/{nextLevelXp}</span>
        </div>
        <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>
      
      {/* 2x2 Stats grid - cleaner, softer cards */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div 
              key={stat.label}
              className={cn(
                "relative flex items-center gap-3 p-4 rounded-2xl transition-all",
                stat.bg
              )}
            >
              {/* Highlight glow for streak */}
              {stat.highlight && (
                <div className="absolute inset-0 rounded-2xl ring-2 ring-orange-300 animate-pulse" />
              )}
              
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                stat.bg === "bg-orange-50" ? "bg-orange-100" :
                stat.bg === "bg-emerald-50" ? "bg-emerald-100" :
                stat.bg === "bg-blue-50" ? "bg-blue-100" : "bg-amber-100"
              )}>
                <Icon className={cn("h-5 w-5", stat.color)} />
              </div>
              
              <div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl font-bold text-foreground">{stat.value}</span>
                  {stat.unit && <span className="text-xs text-muted-foreground">{stat.unit}</span>}
                </div>
                <span className="text-[10px] text-muted-foreground">{stat.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

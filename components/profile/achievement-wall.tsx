"use client"

import { cn } from "@/lib/utils"
import { Trophy, Lock, Sparkles, ChevronRight } from "lucide-react"

interface Badge {
  id: string
  name: string
  icon: string
  rarity: "common" | "rare" | "epic" | "legendary"
  unlocked: boolean
}

interface AchievementWallProps {
  featuredBadges?: Badge[]
  totalUnlocked?: number
  totalBadges?: number
  onViewAll?: () => void
}

const defaultBadges: Badge[] = [
  { id: "1", name: "阅读启程", icon: "📖", rarity: "rare", unlocked: true },
  { id: "2", name: "连胜之王", icon: "🔥", rarity: "epic", unlocked: true },
  { id: "3", name: "传说收藏家", icon: "✨", rarity: "legendary", unlocked: false },
]

const rarityGlow = {
  common: "",
  rare: "ring-2 ring-blue-300/50",
  epic: "ring-2 ring-purple-300/50",
  legendary: "ring-2 ring-amber-400/60 shadow-lg shadow-amber-200/30",
}

export function AchievementWall({
  featuredBadges = defaultBadges,
  totalUnlocked = 4,
  totalBadges = 12,
  onViewAll,
}: AchievementWallProps) {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-bold text-foreground">成就徽章</span>
          <span className="text-xs text-muted-foreground">{totalUnlocked}/{totalBadges}</span>
        </div>
        
        <button 
          onClick={onViewAll}
          className="flex items-center gap-0.5 text-xs text-primary font-medium"
        >
          查看全部
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      
      {/* Horizontal scroll badge shelf - only 3 featured */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {featuredBadges.map((badge) => (
          <div 
            key={badge.id}
            className={cn(
              "relative flex-shrink-0 w-20 flex flex-col items-center p-3 rounded-xl transition-all",
              badge.unlocked 
                ? cn("bg-gradient-to-b from-white to-muted/30", rarityGlow[badge.rarity])
                : "bg-muted/50"
            )}
          >
            {/* Legendary shimmer */}
            {badge.unlocked && badge.rarity === "legendary" && (
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400/10 via-transparent to-amber-400/10 animate-pulse" />
            )}
            
            {/* Icon or silhouette */}
            <div className={cn(
              "relative text-3xl mb-1.5",
              !badge.unlocked && "opacity-30 blur-[1px]"
            )}>
              {badge.unlocked ? (
                <>
                  {badge.icon}
                  {(badge.rarity === "epic" || badge.rarity === "legendary") && (
                    <Sparkles className="absolute -top-1 -right-2 h-3 w-3 text-amber-400 animate-pulse" />
                  )}
                </>
              ) : (
                <Lock className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            
            {/* Name */}
            <span className={cn(
              "text-[10px] font-medium text-center line-clamp-1",
              badge.unlocked ? "text-foreground" : "text-muted-foreground"
            )}>
              {badge.unlocked ? badge.name : "???"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

"use client"

import { ChevronRight, Lock, Sparkles, Gift, Star, Crown, Gem, Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"

type RewardRarity = "rare" | "epic" | "legendary"

interface Reward {
  id: string
  name: string
  icon: string
  type: "pet" | "skin" | "badge" | "area" | "item" | "title"
  rarity: RewardRarity
  requirement: string
  progress: number
  unlocked: boolean
  description: string
}

const rarityStyles: Record<RewardRarity, {
  border: string
  bg: string
  glow: string
  shimmer: string
  badge: string
  aura: string
}> = {
  rare: {
    border: "border-blue-400",
    bg: "from-blue-100 via-cyan-50 to-blue-50",
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.25)]",
    shimmer: "before:bg-gradient-to-r before:from-transparent before:via-blue-300/40 before:to-transparent",
    badge: "from-blue-500 to-cyan-500",
    aura: "",
  },
  epic: {
    border: "border-purple-400",
    bg: "from-purple-100 via-pink-50 to-purple-50",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.35)]",
    shimmer: "before:bg-gradient-to-r before:from-transparent before:via-purple-300/50 before:to-transparent",
    badge: "from-purple-500 to-pink-500",
    aura: "after:absolute after:inset-0 after:rounded-2xl after:bg-purple-400/20 after:blur-lg after:-z-10",
  },
  legendary: {
    border: "border-amber-400",
    bg: "from-amber-100 via-yellow-50 to-orange-50",
    glow: "shadow-[0_0_25px_rgba(251,191,36,0.45)]",
    shimmer: "before:bg-gradient-to-r before:from-transparent before:via-amber-300/60 before:to-transparent",
    badge: "from-amber-400 via-yellow-400 to-orange-500",
    aura: "after:absolute after:inset-0 after:rounded-2xl after:bg-amber-400/25 after:blur-lg after:-z-10 after:animate-pulse",
  },
}

const sampleRewards: Reward[] = [
  { 
    id: "1", 
    name: "星空精灵", 
    icon: "✨", 
    type: "pet", 
    rarity: "legendary", 
    requirement: "完成《小王子》", 
    progress: 100, 
    unlocked: true,
    description: "来自遥远星球的神秘生物"
  },
  { 
    id: "2", 
    name: "魔法斗篷", 
    icon: "🧥", 
    type: "skin", 
    rarity: "epic", 
    requirement: "收集30颗星星", 
    progress: 60, 
    unlocked: false,
    description: "隐身于黑夜的神奇披风"
  },
  { 
    id: "3", 
    name: "阅读达人", 
    icon: "🏅", 
    type: "title", 
    rarity: "rare", 
    requirement: "连续阅读7天", 
    progress: 85, 
    unlocked: false,
    description: "展示你的阅读成就"
  },
  { 
    id: "4", 
    name: "神秘岛屿", 
    icon: "🏝️", 
    type: "area", 
    rarity: "legendary", 
    requirement: "完成5本史诗书籍", 
    progress: 40, 
    unlocked: false,
    description: "隐藏的冒险新大陆"
  },
  { 
    id: "5", 
    name: "龙蛋", 
    icon: "🥚", 
    type: "item", 
    rarity: "epic", 
    requirement: "解锁3个世界", 
    progress: 66, 
    unlocked: false,
    description: "沉睡的远古生命"
  },
]

interface UnlockableRewardsProps {
  onRewardClick?: (rewardId: string) => void
  onViewAll?: () => void
}

export function UnlockableRewards({ onRewardClick, onViewAll }: UnlockableRewardsProps) {
  const typeLabels: Record<string, { label: string, icon: typeof Gift }> = {
    pet: { label: "神奇宠物", icon: Sparkles },
    skin: { label: "魔法装扮", icon: Wand2 },
    badge: { label: "荣耀徽章", icon: Crown },
    area: { label: "秘境地图", icon: Gem },
    item: { label: "神秘道具", icon: Gift },
    title: { label: "称号", icon: Crown },
  }

  const unlockedCount = sampleRewards.filter(r => r.unlocked).length

  return (
    <div className="px-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
            <Gift className="h-4 w-4 text-white" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse opacity-40 blur-sm" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">神秘宝藏</h2>
            <p className="text-[10px] text-muted-foreground">已解锁 {unlockedCount}/{sampleRewards.length} 件宝物</p>
          </div>
        </div>
        <button 
          onClick={onViewAll}
          className="flex items-center gap-0.5 text-xs text-primary font-medium hover:underline"
        >
          宝库 <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Rewards horizontal scroll - magical artifacts */}
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
        {sampleRewards.map((reward) => {
          const style = rarityStyles[reward.rarity]
          const TypeIcon = typeLabels[reward.type].icon
          
          return (
            <button
              key={reward.id}
              onClick={() => onRewardClick?.(reward.id)}
              className={cn(
                "relative flex-shrink-0 w-36 rounded-2xl border-2 overflow-hidden transition-all duration-300",
                `bg-gradient-to-b ${style.bg}`,
                style.border,
                reward.unlocked ? style.glow : "",
                style.aura,
                "hover:scale-105 active:scale-95"
              )}
            >
              {/* Shimmer effect */}
              {reward.unlocked && (
                <div className={cn(
                  "absolute inset-0 overflow-hidden before:absolute before:inset-0 before:animate-shimmer-slow",
                  style.shimmer
                )} />
              )}
              
              {/* Rarity top bar */}
              <div className={cn(
                "h-1.5 bg-gradient-to-r",
                style.badge,
                reward.rarity === "legendary" && "shadow-[0_2px_8px_rgba(251,191,36,0.5)]"
              )} />

              {/* Content */}
              <div className="relative p-3">
                {/* Icon - artifact style */}
                <div className={cn(
                  "relative w-14 h-14 mx-auto mb-2 rounded-2xl flex items-center justify-center",
                  "bg-white/70 backdrop-blur-sm border border-white/50",
                  !reward.unlocked && "grayscale opacity-60"
                )}>
                  <span className="text-3xl drop-shadow-lg">{reward.icon}</span>
                  
                  {/* Status indicator */}
                  {reward.unlocked ? (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <Star className="h-3 w-3 text-white fill-white" />
                    </div>
                  ) : (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center border-2 border-white">
                      <Lock className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                  
                  {/* Floating particles for legendary unlocked */}
                  {reward.unlocked && reward.rarity === "legendary" && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {[...Array(4)].map((_, i) => (
                        <Sparkles 
                          key={i} 
                          className="absolute h-2 w-2 text-amber-400 animate-twinkle"
                          style={{
                            top: `${20 + (i % 2) * 60}%`,
                            left: `${20 + Math.floor(i / 2) * 60}%`,
                            animationDelay: `${i * 0.3}s`
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Name */}
                <p className="text-xs font-bold text-foreground text-center mb-0.5">{reward.name}</p>
                
                {/* Type badge */}
                <div className="flex items-center justify-center gap-1 mb-2">
                  <TypeIcon className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground">{typeLabels[reward.type].label}</span>
                </div>

                {/* Progress or unlocked status */}
                {reward.unlocked ? (
                  <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-700">已获得</span>
                  </div>
                ) : (
                  <div>
                    <div className="h-2 rounded-full bg-gray-200/80 overflow-hidden mb-1">
                      <div
                        className={cn(
                          "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                          style.badge,
                          reward.rarity === "legendary" && "shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                        )}
                        style={{ width: `${reward.progress}%` }}
                      />
                    </div>
                    <p className="text-[8px] text-muted-foreground text-center">{reward.requirement}</p>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes shimmer-slow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        :global(.animate-twinkle) { animation: twinkle 2s ease-in-out infinite; }
        :global(.animate-shimmer-slow)::before { animation: shimmer-slow 3s infinite; }
      `}</style>
    </div>
  )
}

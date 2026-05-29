"use client"

import { Lock, Sparkles, Gift, Star, Crown, Gem, Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TreasureListItem, TreasureRarity } from "@/lib/treasures/types"

const rarityStyles: Record<
  TreasureRarity,
  {
    border: string
    bg: string
    glow: string
    shimmer: string
    badge: string
    aura: string
  }
> = {
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

const typeLabels: Record<string, { label: string; icon: typeof Gift }> = {
  pet: { label: "神奇宠物", icon: Sparkles },
  skin: { label: "魔法装扮", icon: Wand2 },
  badge: { label: "荣耀徽章", icon: Crown },
  area: { label: "秘境地图", icon: Gem },
  item: { label: "神秘道具", icon: Gift },
  title: { label: "称号", icon: Crown },
}

interface TreasureRewardListProps {
  rewards: TreasureListItem[]
  onRewardClick?: (rewardId: string) => void
  layout?: "scroll" | "grid"
}

export function TreasureRewardList({
  rewards,
  onRewardClick,
  layout = "scroll",
}: TreasureRewardListProps) {
  const containerClass =
    layout === "grid"
      ? "grid grid-cols-2 gap-3"
      : "flex gap-3 overflow-x-auto pb-3 scrollbar-hide"

  const cardWidthClass = layout === "grid" ? "w-full" : "flex-shrink-0 w-36"

  return (
    <>
      <div className={containerClass}>
        {rewards.map((reward) => {
          const style = rarityStyles[reward.rarity]
          const TypeIcon = typeLabels[reward.type]?.icon ?? Gift
          const typeLabel = typeLabels[reward.type]?.label ?? "宝藏"

          return (
            <button
              key={reward.id}
              type="button"
              onClick={() => onRewardClick?.(reward.id)}
              className={cn(
                "relative rounded-2xl border-2 overflow-hidden transition-all duration-300",
                cardWidthClass,
                `bg-gradient-to-b ${style.bg}`,
                style.border,
                reward.unlocked ? style.glow : "",
                style.aura,
                "hover:scale-[1.02] active:scale-[0.98]",
              )}
            >
              {reward.unlocked && (
                <div
                  className={cn(
                    "absolute inset-0 overflow-hidden before:absolute before:inset-0 before:animate-shimmer-slow",
                    style.shimmer,
                  )}
                />
              )}

              <div className={cn("h-1.5 bg-gradient-to-r", style.badge)} />

              <div className="relative p-3">
                <div
                  className={cn(
                    "relative w-14 h-14 mx-auto mb-2 rounded-2xl flex items-center justify-center",
                    "bg-white/70 backdrop-blur-sm border border-white/50",
                    !reward.unlocked && "grayscale opacity-60",
                    layout === "grid" && "w-16 h-16",
                  )}
                >
                  <span className={cn("text-3xl drop-shadow-lg", layout === "grid" && "text-4xl")}>
                    {reward.icon}
                  </span>

                  {reward.unlocked ? (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <Star className="h-3 w-3 text-white fill-white" />
                    </div>
                  ) : (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center border-2 border-white">
                      <Lock className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>

                <p className="text-xs font-bold text-foreground text-center mb-0.5">{reward.name}</p>

                <div className="flex items-center justify-center gap-1 mb-2">
                  <TypeIcon className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground">{typeLabel}</span>
                </div>

                {layout === "grid" && (
                  <p className="text-[10px] text-muted-foreground text-center mb-2 line-clamp-2">
                    {reward.description}
                  </p>
                )}

                {reward.unlocked ? (
                  <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-700">已获得</span>
                  </div>
                ) : (
                  <div>
                    <div className="h-2 rounded-full bg-gray-200/80 overflow-hidden mb-1">
                      <div
                        className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", style.badge)}
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

      <style jsx>{`
        @keyframes shimmer-slow {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        :global(.animate-shimmer-slow)::before {
          animation: shimmer-slow 3s infinite;
        }
      `}</style>
    </>
  )
}

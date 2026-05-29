"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Heart, Dumbbell, Gamepad2, Sparkles, Palette, Gift, Utensils, Stars, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PetFloatingHint } from "@/components/pets/pet-floating-hint"

interface PetActionsProps {
  canEvolve?: boolean
  feedCooldown?: number
  trainCooldown?: number
  onFeed?: () => void
  onTrain?: () => void
  onPlay?: () => void
  onEvolve?: () => void
  onCustomize?: () => void
}

export function PetActions({
  canEvolve = false,
  feedCooldown = 0,
  trainCooldown = 0,
  onFeed,
  onTrain,
  onPlay,
  onEvolve,
  onCustomize,
}: PetActionsProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [showReward, setShowReward] = useState<{ type: string; value: string } | null>(null)

  const actions = [
    {
      id: "feed",
      label: "喂养",
      icon: Utensils,
      color: "from-pink-500 to-rose-400",
      bgColor: "bg-gradient-to-br from-pink-50 to-rose-50",
      borderColor: "border-pink-200/50",
      textColor: "text-pink-600",
      reward: "+20 饱食度",
      rewardIcon: "🍖",
      cooldown: feedCooldown,
      onClick: onFeed,
    },
    {
      id: "train",
      label: "训练",
      icon: Dumbbell,
      color: "from-emerald-500 to-green-400",
      bgColor: "bg-gradient-to-br from-emerald-50 to-green-50",
      borderColor: "border-emerald-200/50",
      textColor: "text-emerald-600",
      reward: "+50 经验",
      rewardIcon: "⭐",
      cooldown: trainCooldown,
      onClick: onTrain,
    },
    {
      id: "play",
      label: "玩耍",
      icon: Gamepad2,
      color: "from-violet-500 to-purple-400",
      bgColor: "bg-gradient-to-br from-violet-50 to-purple-50",
      borderColor: "border-violet-200/50",
      textColor: "text-violet-600",
      reward: "+15 心情",
      rewardIcon: "🎮",
      cooldown: 0,
      onClick: onPlay,
    },
    {
      id: "customize",
      label: "装扮",
      icon: Palette,
      color: "from-amber-500 to-orange-400",
      bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
      borderColor: "border-amber-200/50",
      textColor: "text-amber-600",
      reward: "更换造型",
      rewardIcon: "👗",
      cooldown: 0,
      onClick: onCustomize,
    },
  ]

  const handleAction = (action: typeof actions[0]) => {
    if (action.cooldown > 0) return
    setActiveAction(action.id)
    setShowReward({ type: action.rewardIcon, value: action.reward })
    action.onClick?.()
    
    setTimeout(() => setActiveAction(null), 400)
    setTimeout(() => setShowReward(null), 1500)
  }

  return (
    <div className="relative rounded-2xl bg-card/80 backdrop-blur-sm p-4 shadow-lg border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-400/10">
            <Gift className="h-4 w-4 text-amber-500" />
          </div>
          <h3 className="font-bold text-foreground">互动操作</h3>
        </div>
        <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
          点击照顾伙伴
        </span>
      </div>

      {/* Floating reward notification */}
      {showReward && (
        <PetFloatingHint
          text={`${showReward.type} ${showReward.value}`}
          className="top-12"
        />
      )}

      {/* Action buttons grid */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          const isActive = activeAction === action.id
          const isOnCooldown = action.cooldown > 0

          return (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              disabled={isOnCooldown}
              className={cn(
                "relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200",
                action.bgColor,
                action.borderColor,
                isActive && "scale-90",
                isOnCooldown 
                  ? "opacity-50 cursor-not-allowed" 
                  : "hover:scale-[1.02] hover:shadow-lg active:scale-95"
              )}
            >
              {/* Icon with animated background */}
              <div className={cn(
                "relative flex items-center justify-center w-14 h-14 rounded-2xl",
                "bg-gradient-to-br shadow-lg",
                action.color
              )}>
                <Icon className="h-7 w-7 text-white" strokeWidth={2} />
                
                {/* Pulse ring on active */}
                {isActive && (
                  <>
                    <div className={cn(
                      "absolute inset-0 rounded-2xl bg-gradient-to-br animate-ping opacity-50",
                      action.color
                    )} />
                    <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-300 animate-spin" />
                  </>
                )}
                
                {/* Shine effect */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 -translate-x-full animate-shine" />
                </div>
              </div>
              
              {/* Label */}
              <span className={cn("text-sm font-bold", action.textColor)}>
                {action.label}
              </span>
              
              {/* Reward description */}
              <span className="text-[10px] text-muted-foreground">
                {isOnCooldown ? `${action.cooldown}s 后可用` : action.reward}
              </span>

              {/* Cooldown overlay */}
              {isOnCooldown && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/5 backdrop-blur-[1px]">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold text-foreground/40">{action.cooldown}</span>
                    <span className="text-[10px] text-foreground/40">秒</span>
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Evolution button */}
      <div className="mt-4">
        <Button
          onClick={onEvolve}
          disabled={!canEvolve}
          className={cn(
            "w-full h-14 rounded-2xl font-bold text-base transition-all duration-300 relative overflow-hidden",
            canEvolve 
              ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-600 hover:via-orange-600 hover:to-amber-600 text-white shadow-[0_4px_20px_rgba(251,191,36,0.4)] hover:shadow-[0_6px_30px_rgba(251,191,36,0.5)] hover:scale-[1.02]"
              : "bg-muted text-muted-foreground"
          )}
        >
          {canEvolve && (
            <>
              {/* Animated stars */}
              <Stars className="absolute left-4 h-5 w-5 animate-pulse" />
              <Stars className="absolute right-4 h-5 w-5 animate-pulse" style={{ animationDelay: "0.5s" }} />
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shine" />
            </>
          )}
          <span className="relative flex items-center justify-center gap-2">
            <Zap className={cn("h-5 w-5", canEvolve && "animate-pulse")} />
            {canEvolve ? "立即进化!" : "条件不足"}
          </span>
        </Button>
        
        {!canEvolve && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            达到指定等级后可进化
          </p>
        )}
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shine {
          animation: shine 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

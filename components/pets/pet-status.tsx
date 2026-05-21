"use client"

import { cn } from "@/lib/utils"
import { Heart, Zap, Smile, Apple, Sparkles, TrendingUp } from "lucide-react"

interface PetStatusProps {
  hp: number
  maxHp: number
  energy: number
  maxEnergy: number
  happiness: number
  hunger: number
  experience: number
  expToNextLevel: number
}

export function PetStatus({
  hp = 85,
  maxHp = 100,
  energy = 70,
  maxEnergy = 100,
  happiness = 90,
  hunger = 60,
  experience = 750,
  expToNextLevel = 1000,
}: PetStatusProps) {
  const stats = [
    {
      id: "hp",
      label: "生命值",
      icon: Heart,
      value: hp,
      max: maxHp,
      color: "from-rose-500 to-pink-400",
      iconColor: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
    {
      id: "energy",
      label: "体力",
      icon: Zap,
      value: energy,
      max: maxEnergy,
      color: "from-amber-500 to-yellow-400",
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      id: "happiness",
      label: "心情",
      icon: Smile,
      value: happiness,
      max: 100,
      color: "from-pink-500 to-rose-400",
      iconColor: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      id: "hunger",
      label: "饱食度",
      icon: Apple,
      value: hunger,
      max: 100,
      color: "from-emerald-500 to-green-400",
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ]

  const expPercent = Math.round((experience / expToNextLevel) * 100)

  return (
    <div className="relative rounded-2xl bg-card/80 backdrop-blur-sm p-4 shadow-lg border border-white/20">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-bold text-foreground">伙伴状态</h3>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          const percent = Math.round((stat.value / stat.max) * 100)
          const isLow = percent < 30
          
          return (
            <div 
              key={stat.id}
              className={cn(
                "relative rounded-xl p-3 transition-all duration-300",
                stat.bgColor,
                isLow && "animate-pulse"
              )}
            >
              {/* Stat header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Icon className={cn("h-4 w-4", stat.iconColor, isLow && "animate-bounce")} />
                  <span className="text-xs font-medium text-foreground">{stat.label}</span>
                </div>
                <span className={cn(
                  "text-xs font-bold",
                  isLow ? "text-destructive" : "text-foreground"
                )}>
                  {stat.value}/{stat.max}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                    stat.color
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
              
              {/* Low warning indicator */}
              {isLow && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive animate-ping" />
              )}
            </div>
          )
        })}
      </div>

      {/* Experience bar */}
      <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-medium text-foreground">经验值</span>
          </div>
          <span className="text-xs font-bold text-purple-600">
            {experience.toLocaleString()}/{expToNextLevel.toLocaleString()}
          </span>
        </div>
        
        <div className="relative h-3 rounded-full bg-muted/50 overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-purple-500/20 animate-shimmer" />
          
          {/* Progress */}
          <div 
            className="relative h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${expPercent}%` }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />
          </div>
        </div>
        
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          还需 {(expToNextLevel - experience).toLocaleString()} 经验升级
        </p>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
        .animate-shine {
          animation: shine 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

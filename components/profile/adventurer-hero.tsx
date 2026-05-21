"use client"

import { cn } from "@/lib/utils"
import { 
  Sparkles, MapPin, Crown, Shield
} from "lucide-react"

interface AdventurerHeroProps {
  avatar?: string
  username: string
  adventureTitle: string
  level: number
  currentWorld: string
  rankBadge: "bronze" | "silver" | "gold" | "diamond" | "master"
}

const rankConfig = {
  bronze: {
    label: "青铜冒险家",
    gradient: "from-amber-600 to-amber-800",
    bgGradient: "from-amber-600/20 to-amber-800/20",
    icon: Shield,
  },
  silver: {
    label: "白银探索者",
    gradient: "from-gray-300 to-gray-500",
    bgGradient: "from-gray-300/20 to-gray-500/20",
    icon: Shield,
  },
  gold: {
    label: "黄金守护者",
    gradient: "from-amber-400 to-yellow-500",
    bgGradient: "from-amber-400/20 to-yellow-500/20",
    icon: Crown,
  },
  diamond: {
    label: "钻石传说",
    gradient: "from-cyan-300 to-blue-500",
    bgGradient: "from-cyan-300/20 to-blue-500/20",
    icon: Crown,
  },
  master: {
    label: "至尊大师",
    gradient: "from-purple-400 via-pink-400 to-amber-400",
    bgGradient: "from-purple-400/20 via-pink-400/20 to-amber-400/20",
    icon: Crown,
  },
}

export function AdventurerHero({
  avatar,
  username = "小冒险家",
  adventureTitle = "森林守护者",
  level = 12,
  currentWorld = "魔法森林",
  rankBadge = "gold",
}: AdventurerHeroProps) {
  const config = rankConfig[rankBadge]
  const RankIcon = config.icon

  return (
    <div className="relative overflow-hidden">
      {/* Layered fantasy background - softer gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500" />
      
      {/* Decorative light orbs */}
      <div className="absolute top-4 right-8 w-32 h-32 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-0 left-4 w-24 h-24 rounded-full bg-pink-300/20 blur-2xl" />
      
      {/* Subtle stars */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/50 animate-pulse"
            style={{
              width: `${2}px`,
              height: `${2}px`,
              left: `${15 + (i * 10)}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>
      
      {/* Content */}
      <div className="relative px-6 pt-10 pb-8">
        {/* Centered layout for better visual balance */}
        <div className="flex flex-col items-center text-center">
          {/* Avatar with magical frame - centered and prominent */}
          <div className="relative mb-4">
            {/* Outer glow ring */}
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-300/60 via-white/40 to-pink-300/60 blur-md animate-pulse" />
            
            {/* Avatar container */}
            <div className="relative w-24 h-24 rounded-full bg-white/25 backdrop-blur-sm border-3 border-white/60 flex items-center justify-center overflow-hidden shadow-xl">
              {avatar ? (
                <img src={avatar} alt={username} className="w-full h-full object-cover" />
              ) : (
                <div className="text-5xl">👦</div>
              )}
            </div>
            
            {/* Level badge - positioned nicely */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg border-2 border-white/50">
              Lv.{level}
            </div>
          </div>
          
          {/* Identity info - centered with better spacing */}
          <div className="mt-2">
            <h1 className="text-2xl font-bold text-white drop-shadow-lg tracking-wide">{username}</h1>
            
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <Sparkles className="h-4 w-4 text-amber-200" />
              <span className="text-sm font-medium text-white/95">{adventureTitle}</span>
            </div>
            
            {/* Current world */}
            <div className="flex items-center justify-center gap-1.5 mt-1.5 text-white/75">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-xs">{currentWorld}</span>
            </div>
          </div>
          
          {/* Rank badge - elegant pill style */}
          <div className="mt-5">
            <div className={cn(
              "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-xl",
              "bg-white/20 backdrop-blur-md border border-white/30",
              "text-white"
            )}>
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center",
                `bg-gradient-to-r ${config.gradient}`
              )}>
                <RankIcon className="h-3.5 w-3.5 text-white" />
              </div>
              <span>{config.label}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

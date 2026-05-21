"use client"

import { cn } from "@/lib/utils"
import { 
  Star, 
  Map, 
  Trophy, 
  Flame,
  Sparkles,
  TrendingUp,
  Compass,
  Crown,
  Gem
} from "lucide-react"

interface ProgressSectionProps {
  className?: string
  onViewDetails?: () => void
}

const stats = [
  { 
    label: "探索进度", 
    value: "32%", 
    icon: Compass, 
    color: "text-emerald-500",
    bgGradient: "from-emerald-400/20 to-emerald-500/10",
    glowColor: "rgba(52,211,153,0.3)",
    progress: 32
  },
  { 
    label: "收集星星", 
    value: "127", 
    icon: Star, 
    color: "text-amber-500",
    bgGradient: "from-amber-400/20 to-amber-500/10",
    glowColor: "rgba(251,191,36,0.3)"
  },
  { 
    label: "冒险等级", 
    value: "Lv.8", 
    icon: Crown, 
    color: "text-violet-500",
    bgGradient: "from-violet-400/20 to-violet-500/10",
    glowColor: "rgba(167,139,250,0.3)"
  },
  { 
    label: "连续冒险", 
    value: "5天", 
    icon: Flame, 
    color: "text-orange-500",
    bgGradient: "from-orange-400/20 to-orange-500/10",
    glowColor: "rgba(251,146,60,0.3)"
  },
]

const unlockedRegions = [
  { name: "魔法森林", progress: 75, color: "bg-gradient-to-r from-emerald-400 to-emerald-600", icon: "🌲" },
  { name: "冰雪之巅", progress: 40, color: "bg-gradient-to-r from-cyan-400 to-blue-500", icon: "❄️" },
  { name: "远古沙漠", progress: 20, color: "bg-gradient-to-r from-amber-400 to-orange-500", icon: "☀️" },
]

export function ProgressSection({ className, onViewDetails }: ProgressSectionProps) {
  return (
    <div className={cn("px-4", className)}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-md">
            <Map className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="text-sm font-bold text-foreground">冒险进度</h3>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="text-[10px] font-semibold text-emerald-600">+12%</span>
          </div>
        </div>
        <button 
          onClick={onViewDetails}
          className="text-xs text-primary font-medium hover:underline"
        >
          详情
        </button>
      </div>
      
      {/* Stats grid - enhanced with glows */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className={cn(
                "relative flex flex-col items-center p-2.5 rounded-2xl overflow-hidden",
                `bg-gradient-to-br ${stat.bgGradient}`,
                "border border-white/60 shadow-sm"
              )}
            >
              {/* Subtle glow */}
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-8 rounded-full blur-xl"
                style={{ backgroundColor: stat.glowColor }}
              />
              
              <div className="relative">
                <Icon className={cn("h-5 w-5 mb-1", stat.color)} />
                {/* Sparkle on star */}
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
      
      {/* World mastery card */}
      <div className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm rounded-2xl p-3 shadow-md border border-white/60 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-emerald-500/5 rounded-full blur-2xl" />
        
        <div className="relative flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-bold text-foreground">世界征服进度</span>
          </div>
          <div className="flex items-center gap-1">
            <Gem className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs font-semibold text-violet-600">3/6</span>
            <span className="text-[10px] text-muted-foreground">区域</span>
          </div>
        </div>
        
        {/* Region progress bars */}
        <div className="space-y-2.5">
          {unlockedRegions.map((region, index) => (
            <div key={index} className="group">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{region.icon}</span>
                <span className="text-[11px] font-medium text-foreground flex-1">{region.name}</span>
                <span className="text-[11px] font-bold text-foreground">{region.progress}%</span>
              </div>
              <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    region.color
                  )}
                  style={{ width: `${region.progress}%` }}
                />
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer_1s_ease-out]" />
                
                {/* Progress markers */}
                {[25, 50, 75].map(mark => (
                  <div 
                    key={mark}
                    className="absolute top-0 bottom-0 w-px bg-white/50"
                    style={{ left: `${mark}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Next unlock hint - enhanced */}
        <div className="mt-3 pt-3 border-t border-gray-100/80">
          <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl border border-violet-500/20">
            <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-violet-500" />
            </div>
            <p className="text-[10px] text-muted-foreground flex-1">
              完成<span className="text-primary font-semibold mx-0.5">魔法森林</span>即可解锁
              <span className="text-violet-500 font-semibold mx-0.5">天空王国</span>
            </p>
            <div className="text-[10px] font-bold text-violet-500">25%</div>
          </div>
        </div>
      </div>
      
      {/* CSS */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

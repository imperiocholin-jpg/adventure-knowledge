"use client"

import { cn } from "@/lib/utils"
import { 
  Star, 
  Lock, 
  Gift, 
  Swords, 
  BookOpen,
  Crown,
  Sparkles,
  Check,
  Eye,
  Gem,
  Zap
} from "lucide-react"

type StageType = "reading" | "boss" | "treasure" | "battle" | "checkpoint" | "mystery" | "elite"

type Stage = {
  id: number
  type: StageType
  title: string
  status: "completed" | "current" | "locked"
  stars?: number
  reward?: string
}

const stages: Stage[] = [
  { id: 1, type: "reading", title: "初入森林", status: "completed", stars: 3 },
  { id: 2, type: "reading", title: "精灵之语", status: "completed", stars: 3 },
  { id: 3, type: "treasure", title: "神秘宝箱", status: "completed", stars: 2, reward: "+50金币" },
  { id: 4, type: "battle", title: "知识挑战", status: "completed", stars: 3 },
  { id: 5, type: "elite", title: "精英守卫", status: "completed", stars: 2 },
  { id: 6, type: "boss", title: "树精王", status: "current" },
  { id: 7, type: "reading", title: "古老传说", status: "locked" },
  { id: 8, type: "mystery", title: "迷雾深处", status: "locked" },
  { id: 9, type: "treasure", title: "精灵宝藏", status: "locked" },
  { id: 10, type: "boss", title: "森林之心", status: "locked" },
]

const stageConfig = {
  reading: { 
    icon: BookOpen, 
    color: "emerald", 
    bgGradient: "from-emerald-400 to-emerald-600",
    glowColor: "rgba(52,211,153,0.5)",
    size: "normal"
  },
  boss: { 
    icon: Crown, 
    color: "amber", 
    bgGradient: "from-amber-400 to-orange-500",
    glowColor: "rgba(251,191,36,0.6)",
    size: "large"
  },
  treasure: { 
    icon: Gift, 
    color: "violet", 
    bgGradient: "from-violet-400 to-purple-600",
    glowColor: "rgba(167,139,250,0.5)",
    size: "normal"
  },
  battle: { 
    icon: Swords, 
    color: "rose", 
    bgGradient: "from-rose-400 to-red-500",
    glowColor: "rgba(251,113,133,0.5)",
    size: "normal"
  },
  checkpoint: { 
    icon: Star, 
    color: "cyan", 
    bgGradient: "from-cyan-400 to-blue-500",
    glowColor: "rgba(34,211,238,0.5)",
    size: "normal"
  },
  mystery: { 
    icon: Eye, 
    color: "indigo", 
    bgGradient: "from-indigo-400 to-violet-600",
    glowColor: "rgba(129,140,248,0.5)",
    size: "normal"
  },
  elite: { 
    icon: Zap, 
    color: "orange", 
    bgGradient: "from-orange-400 to-red-500",
    glowColor: "rgba(251,146,60,0.5)",
    size: "medium"
  },
}

interface AdventurePathProps {
  onStageSelect?: (stageId: number) => void
}

export function AdventurePath({ onStageSelect }: AdventurePathProps) {
  const totalStars = stages.reduce((acc, s) => acc + (s.stars || 0), 0)
  const maxStars = stages.length * 3

  return (
    <div className="relative px-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">冒险之路</h3>
            <p className="text-[10px] text-muted-foreground">魔法森林 · 第三章</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-50 rounded-full px-2.5 py-1 border border-amber-200">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          <span className="text-sm font-bold text-amber-700">{totalStars}</span>
          <span className="text-[10px] text-amber-500">/ {maxStars}</span>
        </div>
      </div>
      
      {/* Scrollable path container */}
      <div className="relative overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
        <div className="flex items-center gap-0 min-w-max py-2">
          {stages.map((stage, index) => {
            const config = stageConfig[stage.type]
            const Icon = config.icon
            const isCompleted = stage.status === "completed"
            const isCurrent = stage.status === "current"
            const isLocked = stage.status === "locked"
            const isLast = index === stages.length - 1
            const isBoss = stage.type === "boss"
            const isElite = stage.type === "elite"
            const isTreasure = stage.type === "treasure"
            const isMystery = stage.type === "mystery"
            
            // Size based on stage type
            const nodeSize = config.size === "large" ? "w-14 h-14" : config.size === "medium" ? "w-12 h-12" : "w-11 h-11"
            const iconSize = config.size === "large" ? "h-6 w-6" : config.size === "medium" ? "h-5 w-5" : "h-5 w-5"
            
            return (
              <div key={stage.id} className="flex items-center">
                {/* Stage node */}
                <button
                  onClick={() => !isLocked && onStageSelect?.(stage.id)}
                  disabled={isLocked}
                  className={cn(
                    "relative flex flex-col items-center transition-all duration-300",
                    !isLocked && "hover:scale-110 active:scale-95"
                  )}
                >
                  {/* Atmospheric glow for special stages */}
                  {(isBoss || isElite || isTreasure) && !isLocked && (
                    <div 
                      className={cn(
                        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl transition-all",
                        isBoss ? "w-20 h-20" : "w-16 h-16",
                        isCompleted ? "opacity-30" : "opacity-60 animate-pulse"
                      )}
                      style={{ backgroundColor: config.glowColor }}
                    />
                  )}
                  
                  {/* Current stage breathing glow */}
                  {isCurrent && (
                    <div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full animate-[breathe_2s_ease-in-out_infinite]"
                      style={{ backgroundColor: config.glowColor }}
                    />
                  )}
                  
                  {/* Node circle */}
                  <div className={cn(
                    "relative flex items-center justify-center rounded-full border-3 transition-all duration-300",
                    nodeSize,
                    isCompleted && cn(
                      `bg-gradient-to-br ${config.bgGradient}`,
                      "border-transparent shadow-lg"
                    ),
                    isCurrent && cn(
                      "bg-white border-4 shadow-xl",
                      `border-${config.color}-400`,
                      "animate-[bounce_1s_ease-in-out_infinite]"
                    ),
                    isLocked && "bg-gray-200/80 border-gray-300/50 backdrop-blur-sm"
                  )}>
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-white" strokeWidth={3} />
                    ) : isLocked ? (
                      <Lock className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Icon className={cn(iconSize, `text-${config.color}-500`)} strokeWidth={2} />
                    )}
                    
                    {/* Stars for completed stages */}
                    {isCompleted && stage.stars && (
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5 bg-white rounded-full px-1 py-0.5 shadow-md">
                        {[1, 2, 3].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-2 w-2",
                              star <= stage.stars!
                                ? "text-amber-400 fill-amber-400"
                                : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Current stage sparkle effects */}
                    {isCurrent && (
                      <>
                        <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-400 animate-pulse" />
                        <div className="absolute -top-2 -left-1 w-2 h-2 bg-amber-300 rounded-full animate-ping" />
                      </>
                    )}
                    
                    {/* Special badges */}
                    {isBoss && !isLocked && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <Crown className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {isTreasure && !isLocked && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-[bob_2s_ease-in-out_infinite]">
                        <Gem className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                    {isMystery && !isLocked && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <span className="text-[10px] text-white font-bold">?</span>
                      </div>
                    )}
                    {isElite && !isLocked && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <Zap className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Stage title */}
                  <span className={cn(
                    "mt-2.5 text-[10px] font-medium text-center w-14 line-clamp-2",
                    isCompleted && "text-foreground",
                    isCurrent && "text-primary font-bold",
                    isLocked && "text-muted-foreground"
                  )}>
                    {stage.title}
                  </span>
                </button>
                
                {/* Connection line - glowing trail */}
                {!isLast && (
                  <div className="relative w-6 h-2 mx-0.5">
                    {/* Base line */}
                    <div className={cn(
                      "absolute inset-y-0 inset-x-0 my-auto h-1 rounded-full",
                      stages[index + 1].status === "locked" 
                        ? "bg-gray-200" 
                        : "bg-gradient-to-r from-primary via-emerald-400 to-primary"
                    )} />
                    
                    {/* Animated glow for active paths */}
                    {stages[index + 1].status !== "locked" && (
                      <div className="absolute inset-y-0 inset-x-0 my-auto h-1 rounded-full bg-gradient-to-r from-primary to-emerald-400 animate-[pulse_2s_ease-in-out_infinite] blur-sm" />
                    )}
                    
                    {/* Moving particle on current path */}
                    {isCurrent && (
                      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1.5 h-1.5 rounded-full bg-white shadow-lg animate-[moveRight_1.5s_ease-in-out_infinite]" />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Current stage CTA - enhanced */}
      <div className="mt-3 p-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 rounded-2xl border border-amber-400/30 relative overflow-hidden">
        {/* Background shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Crown className="h-6 w-6 text-white" />
              </div>
              {/* Danger indicator */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                <span className="text-[8px] text-white font-bold">!</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-amber-600 font-medium">BOSS战</p>
              <p className="text-sm font-bold text-foreground">树精王</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={cn("h-2.5 w-2.5", i <= 4 ? "text-amber-400 fill-amber-400" : "text-gray-300")} />
                  ))}
                </div>
                <span className="text-[9px] text-muted-foreground">难度</span>
              </div>
            </div>
          </div>
          <button className="relative px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 overflow-hidden group">
            <span className="relative z-10">挑战</span>
            {/* Button shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </button>
        </div>
      </div>
      
      {/* Animations */}
      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.4; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.7; }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes moveRight {
          0% { left: 0; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

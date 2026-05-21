"use client"

import { BookOpen, HelpCircle, Swords, Heart, Coins, Star, Check, Sparkles, Gift } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Mission {
  id: string
  title: string
  description: string
  icon: "book" | "question" | "challenge" | "pet"
  xpReward: number
  coinReward: number
  progress: number
  maxProgress: number
  completed: boolean
}

interface DailyMissionsProps {
  missions?: Mission[]
  onClaimReward?: (missionId: string) => void
}

const defaultMissions: Mission[] = [
  {
    id: "1",
    title: "阅读达人",
    description: "阅读一个章节",
    icon: "book",
    xpReward: 50,
    coinReward: 100,
    progress: 1,
    maxProgress: 1,
    completed: true,
  },
  {
    id: "2",
    title: "知识问答",
    description: "回答5道问题",
    icon: "question",
    xpReward: 30,
    coinReward: 60,
    progress: 3,
    maxProgress: 5,
    completed: false,
  },
  {
    id: "3",
    title: "挑战高手",
    description: "赢得一场PK",
    icon: "challenge",
    xpReward: 80,
    coinReward: 150,
    progress: 0,
    maxProgress: 1,
    completed: false,
  },
  {
    id: "4",
    title: "关爱伙伴",
    description: "喂养宠物",
    icon: "pet",
    xpReward: 20,
    coinReward: 30,
    progress: 0,
    maxProgress: 1,
    completed: false,
  },
]

const iconMap = {
  book: BookOpen,
  question: HelpCircle,
  challenge: Swords,
  pet: Heart,
}

const iconStyleMap = {
  book: { 
    bg: "bg-gradient-to-br from-emerald-500/20 to-teal-500/10", 
    color: "text-emerald-600",
    border: "border-emerald-200",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]"
  },
  question: { 
    bg: "bg-gradient-to-br from-amber-500/20 to-yellow-500/10", 
    color: "text-amber-600",
    border: "border-amber-200",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.2)]"
  },
  challenge: { 
    bg: "bg-gradient-to-br from-rose-500/20 to-pink-500/10", 
    color: "text-rose-600",
    border: "border-rose-200",
    glow: "shadow-[0_0_12px_rgba(244,63,94,0.2)]"
  },
  pet: { 
    bg: "bg-gradient-to-br from-violet-500/20 to-purple-500/10", 
    color: "text-violet-600",
    border: "border-violet-200",
    glow: "shadow-[0_0_12px_rgba(139,92,246,0.2)]"
  },
}

export function DailyMissions({ missions = defaultMissions, onClaimReward }: DailyMissionsProps) {
  const completedCount = missions.filter(m => m.completed).length
  const allComplete = completedCount === missions.length

  return (
    <div className="rounded-2xl bg-card p-4 shadow-lg border border-border/50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-2xl pointer-events-none" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400/30 animate-sparkle-float"
            style={{
              left: `${15 + i * 22}%`,
              top: `${20 + (i % 2) * 30}%`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
      </div>
      
      {/* Header */}
      <div className="mb-4 flex items-center justify-between relative">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/10 border border-amber-200/50">
            <Gift className="h-4.5 w-4.5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-card-foreground">每日任务</h3>
            <p className="text-[10px] text-muted-foreground">完成任务获取丰厚奖励</p>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold border",
          allComplete 
            ? "bg-gradient-to-r from-amber-400/20 to-orange-400/20 text-amber-600 border-amber-300" 
            : "bg-primary/10 text-primary border-primary/20"
        )}>
          {allComplete && <Sparkles className="h-3.5 w-3.5" />}
          {completedCount}/{missions.length}
        </div>
      </div>

      {/* Mission list */}
      <div className="space-y-2.5 relative">
        {missions.map((mission) => {
          const Icon = iconMap[mission.icon]
          const iconStyle = iconStyleMap[mission.icon]
          const progressPercent = (mission.progress / mission.maxProgress) * 100

          return (
            <div 
              key={mission.id}
              className={cn(
                "relative overflow-hidden rounded-xl border-2 p-3 transition-all duration-300",
                mission.completed 
                  ? `${iconStyle.bg} ${iconStyle.border} ${iconStyle.glow}` 
                  : "bg-card border-border/50 hover:border-border"
              )}
            >
              {/* Completion glow effect */}
              {mission.completed && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer" />
              )}
              
              <div className="flex items-center gap-3 relative">
                {/* Icon */}
                <div className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl border transition-all",
                  mission.completed 
                    ? `${iconStyle.bg} ${iconStyle.border}` 
                    : "bg-muted border-border/50"
                )}>
                  <Icon className={cn("h-5 w-5", mission.completed ? iconStyle.color : "text-muted-foreground")} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className={cn(
                      "text-sm font-bold truncate",
                      mission.completed ? iconStyle.color : "text-card-foreground"
                    )}>
                      {mission.title}
                    </h4>
                    {mission.completed && (
                      <div className={cn(
                        "flex h-4.5 w-4.5 items-center justify-center rounded-full",
                        iconStyle.bg, iconStyle.border, "border"
                      )}>
                        <Check className={cn("h-3 w-3", iconStyle.color)} />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-1">{mission.description}</p>
                  
                  {/* Progress bar */}
                  {!mission.completed && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            progressPercent > 0 
                              ? "bg-gradient-to-r from-primary to-emerald-400" 
                              : "bg-muted"
                          )}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {mission.progress}/{mission.maxProgress}
                      </span>
                    </div>
                  )}
                </div>

                {/* Rewards or Claim button */}
                {mission.completed ? (
                  <Button
                    size="sm"
                    onClick={() => onClaimReward?.(mission.id)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 h-auto text-xs font-bold text-white shadow-md hover:scale-105 transition-transform",
                      "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-500/90 hover:to-orange-500/90"
                    )}
                  >
                    <Gift className="h-3 w-3 mr-1" />
                    领取
                  </Button>
                ) : (
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-violet-600">
                      <Star className="h-3 w-3 fill-violet-500 text-violet-500" />
                      +{mission.xpReward}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                      <Coins className="h-3 w-3 text-amber-500" />
                      +{mission.coinReward}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes sparkle-float {
          0%, 100% { transform: translateY(0) scale(0.8); opacity: 0.3; }
          50% { transform: translateY(-10px) scale(1.2); opacity: 0.8; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-sparkle-float {
          animation: sparkle-float 3s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

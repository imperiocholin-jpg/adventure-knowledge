"use client"

import { cn } from "@/lib/utils"
import { Users, Shuffle, Trophy, Sparkles, ChevronRight, Crown } from "lucide-react"

interface MatchMode {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  gradient: string
  available: boolean
  badge?: string
}

interface MatchModesProps {
  onSelectMode: (modeId: string) => void
}

const matchModes: MatchMode[] = [
  {
    id: "friend",
    title: "好友挑战",
    description: "邀请好友一起比赛",
    icon: <Users className="w-6 h-6 text-white" />,
    gradient: "from-blue-400 to-cyan-400",
    available: true,
    badge: "热门",
  },
  {
    id: "random",
    title: "随机匹配",
    description: "与陌生小伙伴对战",
    icon: <Shuffle className="w-6 h-6 text-white" />,
    gradient: "from-purple-400 to-pink-400",
    available: true,
  },
  {
    id: "tournament",
    title: "赛季锦标赛",
    description: "争夺赛季冠军",
    icon: <Trophy className="w-6 h-6 text-white" />,
    gradient: "from-amber-400 to-orange-400",
    available: true,
    badge: "进行中",
  },
  {
    id: "ranking",
    title: "排位挑战",
    description: "提升你的段位",
    icon: <Crown className="w-6 h-6 text-white" />,
    gradient: "from-rose-400 to-pink-400",
    available: false,
    badge: "即将开放",
  },
]

export function MatchModes({ onSelectMode }: MatchModesProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <span className="text-sm font-bold text-foreground">选择比赛模式</span>
      </div>

      <div className="space-y-2">
        {matchModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => mode.available && onSelectMode(mode.id)}
            disabled={!mode.available}
            className={cn(
              "w-full p-3 rounded-2xl border-2 transition-all duration-300",
              "flex items-center gap-3",
              mode.available
                ? "border-border/50 bg-white/80 hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
                : "border-border/30 bg-muted/30 opacity-60 cursor-not-allowed"
            )}
          >
            {/* Icon */}
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shadow-md",
              "bg-gradient-to-br",
              mode.gradient
            )}>
              {mode.icon}
            </div>

            {/* Text */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{mode.title}</span>
                {mode.badge && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                    mode.badge === "热门" && "bg-rose-100 text-rose-600",
                    mode.badge === "进行中" && "bg-amber-100 text-amber-600",
                    mode.badge === "即将开放" && "bg-muted text-muted-foreground"
                  )}>
                    {mode.badge}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{mode.description}</span>
            </div>

            {/* Arrow */}
            {mode.available && (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

"use client"

import { Swords, Trophy, ChevronRight, Flame, Zap, Crown, Medal } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RankingUser {
  rank: number
  name: string
  avatar: string
  score: number
}

interface PKChallengeProps {
  remainingChallenges: number
  maxChallenges: number
  currentRank?: number
  winStreak?: number
  topRankers?: RankingUser[]
  onChallenge?: () => void
  onViewRanking?: () => void
}

const defaultRankers: RankingUser[] = [
  { rank: 1, name: "学霸小明", avatar: "🦁", score: 2850 },
  { rank: 2, name: "阅读达人", avatar: "🐼", score: 2720 },
  { rank: 3, name: "书虫小红", avatar: "🐰", score: 2680 },
]

const rankStyles = {
  1: { bg: "bg-gradient-to-br from-amber-400 to-yellow-500", shadow: "shadow-[0_2px_10px_rgba(251,191,36,0.4)]", icon: Crown },
  2: { bg: "bg-gradient-to-br from-slate-300 to-slate-400", shadow: "shadow-[0_2px_8px_rgba(148,163,184,0.4)]", icon: Medal },
  3: { bg: "bg-gradient-to-br from-amber-600 to-orange-600", shadow: "shadow-[0_2px_8px_rgba(217,119,6,0.4)]", icon: Medal },
}

export function PKChallenge({
  remainingChallenges = 3,
  maxChallenges = 5,
  currentRank = 15,
  winStreak = 3,
  topRankers = defaultRankers,
  onChallenge,
  onViewRanking,
}: PKChallengeProps) {
  const hasRemainingChallenges = remainingChallenges > 0

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card p-4 shadow-lg border border-border/50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full blur-2xl" />
        
        {/* Floating battle particles */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-rose-400/30 animate-battle-float"
            style={{
              left: `${10 + i * 18}%`,
              top: `${15 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>
      
      <div className="relative">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/10 border border-rose-200/50">
              <Swords className="h-4.5 w-4.5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-card-foreground">知识PK</h3>
              <p className="text-[10px] text-muted-foreground">与其他小伙伴比拼知识</p>
            </div>
          </div>
          
          {/* Status badges */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-500/10 to-pink-500/10 px-2 py-0.5 text-xs font-bold text-rose-600 border border-rose-200/50">
              <Flame className="h-3 w-3 fill-rose-500" />
              {remainingChallenges}/{maxChallenges}
            </div>
            {winStreak > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-200/50">
                <Zap className="h-2.5 w-2.5 fill-amber-500" />
                连胜{winStreak}场
              </div>
            )}
          </div>
        </div>

        {/* Your rank card */}
        <div className="mb-3 p-2.5 rounded-xl bg-gradient-to-r from-primary/5 to-emerald-500/5 border border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-500 text-xs font-bold text-white shadow-md">
                {currentRank}
              </div>
              <div>
                <span className="text-xs text-muted-foreground">我的排名</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-card-foreground">第 {currentRank} 名</span>
                  <span className="text-[10px] text-emerald-600 font-medium">↑ 5</span>
                </div>
              </div>
            </div>
            <Trophy className="h-5 w-5 text-amber-500" />
          </div>
        </div>

        {/* Challenge button - highly tappable */}
        <Button 
          onClick={onChallenge}
          disabled={!hasRemainingChallenges}
          className="mb-4 w-full rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 py-6 text-base font-bold text-white shadow-[0_4px_20px_rgba(244,63,94,0.4)] hover:shadow-[0_6px_25px_rgba(244,63,94,0.5)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all duration-300 border-2 border-rose-400/30 relative overflow-hidden group"
        >
          {/* Button shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          
          <span className="relative flex items-center justify-center gap-2">
            <Swords className="h-5 w-5" />
            {hasRemainingChallenges ? "开始挑战" : "今日次数已用完"}
            {hasRemainingChallenges && <Zap className="h-4 w-4 fill-current animate-pulse" />}
          </span>
        </Button>

        {/* Ranking preview */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Trophy className="h-4 w-4 text-amber-500" />
              今日排行榜
            </div>
            <button 
              onClick={onViewRanking}
              className="flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              查看全部
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {topRankers.map((user) => {
              const style = rankStyles[user.rank as keyof typeof rankStyles] || { bg: "bg-muted", shadow: "", icon: Medal }
              const RankIcon = style.icon
              
              return (
                <div 
                  key={user.rank}
                  className="flex items-center gap-3 rounded-xl bg-muted/50 p-2.5 border border-border/30 hover:border-border/50 transition-colors"
                >
                  {/* Rank badge */}
                  <div className={`relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${style.bg} ${style.shadow}`}>
                    {user.rank === 1 ? (
                      <RankIcon className="h-4 w-4" />
                    ) : (
                      user.rank
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-card to-muted text-xl border border-border/50">
                    {user.avatar}
                  </div>

                  {/* Name */}
                  <span className="flex-1 truncate text-sm font-semibold text-card-foreground">
                    {user.name}
                  </span>

                  {/* Score */}
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-amber-600">
                      {user.score.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">分</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes battle-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-12px) scale(1.3); opacity: 0.7; }
        }
        .animate-battle-float {
          animation: battle-float 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

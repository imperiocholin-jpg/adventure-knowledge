"use client"

import { cn } from "@/lib/utils"
import { TrendingUp, Crown, ChevronRight } from "lucide-react"

interface SocialRankingProps {
  myRank?: number
  myScore?: number
  topThree?: { name: string; avatar: string; score: number }[]
  onViewAll?: () => void
}

export function SocialRanking({
  myRank = 15,
  myScore = 1560,
  topThree = [
    { name: "小明", avatar: "🦊", score: 2850 },
    { name: "阅读达人", avatar: "🐰", score: 2720 },
    { name: "书虫小红", avatar: "🐱", score: 2680 },
  ],
  onViewAll,
}: SocialRankingProps) {
  return (
    <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-4 border border-rose-100">
      <div className="flex items-center justify-between">
        {/* My rank - compact */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-rose-600">#{myRank}</span>
              <span className="text-xs text-muted-foreground">{myScore}分</span>
            </div>
            <p className="text-[10px] text-muted-foreground">本周排名</p>
          </div>
        </div>
        
        {/* Top 3 preview - compact avatars */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {topThree.slice(0, 3).map((user, i) => (
              <div 
                key={i}
                className={cn(
                  "w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-sm shadow-sm",
                  i === 0 ? "bg-amber-100" : "bg-white"
                )}
              >
                {i === 0 && <Crown className="h-3 w-3 text-amber-500 absolute -top-1" />}
                {user.avatar}
              </div>
            ))}
          </div>
          
          <button 
            onClick={onViewAll}
            className="text-xs text-rose-500 font-medium"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

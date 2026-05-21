"use client"

import { Flame, Star, BookOpen, Trophy, TrendingUp, Sparkles, Target, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReadingStatsProps {
  totalBooks?: number
  completedBooks?: number
  totalStars?: number
  maxStars?: number
  readingStreak?: number
  weeklyProgress?: number
  level?: number
  xp?: number
  xpToNext?: number
}

export function ReadingStats({
  totalBooks = 24,
  completedBooks = 8,
  totalStars = 18,
  maxStars = 72,
  readingStreak = 7,
  weeklyProgress = 65,
  level = 12,
  xp = 850,
  xpToNext = 1000,
}: ReadingStatsProps) {
  const xpPercent = Math.round((xp / xpToNext) * 100)

  return (
    <div className="px-4">
      {/* Main stats card - magical tome style */}
      <div className="relative bg-gradient-to-br from-primary via-emerald-500 to-teal-600 rounded-3xl p-4 overflow-hidden">
        {/* Decorative magical elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <Sparkles 
              key={i}
              className="absolute h-3 w-3 text-white/30 animate-float-particle"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>
        
        {/* Header - Level & XP */}
        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Level badge */}
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30">
                <span className="text-xl font-black text-white">{level}</span>
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-400 text-[8px] font-bold text-amber-900">
                等级
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-white">阅读探险家</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <Zap className="h-3 w-3 text-amber-300" />
                <span className="text-[10px] text-white/80">{xp}/{xpToNext} XP</span>
              </div>
              {/* XP progress bar */}
              <div className="w-24 h-1.5 rounded-full bg-white/20 mt-1 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Streak badge - fire effect */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-orange-500/50 blur-md animate-pulse" />
            <div className="relative flex items-center gap-1.5 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl px-3 py-2 border border-orange-300/30">
              <Flame className="h-5 w-5 text-yellow-200 animate-flicker" />
              <div className="text-center">
                <span className="text-lg font-black text-white leading-none">{readingStreak}</span>
                <p className="text-[8px] text-white/80">连续天数</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid - achievement cards */}
        <div className="relative grid grid-cols-4 gap-2 mb-3">
          {/* Books completed */}
          <div className="bg-white/15 backdrop-blur-md rounded-xl p-2 text-center border border-white/10">
            <BookOpen className="h-4 w-4 text-white mx-auto mb-1" />
            <p className="text-lg font-bold text-white leading-none">{completedBooks}</p>
            <p className="text-[8px] text-white/70 mt-0.5">已完成</p>
          </div>
          
          {/* Stars collected */}
          <div className="bg-white/15 backdrop-blur-md rounded-xl p-2 text-center border border-white/10">
            <Star className="h-4 w-4 text-amber-300 fill-amber-300 mx-auto mb-1" />
            <p className="text-lg font-bold text-white leading-none">{totalStars}</p>
            <p className="text-[8px] text-white/70 mt-0.5">星星</p>
          </div>
          
          {/* Achievements */}
          <div className="bg-white/15 backdrop-blur-md rounded-xl p-2 text-center border border-white/10">
            <Trophy className="h-4 w-4 text-amber-300 mx-auto mb-1" />
            <p className="text-lg font-bold text-white leading-none">5</p>
            <p className="text-[8px] text-white/70 mt-0.5">成就</p>
          </div>
          
          {/* Weekly goal */}
          <div className="bg-white/15 backdrop-blur-md rounded-xl p-2 text-center border border-white/10">
            <Target className="h-4 w-4 text-cyan-300 mx-auto mb-1" />
            <p className="text-lg font-bold text-white leading-none">{weeklyProgress}%</p>
            <p className="text-[8px] text-white/70 mt-0.5">周目标</p>
          </div>
        </div>

        {/* Collection progress - magical bar */}
        <div className="relative bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span className="text-xs font-semibold text-white">收藏进度</span>
            </div>
            <span className="text-xs font-bold text-amber-300">{completedBooks}/{totalBooks} 本</span>
          </div>
          
          <div className="relative h-3 rounded-full bg-white/20 overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-400"
              style={{ width: `${(completedBooks / totalBooks) * 100}%` }}
            />
            {/* Animated shine */}
            <div 
              className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shine"
              style={{ left: `${(completedBooks / totalBooks) * 100 - 10}%` }}
            />
            {/* Milestone markers */}
            {[25, 50, 75].map((milestone) => (
              <div 
                key={milestone}
                className="absolute top-1/2 -translate-y-1/2 w-0.5 h-full bg-white/30"
                style={{ left: `${milestone}%` }}
              />
            ))}
          </div>
          
          <p className="text-[9px] text-white/70 mt-1.5 text-center">
            再完成 {totalBooks - completedBooks} 本解锁 隐藏章节
          </p>
        </div>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-10px) scale(1.2); opacity: 0.6; }
        }
        @keyframes flicker {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        :global(.animate-float-particle) { animation: float-particle 3s ease-in-out infinite; }
        :global(.animate-flicker) { animation: flicker 0.5s ease-in-out infinite; }
        :global(.animate-shine) { animation: shine 3s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

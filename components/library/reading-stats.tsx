"use client"

import { Flame, Star, BookOpen, Trophy, Sparkles, Target, Crown } from "lucide-react"

interface ReadingStatsProps {
  totalBooks?: number
  completedBooks?: number
  totalStars?: number
  maxStars?: number
  readingStreak?: number
  /** 世界进度 %（与冒险地图同源） */
  worldProgress?: number
  /** 冒险家等级（左侧角标数字） */
  adventureLevel?: number
  /** 冒险家称号 */
  adventureTitle?: string
  /** 主人本级冒险进度经验 */
  adventureExpInLevel?: number
  adventureExpToNext?: number
}

export function ReadingStats({
  totalBooks = 24,
  completedBooks = 0,
  totalStars = 0,
  maxStars = 72,
  readingStreak = 0,
  worldProgress = 0,
  adventureLevel = 1,
  adventureTitle = "见习冒险家",
  adventureExpInLevel = 0,
  adventureExpToNext = 100,
}: ReadingStatsProps) {
  const expPercent =
    adventureExpToNext > 0
      ? Math.min(100, Math.round((adventureExpInLevel / adventureExpToNext) * 100))
      : 0

  return (
    <div className="px-4">
      <div className="relative bg-gradient-to-br from-primary via-emerald-500 to-teal-600 rounded-3xl p-4 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

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

        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30">
                <span className="text-xl font-black text-white">{adventureLevel}</span>
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-400 text-[8px] font-bold text-amber-900 whitespace-nowrap">
                冒险等级
              </div>
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{adventureTitle}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <Crown className="h-3 w-3 text-amber-300 shrink-0" />
                <span className="text-[10px] text-white/80">
                  冒险进度 {adventureExpInLevel}/{adventureExpToNext}
                </span>
              </div>
              <div className="w-28 max-w-full h-1.5 rounded-full bg-white/20 mt-1 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="relative shrink-0">
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

        <div className="relative grid grid-cols-4 gap-2 mb-3">
          <div className="bg-white/15 backdrop-blur-md rounded-xl p-2 text-center border border-white/10">
            <BookOpen className="h-4 w-4 text-white mx-auto mb-1" />
            <p className="text-lg font-bold text-white leading-none">{completedBooks}</p>
            <p className="text-[8px] text-white/70 mt-0.5">已完成</p>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-xl p-2 text-center border border-white/10">
            <Star className="h-4 w-4 text-amber-300 fill-amber-300 mx-auto mb-1" />
            <p className="text-lg font-bold text-white leading-none">{totalStars}</p>
            <p className="text-[8px] text-white/70 mt-0.5">星星</p>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-xl p-2 text-center border border-white/10">
            <Trophy className="h-4 w-4 text-amber-300 mx-auto mb-1" />
            <p className="text-lg font-bold text-white leading-none">{worldProgress}%</p>
            <p className="text-[8px] text-white/70 mt-0.5">世界进度</p>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-xl p-2 text-center border border-white/10">
            <Target className="h-4 w-4 text-cyan-300 mx-auto mb-1" />
            <p className="text-lg font-bold text-white leading-none">{totalBooks}</p>
            <p className="text-[8px] text-white/70 mt-0.5">书目</p>
          </div>
        </div>

        <div className="relative bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span className="text-xs font-semibold text-white">收藏进度</span>
            </div>
            <span className="text-xs font-bold text-amber-300">
              {completedBooks}/{totalBooks} 本
            </span>
          </div>

          <div className="relative h-3 rounded-full bg-white/20 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-400"
              style={{
                width: `${totalBooks > 0 ? Math.min(100, (completedBooks / totalBooks) * 100) : 0}%`,
              }}
            />
            <div
              className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shine"
              style={{
                left: `${totalBooks > 0 ? Math.min(90, (completedBooks / totalBooks) * 100 - 10) : 0}%`,
              }}
            />
            {[25, 50, 75].map((milestone) => (
              <div
                key={milestone}
                className="absolute top-1/2 -translate-y-1/2 w-0.5 h-full bg-white/30"
                style={{ left: `${milestone}%` }}
              />
            ))}
          </div>

          <p className="text-[9px] text-white/70 mt-1.5 text-center">
            再完成 {Math.max(0, totalBooks - completedBooks)} 本解锁隐藏章节
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-particle {
          0%,
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-10px) scale(1.2);
            opacity: 0.6;
          }
        }
        @keyframes flicker {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
        :global(.animate-float-particle) {
          animation: float-particle 3s ease-in-out infinite;
        }
        :global(.animate-flicker) {
          animation: flicker 0.5s ease-in-out infinite;
        }
        :global(.animate-shine) {
          animation: shine 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

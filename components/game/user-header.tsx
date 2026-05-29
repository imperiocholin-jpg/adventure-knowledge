"use client"

import { Coins, Flame, Trophy } from "lucide-react"

interface UserHeaderProps {
  username: string
  /** 冒险家等级（头像角标） */
  adventureLevel: number
  coins: number
  avatarUrl?: string
  /** 连续活跃天数（见产品规则 §0.6） */
  dailyStreak?: number
  /** 冒险家称号 */
  adventureTitle?: string
  /** 世界进度 %；undefined 表示加载中 */
  worldProgress?: number
}

export function UserHeader({
  username = "小冒险家",
  adventureLevel = 1,
  coins = 0,
  avatarUrl,
  dailyStreak = 0,
  adventureTitle = "见习冒险家",
  worldProgress,
}: UserHeaderProps) {
  const worldProgressLabel =
    typeof worldProgress === "number" ? `${worldProgress}%` : "—"
  const streakDays = Math.max(0, Math.floor(dailyStreak))
  const weekDots = 7

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card p-3.5 shadow-md border border-border/50">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-amber-500/[0.06] pointer-events-none" />

      <div className="relative flex gap-3">
        {/* 头像 + 冒险家等级 */}
        <div className="relative shrink-0">
          <div className="h-[3.25rem] w-[3.25rem] rounded-full bg-gradient-to-br from-primary via-emerald-500 to-teal-400 p-0.5">
            <div className="h-full w-full rounded-full bg-card flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={username}
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <span className="text-2xl">👦</span>
              )}
            </div>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 flex h-5 min-w-5 px-0.5 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[9px] font-bold text-white shadow-sm">
            {adventureLevel}
          </div>
        </div>

        {/* 主信息区 */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
          {/* 第一行：昵称 / 称号 / 金币 */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex-1 min-w-0 flex items-center gap-1.5">
              <span className="truncate text-sm font-bold text-foreground">{username}</span>
              <span className="shrink-0 max-w-[4.75rem] truncate rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-medium text-violet-700 border border-violet-500/15">
                {adventureTitle}
              </span>
            </div>
            <div className="shrink-0 flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 border border-amber-200/60">
              <Coins className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-bold text-amber-800 tabular-nums">
                {coins.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 第二行：世界进度 + 连续天数 */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Trophy className="h-3 w-3 text-primary shrink-0" />
              <span>世界进度 {worldProgressLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="h-3 w-3 text-orange-500 fill-orange-500 shrink-0" />
              <span className="text-[11px] font-medium text-orange-600">
                连续{streakDays}天
              </span>
              <div className="flex gap-0.5" aria-hidden>
                {Array.from({ length: weekDots }).map((_, i) => (
                  <div
                    key={i}
                    className={
                      i < Math.min(streakDays, weekDots)
                        ? "h-1.5 w-1.5 rounded-full bg-gradient-to-r from-orange-400 to-amber-400"
                        : "h-1.5 w-1.5 rounded-full bg-muted"
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

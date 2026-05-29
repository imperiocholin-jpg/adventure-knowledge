"use client"

import { cn } from "@/lib/utils"
import { Coins, Flame, MapPin, Sparkles, Swords } from "lucide-react"

import { profileRankConfig } from "@/lib/profile/profile-rank-config"
import type { ProfileRankBadge } from "@/lib/profile/rank-badge"

export interface ProfileHeroMetrics {
  coins?: number
  dailyStreak?: number
  battleWins?: number
}

interface ProfileHeroProps {
  avatar?: string
  username: string
  adventureTitle: string
  level: number
  rankBadge: ProfileRankBadge
  followingCount?: number
  followerCount?: number
  schoolName?: string | null
  gradeClass?: string | null
  age?: number | null
  currentWorld?: string | null
  metrics?: ProfileHeroMetrics
  topRight?: React.ReactNode
  bottomAction?: React.ReactNode
  onFollowingClick?: () => void
  onFollowersClick?: () => void
  className?: string
}

export function ProfileHero({
  avatar,
  username,
  adventureTitle,
  level,
  rankBadge,
  followingCount = 0,
  followerCount = 0,
  schoolName,
  gradeClass,
  age,
  currentWorld,
  metrics,
  topRight,
  bottomAction,
  onFollowingClick,
  onFollowersClick,
  className,
}: ProfileHeroProps) {
  const rank = profileRankConfig[rankBadge]
  const RankIcon = rank.icon
  const schoolLine = [schoolName, gradeClass, age ? `${age}岁` : null].filter(Boolean).join(" · ")
  const hasMetrics =
    metrics &&
    (metrics.coins !== undefined || metrics.dailyStreak !== undefined || metrics.battleWins !== undefined)

  return (
    <div className={cn("w-full px-4 pt-3", className)}>
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-emerald-500/[0.04]" />

        <div className="relative p-3.5">
          {(topRight || metrics?.coins !== undefined) && (
            <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1.5">
              {topRight}
              {metrics?.coins !== undefined ? (
                <div className="flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 shadow-sm">
                  <Coins className="h-3 w-3 text-amber-600" />
                  <span className="text-[11px] font-bold tabular-nums text-amber-800">
                    {metrics.coins.toLocaleString()}
                  </span>
                </div>
              ) : null}
            </div>
          )}

          <div
            className={cn(
              "flex items-center gap-2.5",
              (topRight || metrics?.coins !== undefined) && "pr-[4.5rem]",
            )}
          >
            <div className="relative shrink-0 self-center">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary via-emerald-500 to-teal-400 p-0.5 shadow-sm">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-card">
                  {avatar ? (
                    <img src={avatar} alt={username} className="h-full w-full object-cover object-center" />
                  ) : (
                    <span className="text-2xl">👦</span>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 px-1 text-[9px] font-bold text-white shadow-sm">
                {level}
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="truncate text-base font-bold leading-tight text-foreground">{username}</h1>

              <div className="flex flex-wrap items-center gap-1">
                <span className="inline-flex max-w-full items-center gap-0.5 truncate rounded-full border border-primary/15 bg-primary/10 px-2 py-0.5 text-[10px] font-medium leading-none text-primary">
                  <Sparkles className="h-3 w-3 shrink-0" />
                  <span className="truncate">{adventureTitle}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r",
                      rank.gradient,
                    )}
                  >
                    <RankIcon className="h-2.5 w-2.5 text-white" />
                  </span>
                  {rank.label}
                </span>
              </div>

              {schoolLine ? (
                <p className="truncate text-[11px] leading-snug text-muted-foreground">{schoolLine}</p>
              ) : null}

              {currentWorld ? (
                <div className="flex items-center gap-1 text-[11px] leading-snug text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{currentWorld}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div
            className={cn(
              "mt-3 flex items-center border-t border-border/40 pt-3",
              bottomAction ? "justify-between gap-2" : "justify-between",
            )}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <SocialStatInline count={followingCount} label="关注" onClick={onFollowingClick} />
              <div className="h-3.5 w-px bg-border/80" />
              <SocialStatInline count={followerCount} label="粉丝" onClick={onFollowersClick} />
              {hasMetrics ? (
                <>
                  {metrics?.dailyStreak !== undefined ? (
                    <>
                      <div className="hidden h-3.5 w-px bg-border/80 sm:block" />
                      <MetricInline
                        icon={Flame}
                        value={metrics.dailyStreak}
                        label="连续天"
                        iconClassName="text-orange-500 fill-orange-500"
                      />
                    </>
                  ) : null}
                  {metrics?.battleWins !== undefined ? (
                    <>
                      <div className="h-3.5 w-px bg-border/80" />
                      <MetricInline
                        icon={Swords}
                        value={metrics.battleWins}
                        label="胜场"
                        iconClassName="text-rose-500"
                      />
                    </>
                  ) : null}
                </>
              ) : null}
            </div>
            {bottomAction ? <div className="shrink-0">{bottomAction}</div> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function SocialStatInline({
  count,
  label,
  onClick,
}: {
  count: number
  label: string
  onClick?: () => void
}) {
  const content = (
    <>
      <span className="text-sm font-bold tabular-nums text-foreground">{count}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </>
  )

  if (!onClick) {
    return <div className="flex items-baseline gap-1">{content}</div>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-baseline gap-1 transition hover:opacity-70 active:scale-95"
    >
      {content}
    </button>
  )
}

function MetricInline({
  icon: Icon,
  value,
  label,
  iconClassName,
}: {
  icon: typeof Flame
  value: number
  label: string
  iconClassName?: string
}) {
  return (
    <div className="flex items-baseline gap-1">
      <Icon className={cn("mr-0.5 h-3 w-3 self-center", iconClassName)} />
      <span className="text-sm font-bold tabular-nums text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronRight, Crown, Trophy } from "lucide-react"
import { UserAvatar } from "@/components/user/user-avatar"
import { resolveUserAvatarSrc } from "@/lib/user/avatar-catalog"
import type { SocialUserCard } from "@/lib/social/types"

interface SocialRankingProps {
  myRank?: number | null
  onViewAll?: () => void
}

const fallbackTopThree: SocialUserCard[] = [
  {
    userId: "demo-1",
    username: "学霸小明",
    avatarId: "boy-02",
    avatarSrc: resolveUserAvatarSrc("boy-02"),
    score: 0,
    rank: 1,
  },
  {
    userId: "demo-2",
    username: "阅读达人",
    avatarId: "girl-03",
    avatarSrc: resolveUserAvatarSrc("girl-03"),
    score: 0,
    rank: 2,
  },
  {
    userId: "demo-3",
    username: "书虫小红",
    avatarId: "girl-05",
    avatarSrc: resolveUserAvatarSrc("girl-05"),
    score: 0,
    rank: 3,
  },
]

export function SocialRanking({ myRank = null, onViewAll }: SocialRankingProps) {
  const [topThree, setTopThree] = useState<SocialUserCard[]>(fallbackTopThree)

  useEffect(() => {
    ;(async () => {
      try {
        const response = await fetch("/api/social/leaderboard?scope=global&limit=3", { cache: "no-store" })
        const payload = await response.json()
        if (response.ok && payload?.ok && Array.isArray(payload.data?.list) && payload.data.list.length > 0) {
          setTopThree(payload.data.list as SocialUserCard[])
        }
      } catch {
        // keep fallback avatars
      }
    })()
  }, [])

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-emerald-500/[0.06]" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-foreground">{myRank ? `#${myRank}` : "—"}</span>
              <span className="text-[10px] text-muted-foreground">胜场排名</span>
            </div>
            <p className="text-[10px] text-muted-foreground">看看谁是知识之王</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {topThree.slice(0, 3).map((user, i) => (
              <div key={user.userId} className={cn("relative", i === 0 && "z-10")}>
                {i === 0 ? (
                  <Crown className="absolute -top-2 left-1/2 z-10 h-3 w-3 -translate-x-1/2 text-amber-500" />
                ) : null}
                <UserAvatar
                  src={user.avatarSrc}
                  alt={user.username}
                  size="sm"
                  className={cn("ring-2 ring-card", i === 0 && "ring-amber-200")}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onViewAll}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 text-primary transition hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

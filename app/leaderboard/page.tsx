"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Trophy, Users, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { BottomNavigation } from "@/components/game/bottom-navigation"
import { PlayerPageShell, PlayerStickyHeader } from "@/components/layout/player-page-shell"
import { LeaderboardList } from "@/components/social/leaderboard-list"
import { FriendSearchPanel } from "@/components/social/friend-search-panel"
import { navigateToUserProfile, useFollowToggle } from "@/hooks/use-follow-toggle"
import type { LeaderboardScope, SocialUserCard } from "@/lib/social/types"

type NavItem = "home" | "library" | "adventure" | "pets" | "profile"

export default function LeaderboardPage() {
  const router = useRouter()
  const [scope, setScope] = useState<LeaderboardScope>("global")
  const [list, setList] = useState<SocialUserCard[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadLeaderboard = useCallback(async (nextScope: LeaderboardScope) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/social/leaderboard?scope=${nextScope}&limit=50`, {
        cache: "no-store",
      })
      const payload = await response.json()
      if (response.ok && payload?.ok) {
        setList((payload.data?.list ?? []) as SocialUserCard[])
      }
    } catch {
      setList([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLeaderboard(scope)
  }, [scope, loadLeaderboard])

  const { followLoadingId, toggleFollow, clearFollowError } = useFollowToggle(() =>
    loadLeaderboard(scope),
  )

  const handleFollowToggle = async (user: SocialUserCard) => {
    clearFollowError()
    const result = await toggleFollow(user)
    if (!result.ok) {
      window.alert(result.error)
    }
  }

  const handleUserClick = (user: SocialUserCard) => {
    navigateToUserProfile(router, user)
  }

  const handleNavigation = (item: NavItem) => {
    if (item === "home") router.push("/")
    if (item === "adventure") router.push("/adventure")
    if (item === "library") router.push("/library")
    if (item === "pets") router.push("/pets")
    if (item === "profile") router.push("/profile")
  }

  return (
    <PlayerPageShell className="bg-background">
      <PlayerStickyHeader className="border-border/40 bg-background/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h1 className="text-lg font-bold">对战排行榜</h1>
          </div>
        </div>

        <div className="flex gap-2 px-4 pb-3">
          <button
            type="button"
            onClick={() => setScope("global")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition-colors",
              scope === "global" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            <Globe className="h-4 w-4" />
            总排行
          </button>
          <button
            type="button"
            onClick={() => setScope("friends")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition-colors",
              scope === "friends" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            <Users className="h-4 w-4" />
            好友排行
          </button>
        </div>
      </PlayerStickyHeader>

      <div className="space-y-4 px-4 py-4">
        <FriendSearchPanel
          onFollowToggle={handleFollowToggle}
          followLoadingId={followLoadingId}
          onUserClick={handleUserClick}
        />

        <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-foreground">
            {scope === "global" ? "全站排行（历史胜场）" : "好友排行（历史胜场）"}
          </h2>
          {isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">加载中...</p>
          ) : (
            <LeaderboardList
              items={list}
              emptyText={scope === "friends" ? "还没有好友，先搜索昵称添加关注吧" : "暂无排行数据，赢得对战即可上榜"}
              showFollowButton={scope === "global"}
              followLoadingId={followLoadingId}
              onFollowToggle={(user) => void handleFollowToggle(user)}
              onUserClick={handleUserClick}
            />
          )}
        </div>
      </div>

      <BottomNavigation activeItem="pets" onNavigate={handleNavigation} />
    </PlayerPageShell>
  )
}

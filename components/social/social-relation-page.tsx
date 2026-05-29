"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { LeaderboardList } from "@/components/social/leaderboard-list"
import { PlayerPageShell, PlayerStickyHeader } from "@/components/layout/player-page-shell"
import { navigateToUserProfile, useFollowToggle } from "@/hooks/use-follow-toggle"
import type { SocialUserCard } from "@/lib/social/types"

interface SocialRelationPageProps {
  title: string
  emptyText: string
  apiPath: "/api/social/following" | "/api/social/followers"
}

export function SocialRelationPage({ title, emptyText, apiPath }: SocialRelationPageProps) {
  const router = useRouter()
  const [list, setList] = useState<SocialUserCard[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadList = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(apiPath, { cache: "no-store" })
      const payload = await response.json()
      if (response.ok && payload?.ok) {
        setList((payload.data?.list ?? []) as SocialUserCard[])
      }
    } catch {
      setList([])
    } finally {
      setIsLoading(false)
    }
  }

  const { followLoadingId, toggleFollow } = useFollowToggle(() => loadList())

  useEffect(() => {
    void loadList()
  }, [apiPath])

  return (
    <PlayerPageShell bottomPad="compact" className="bg-background">
      <PlayerStickyHeader className="border-border/40 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/profile" className="rounded-full p-2 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">{title}</h1>
        </div>
      </PlayerStickyHeader>

      <div className="px-4 py-4">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">加载中…</p>
        ) : (
          <LeaderboardList
            items={list}
            emptyText={emptyText}
            showFollowButton
            showScore={false}
            followLoadingId={followLoadingId}
            onFollowToggle={(user) => void toggleFollow(user)}
            onUserClick={(user) => navigateToUserProfile(router, user)}
          />
        )}
      </div>
    </PlayerPageShell>
  )
}

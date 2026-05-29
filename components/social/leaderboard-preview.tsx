"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Trophy } from "lucide-react"
import { LeaderboardList } from "@/components/social/leaderboard-list"
import { navigateToUserProfile } from "@/hooks/use-follow-toggle"
import type { SocialUserCard } from "@/lib/social/types"

interface LeaderboardPreviewProps {
  limit?: number
  title?: string
  onViewAll?: () => void
  viewAllLabel?: string
  className?: string
}

export function LeaderboardPreview({
  limit = 3,
  title = "对战排行榜",
  onViewAll,
  viewAllLabel = "查看全部",
  className,
}: LeaderboardPreviewProps) {
  const router = useRouter()
  const [items, setItems] = useState<SocialUserCard[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/social/leaderboard?scope=global&limit=${limit}`, {
          cache: "no-store",
        })
        const payload = await response.json()
        if (response.ok && payload?.ok) {
          setItems((payload.data?.list ?? []) as SocialUserCard[])
        }
      } catch {
        setItems([])
      } finally {
        setIsLoading(false)
      }
    })()
  }, [limit])

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-bold text-foreground">{title}</span>
        </div>
        {onViewAll && (
          <button type="button" onClick={onViewAll} className="text-xs font-medium text-primary">
            {viewAllLabel}
          </button>
        )}
      </div>
      {isLoading ? (
        <p className="py-4 text-center text-xs text-muted-foreground">加载排行中...</p>
      ) : (
        <LeaderboardList
          items={items}
          compact
          emptyText="赢得对战即可上榜"
          onUserClick={(user) => navigateToUserProfile(router, user)}
        />
      )}
    </div>
  )
}

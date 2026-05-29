"use client"

import { useState } from "react"
import { Search, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LeaderboardList } from "@/components/social/leaderboard-list"
import type { SocialUserCard } from "@/lib/social/types"

interface FriendSearchPanelProps {
  onFollowToggle: (user: SocialUserCard) => Promise<void>
  followLoadingId: string | null
  onUserClick?: (user: SocialUserCard) => void
}

export function FriendSearchPanel({ onFollowToggle, followLoadingId, onUserClick }: FriendSearchPanelProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SocialUserCard[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const runSearch = async () => {
    const q = query.trim()
    if (!q) {
      setResults([])
      setSearchError("请输入用户昵称")
      return
    }

    setIsSearching(true)
    setSearchError(null)
    try {
      const response = await fetch(`/api/social/users/search?q=${encodeURIComponent(q)}`, {
        cache: "no-store",
      })
      const payload = await response.json()
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error?.message ?? "搜索失败")
      }
      setResults((payload.data?.list ?? []) as SocialUserCard[])
      if ((payload.data?.list ?? []).length === 0) {
        setSearchError("没有找到匹配的用户")
      }
    } catch (error) {
      setResults([])
      setSearchError(error instanceof Error ? error.message : "搜索失败")
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">添加好友</h2>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void runSearch()
            }}
            placeholder="搜索用户昵称..."
            className="w-full rounded-xl border border-border/60 bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <Button type="button" size="sm" className="rounded-xl px-4" disabled={isSearching} onClick={() => void runSearch()}>
          {isSearching ? "搜索中" : "搜索"}
        </Button>
      </div>

      {searchError && <p className="text-xs text-muted-foreground">{searchError}</p>}

      <LeaderboardList
        items={results}
        emptyText=""
        showFollowButton
        followLoadingId={followLoadingId}
        onFollowToggle={(user) => void onFollowToggle(user)}
        onUserClick={onUserClick}
      />
    </div>
  )
}

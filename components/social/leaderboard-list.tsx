"use client"

import { cn } from "@/lib/utils"
import { Crown, Medal } from "lucide-react"
import { UserAvatar } from "@/components/user/user-avatar"
import type { SocialUserCard } from "@/lib/social/types"

const rankStyles = {
  1: { bg: "bg-gradient-to-br from-amber-400 to-yellow-500", icon: Crown },
  2: { bg: "bg-gradient-to-br from-slate-300 to-slate-400", icon: Medal },
  3: { bg: "bg-gradient-to-br from-amber-600 to-orange-600", icon: Medal },
} as const

interface LeaderboardListProps {
  items: SocialUserCard[]
  emptyText?: string
  onFollowToggle?: (user: SocialUserCard) => void
  followLoadingId?: string | null
  showFollowButton?: boolean
  showScore?: boolean
  compact?: boolean
  onUserClick?: (user: SocialUserCard) => void
}

export function LeaderboardList({
  items,
  emptyText = "暂无排行数据",
  onFollowToggle,
  followLoadingId,
  showFollowButton = false,
  showScore = true,
  compact = false,
  onUserClick,
}: LeaderboardListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", compact && "space-y-1.5")}>
      {items.map((user) => {
        const style = rankStyles[user.rank as keyof typeof rankStyles]
        const RankIcon = style?.icon

        return (
          <div
            key={user.userId}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border/30 bg-muted/30 p-2.5",
              user.isSelf && "border-primary/30 bg-primary/5",
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                style?.bg ?? "bg-muted-foreground/40",
              )}
            >
              {user.rank <= 3 && RankIcon ? <RankIcon className="h-3.5 w-3.5" /> : user.rank}
            </div>

            {onUserClick ? (
              <button type="button" onClick={() => onUserClick(user)} className="shrink-0 rounded-full">
                <UserAvatar src={user.avatarSrc} alt={user.username} size="sm" className="ring-1 ring-white" />
              </button>
            ) : (
              <UserAvatar src={user.avatarSrc} alt={user.username} size="sm" className="ring-1 ring-white" />
            )}

            <div
              className={cn("min-w-0 flex-1", onUserClick && "cursor-pointer")}
              onClick={onUserClick ? () => onUserClick(user) : undefined}
              onKeyDown={
                onUserClick
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") onUserClick(user)
                    }
                  : undefined
              }
              role={onUserClick ? "button" : undefined}
              tabIndex={onUserClick ? 0 : undefined}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "truncate text-sm font-semibold text-foreground",
                    onUserClick && "hover:text-primary",
                  )}
                >
                  {user.username}
                </span>
                {user.isSelf && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    我
                  </span>
                )}
              </div>
            </div>

            {showScore ? (
              <div className="shrink-0 text-right">
                <span className="text-sm font-bold text-amber-600">{user.score.toLocaleString()}</span>
                <span className="ml-0.5 text-[10px] text-muted-foreground">胜</span>
              </div>
            ) : null}

            {showFollowButton && onFollowToggle && !user.isSelf && (
              <button
                type="button"
                disabled={followLoadingId === user.userId}
                onClick={() => onFollowToggle(user)}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors",
                  user.isFollowing
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {followLoadingId === user.userId ? "..." : user.isFollowing ? "已关注" : "关注"}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

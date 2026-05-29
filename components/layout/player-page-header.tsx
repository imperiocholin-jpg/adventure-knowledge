"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { PLAYER_SHELL_MAX_CLASS } from "@/components/layout/player-page-shell"
import { useNotifications } from "@/hooks/use-notifications"

interface PlayerPageHeaderProps {
  title: string
  icon: ReactNode
  notificationCount?: number
  notificationHref?: string
  onNotificationClick?: () => void
  className?: string
}

export function PlayerPageHeader({
  title,
  icon,
  notificationCount: notificationCountOverride,
  notificationHref = "/notifications",
  onNotificationClick,
  className,
}: PlayerPageHeaderProps) {
  const { unreadCount } = useNotifications()
  const notificationCount = notificationCountOverride ?? unreadCount
  const badgeLabel = notificationCount > 99 ? "99+" : String(notificationCount)

  const bellClassName =
    "relative flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-card shadow-md transition-transform hover:scale-105 active:scale-95"

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border/30 bg-background",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto grid grid-cols-[2.5rem_1fr_2.5rem] items-center px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]",
          PLAYER_SHELL_MAX_CLASS,
        )}
      >
        <div aria-hidden className="h-10 w-10" />

        <div className="flex items-center justify-center gap-2">
          {icon}
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
        </div>

        <div className="flex justify-end">
          {onNotificationClick ? (
            <button
              type="button"
              onClick={onNotificationClick}
              className={bellClassName}
              aria-label="消息通知"
            >
              <Bell className="h-5 w-5 text-foreground" />
              {notificationCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[10px] font-bold leading-none text-destructive-foreground">
                  {badgeLabel}
                </span>
              ) : null}
            </button>
          ) : (
            <Link href={notificationHref} className={bellClassName} aria-label="消息通知">
              <Bell className="h-5 w-5 text-foreground" />
              {notificationCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[10px] font-bold leading-none text-destructive-foreground">
                  {badgeLabel}
                </span>
              ) : null}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

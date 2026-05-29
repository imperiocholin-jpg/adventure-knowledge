"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bell,
  BookOpen,
  ChevronLeft,
  Compass,
  Loader2,
  PawPrint,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BottomNavigation } from "@/components/game/bottom-navigation"
import { PlayerPageShell } from "@/components/layout/player-page-shell"
import { useNotifications } from "@/hooks/use-notifications"
import type { AppNotification, NotificationCategory } from "@/lib/notifications/types"
import { dispatchNotificationsUpdated } from "@/lib/notifications/notifications-client"

const CATEGORY_META: Record<
  NotificationCategory,
  { icon: typeof Bell; className: string; label: string }
> = {
  adventure: {
    icon: Compass,
    className: "bg-emerald-50 text-emerald-600",
    label: "冒险",
  },
  library: {
    icon: BookOpen,
    className: "bg-sky-50 text-sky-600",
    label: "书库",
  },
  pet: {
    icon: PawPrint,
    className: "bg-amber-50 text-amber-600",
    label: "宠物",
  },
  system: {
    icon: Sparkles,
    className: "bg-violet-50 text-violet-600",
    label: "系统",
  },
}

function NotificationItem({
  item,
  onRead,
}: {
  item: AppNotification
  onRead: (id: string) => void
}) {
  const meta = CATEGORY_META[item.category]
  const Icon = meta.icon
  const content = (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border px-3 py-3 transition-colors",
        item.unread
          ? "border-primary/15 bg-primary/[0.04]"
          : "border-border/50 bg-card",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          meta.className,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{item.title}</p>
          {item.unread ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-destructive" /> : null}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
        <p className="mt-2 text-[10px] text-muted-foreground/80">{item.timeLabel}</p>
      </div>
    </div>
  )

  if (item.href) {
    return (
      <Link
        href={item.href}
        onClick={() => {
          onRead(item.id)
          dispatchNotificationsUpdated()
        }}
        className="block"
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className="block w-full text-left"
      onClick={() => {
        onRead(item.id)
        dispatchNotificationsUpdated()
      }}
    >
      {content}
    </button>
  )
}

export default function NotificationsPage() {
  const router = useRouter()
  const { items, unreadCount, isLoading, markRead, markAllRead } = useNotifications()

  const handleMarkRead = async (id: string) => {
    await markRead(id)
    dispatchNotificationsUpdated()
  }

  const handleMarkAllRead = async () => {
    await markAllRead()
    dispatchNotificationsUpdated()
  }

  return (
    <PlayerPageShell bottomPad="nav" className="bg-background">
      <header className="sticky top-0 z-40 border-b border-border/30 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-card shadow-md transition-transform hover:scale-105 active:scale-95"
            aria-label="返回"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>

          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">消息通知</h1>
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="text-xs font-medium text-primary disabled:text-muted-foreground"
          >
            全部已读
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-3 px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium text-foreground">暂无新消息</p>
            <p className="mt-1 text-xs text-muted-foreground">冒险、阅读和宠物动态会出现在这里</p>
          </div>
        ) : (
          items.map((item) => <NotificationItem key={item.id} item={item} onRead={handleMarkRead} />)
        )}
      </main>

      <BottomNavigation />
    </PlayerPageShell>
  )
}

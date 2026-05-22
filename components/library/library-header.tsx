"use client"

import { ArrowLeft, Bell, Sparkles, BookOpen } from "lucide-react"

interface LibraryHeaderProps {
  onBack?: () => void
  notificationCount?: number
}

export function LibraryHeader({ onBack, notificationCount = 0 }: LibraryHeaderProps) {
  return (
    <div className="sticky top-0 z-30 bg-background border-b border-border/30">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-md border border-border/50 hover:scale-105 transition-transform"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>

        {/* Title with magical decoration */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <BookOpen className="h-5 w-5 text-primary" />
            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-400" />
          </div>
          <h1 className="text-lg font-bold text-foreground">魔法书库</h1>
        </div>

        {/* Notification */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-md border border-border/50 hover:scale-105 transition-transform">
          <Bell className="h-5 w-5 text-foreground" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {notificationCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}

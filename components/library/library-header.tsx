"use client"

import { BookOpen, Sparkles } from "lucide-react"
import { PlayerPageHeader } from "@/components/layout/player-page-header"

export function LibraryHeader() {
  return (
    <PlayerPageHeader
      title="魔法书库"
      icon={
        <div className="relative">
          <BookOpen className="h-5 w-5 text-primary" />
          <Sparkles className="absolute -right-1 -top-1 h-3 w-3 text-amber-400" />
        </div>
      }
    />
  )
}

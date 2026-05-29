"use client"

import { Compass } from "lucide-react"
import { cn } from "@/lib/utils"
import { PlayerPageHeader } from "@/components/layout/player-page-header"

interface AdventureMapHeaderProps {
  className?: string
}

export function AdventureMapHeader({ className }: AdventureMapHeaderProps) {
  return (
    <PlayerPageHeader
      className={cn(className)}
      title="阅读大陆"
      icon={<Compass className="h-5 w-5 text-primary" />}
    />
  )
}

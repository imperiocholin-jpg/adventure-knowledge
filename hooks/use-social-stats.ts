"use client"

import { useCallback, useEffect, useState } from "react"

import type { SocialStats } from "@/lib/social/types"

const DEFAULT_STATS: SocialStats = {
  followingCount: 0,
  followerCount: 0,
  myRank: null,
  myBattleWins: 0,
}

export function useSocialStats() {
  const [stats, setStats] = useState<SocialStats>(DEFAULT_STATS)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/social/stats", { cache: "no-store" })
      const payload = await response.json()
      if (response.ok && payload?.ok && payload.data) {
        setStats(payload.data as SocialStats)
      }
    } catch {
      setStats(DEFAULT_STATS)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { stats, isLoading, refresh }
}

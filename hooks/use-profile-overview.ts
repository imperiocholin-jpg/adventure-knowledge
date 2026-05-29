"use client"

import { useCallback, useEffect, useState } from "react"

import type { ProfileOverview } from "@/lib/profile/fetch-profile-overview"
import { DEFAULT_PET_PROFILE } from "@/lib/pets/pet-profile"
import { DEFAULT_USER_PROFILE } from "@/lib/user/user-profile"
import type { SocialStats } from "@/lib/social/types"
import type { ProfileDashboardData } from "@/hooks/use-profile-dashboard"

const DEFAULT_SOCIAL: SocialStats = {
  followingCount: 0,
  followerCount: 0,
  myRank: null,
  myBattleWins: 0,
}

const DEFAULT_DASHBOARD: ProfileDashboardData = {
  adventureProgress: null,
  adventureUser: null,
  currentWorld: "魔法森林",
  worldsExplored: 1,
  completedBooks: 0,
  treasuresUnlocked: 0,
  treasuresTotal: 0,
  petBond: 0,
  companionDays: 1,
  petCreatedAt: null,
  battleWins: 0,
  featuredBadges: [],
  totalBadgesUnlocked: 0,
  totalBadges: 0,
  journalEntries: [],
}

export function useProfileOverview() {
  const [overview, setOverview] = useState<ProfileOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/profile/overview", { cache: "no-store" })
      const payload = await response.json()
      if (response.ok && payload?.ok && payload.data) {
        setOverview(payload.data as ProfileOverview)
      }
    } catch {
      setOverview(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const user = overview?.user ?? DEFAULT_USER_PROFILE
  const pet = overview?.pet ?? DEFAULT_PET_PROFILE
  const petMeta = overview?.petMeta ?? { bond: 0, createdAt: null }
  const social = overview?.social ?? DEFAULT_SOCIAL
  const dashboard = overview?.dashboard ?? DEFAULT_DASHBOARD

  return { user, pet, petMeta, social, dashboard, isLoading, refresh }
}

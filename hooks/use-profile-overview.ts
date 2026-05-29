"use client"

import { useCallback, useEffect, useState } from "react"

import type { ProfileOverview } from "@/lib/profile/fetch-profile-overview"
import { DEFAULT_PET_PROFILE } from "@/lib/pets/pet-profile"
import { DEFAULT_USER_PROFILE } from "@/lib/user/user-profile"
import type { SocialStats } from "@/lib/social/types"
import type { ProfileDashboardData } from "@/hooks/use-profile-dashboard"
import {
  readCachedProfileOverview,
  writeCachedProfileOverview,
} from "@/lib/profile/session-cache"

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

function createInitialState(): {
  overview: ProfileOverview | null
  isLoading: boolean
  hasCache: boolean
} {
  const cached = readCachedProfileOverview()
  if (cached) {
    return { overview: cached, isLoading: true, hasCache: true }
  }
  return { overview: null, isLoading: true, hasCache: false }
}

export function useProfileOverview() {
  const [state, setState] = useState(createInitialState)

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))
    try {
      const response = await fetch("/api/profile/overview", { cache: "no-store" })
      const payload = await response.json()
      if (response.ok && payload?.ok && payload.data) {
        const overview = payload.data as ProfileOverview
        writeCachedProfileOverview(overview)
        setState({ overview, isLoading: false, hasCache: true })
        return
      }
      setState((prev) => ({ ...prev, isLoading: false }))
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const user = state.overview?.user ?? DEFAULT_USER_PROFILE
  const pet = state.overview?.pet ?? DEFAULT_PET_PROFILE
  const petMeta = state.overview?.petMeta ?? { bond: 0, createdAt: null }
  const social = state.overview?.social ?? DEFAULT_SOCIAL
  const dashboard = state.overview?.dashboard ?? DEFAULT_DASHBOARD
  const isDisplayReady = !state.isLoading || state.hasCache

  return {
    user,
    pet,
    petMeta,
    social,
    dashboard,
    isLoading: state.isLoading,
    isDisplayReady,
    refresh,
  }
}

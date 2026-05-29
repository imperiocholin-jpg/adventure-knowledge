"use client"

import { useCallback, useEffect, useState } from "react"

import {
  deriveHomeAdventureBanner,
  fetchAdventureDashboard,
  type AdventureProgressSnapshot,
  type AdventureUserSnapshot,
} from "@/lib/adventure/adventure-dashboard-client"
import {
  buildProfileBadges,
  buildProfileJournal,
  companionDaysFromDate,
  countExploredWorlds,
  type ProfileBadge,
  type ProfileJournalEntry,
} from "@/lib/profile/insights"
import { fetchUserTreasures } from "@/lib/treasures/treasures-client"
import { parsePetVitalsFromRecord } from "@/lib/pets/state"

export interface ProfileDashboardData {
  adventureProgress: AdventureProgressSnapshot | null
  adventureUser: AdventureUserSnapshot | null
  currentWorld: string
  worldsExplored: number
  completedBooks: number
  treasuresUnlocked: number
  treasuresTotal: number
  petBond: number
  companionDays: number
  petCreatedAt: string | null
  battleWins: number
  featuredBadges: ProfileBadge[]
  totalBadgesUnlocked: number
  totalBadges: number
  journalEntries: ProfileJournalEntry[]
}

const EMPTY: ProfileDashboardData = {
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

function getNumber(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function useProfileDashboard(options: {
  petName: string
  petLevel: number
  battleWins?: number
  petBond?: number
  petCreatedAt?: string | null
}) {
  const [data, setData] = useState<ProfileDashboardData>(EMPTY)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const skipUserFetch = options.battleWins !== undefined
      const skipPetFetch = options.petBond !== undefined

      const fetches: [
        ReturnType<typeof fetchAdventureDashboard>,
        ReturnType<typeof fetchUserTreasures>,
        Promise<unknown>,
        Promise<unknown> | null,
        Promise<unknown> | null,
      ] = [
        fetchAdventureDashboard(),
        fetchUserTreasures(),
        fetch("/api/books", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        skipPetFetch ? null : fetch("/api/pets", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        skipUserFetch ? null : fetch("/api/users", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      ]

      const [dashboard, treasures, booksRes, petsRes, usersRes] = await Promise.all([
        fetches[0],
        fetches[1],
        fetches[2],
        fetches[3] ?? Promise.resolve(null),
        fetches[4] ?? Promise.resolve(null),
      ])

      const progress = dashboard?.progress ?? null
      const adventureUser = dashboard?.user ?? null
      const banner = deriveHomeAdventureBanner(progress)

      const books = Array.isArray(booksRes?.data) ? (booksRes.data as Record<string, unknown>[]) : []
      const completedBooks = books.filter((row) => {
        const progressVal = getNumber(row.progress ?? row.reading_progress, 0)
        return progressVal >= 100 || Boolean(row.completed ?? row.is_completed)
      }).length

      const petRow = skipPetFetch
        ? null
        : Array.isArray(petsRes?.data)
          ? (petsRes.data[0] as Record<string, unknown>)
          : null
      const vitals = petRow ? parsePetVitalsFromRecord(petRow) : null
      const petCreatedAt = skipPetFetch
        ? (options.petCreatedAt ?? null)
        : typeof petRow?.created_at === "string"
          ? petRow.created_at
          : null

      const userRow = skipUserFetch
        ? null
        : Array.isArray(usersRes?.data)
          ? (usersRes.data[0] as Record<string, unknown>)
          : null
      const battleWins = skipUserFetch
        ? (options.battleWins ?? 0)
        : getNumber(userRow?.battle_wins, 0)

      const worldsExplored = countExploredWorlds(progress)
      const treasuresUnlocked = treasures?.unlockedCount ?? 0
      const treasuresTotal = treasures?.totalCount ?? 0
      const dailyStreak = adventureUser?.dailyStreak ?? 0
      const totalStars = progress?.totalStars ?? 0

      const badgeResult = buildProfileBadges({
        dailyStreak,
        totalStars,
        worldsExplored,
        completedBooks,
        battleWins,
        treasuresUnlocked,
        petName: options.petName,
        petLevel: options.petLevel,
        currentWorld: banner.currentWorld,
      })

      const journalEntries = buildProfileJournal({
        dailyStreak,
        petName: options.petName,
        petLevel: options.petLevel,
        currentWorld: banner.currentWorld,
        treasuresUnlocked,
        petCreatedAt,
      })

      setData({
        adventureProgress: progress,
        adventureUser,
        currentWorld: banner.currentWorld,
        worldsExplored,
        completedBooks,
        treasuresUnlocked,
        treasuresTotal,
        petBond: skipPetFetch ? (options.petBond ?? 0) : (vitals?.bond ?? 0),
        companionDays: companionDaysFromDate(petCreatedAt),
        petCreatedAt,
        battleWins,
        featuredBadges: badgeResult.featured,
        totalBadgesUnlocked: badgeResult.totalUnlocked,
        totalBadges: badgeResult.totalBadges,
        journalEntries,
      })
    } catch {
      setData(EMPTY)
    } finally {
      setIsLoading(false)
    }
  }, [options.petName, options.petLevel, options.battleWins, options.petBond, options.petCreatedAt])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { data, isLoading, refresh }
}

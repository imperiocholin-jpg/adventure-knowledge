import type { SupabaseClient } from "@supabase/supabase-js"

import {
  deriveHomeAdventureBanner,
  resolveUserExpInLevel,
  type AdventureProgressSnapshot,
  type AdventureUserSnapshot,
} from "@/lib/adventure/adventure-dashboard-client"
import { buildAdventureProgressFromRows } from "@/lib/adventure/server-progress"
import { findExistingColumn } from "@/lib/data/schema-compat"
import { fetchPrimaryPetRow } from "@/lib/pets/fetch-primary-pet"
import { parsePetRecord, DEFAULT_PET_PROFILE, mergePetProfile, type PetProfile } from "@/lib/pets/pet-profile"
import { parsePetVitalsFromRecord } from "@/lib/pets/state"
import { resolveAdventureLevelFromRow } from "@/lib/user/user-profile"
import {
  buildProfileBadges,
  buildProfileJournal,
  companionDaysFromDate,
  countExploredWorlds,
  type ProfileBadge,
  type ProfileJournalEntry,
} from "@/lib/profile/insights"
import { fetchSocialStats, getUsersOwnerField } from "@/lib/social/server"
import type { SocialStats } from "@/lib/social/types"
import { evaluateTreasureDefinition } from "@/lib/treasures/evaluate"
import { buildTreasureMetricsFromReadingRows, mergeDailyStreakIntoMetrics } from "@/lib/treasures/metrics"
import { loadTreasureDefinitions, loadUnlockedTreasureMap } from "@/lib/treasures/server"
import { parseUserRecord, type UserProfile } from "@/lib/user/user-profile"

type GenericRecord = Record<string, unknown>

export interface ProfileOverviewPetMeta {
  bond: number
  createdAt: string | null
}

export interface ProfileOverviewDashboard {
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

export interface ProfileOverview {
  user: UserProfile
  pet: PetProfile
  petMeta: ProfileOverviewPetMeta
  social: SocialStats
  dashboard: ProfileOverviewDashboard
}

function getNumber(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function countCompletedBooks(rows: GenericRecord[]) {
  return rows.filter((row) => {
    const progressVal = getNumber(row.progress ?? row.reading_progress, 0)
    return progressVal >= 100 || Boolean(row.completed ?? row.is_completed)
  }).length
}

async function fetchReadingRows(supabase: SupabaseClient, serviceClient: SupabaseClient, userId: string) {
  const ownerField = await findExistingColumn(serviceClient, "reading_records", [
    "user_id",
    "uid",
    "owner_id",
    "auth_user_id",
  ])
  if (!ownerField) return [] as GenericRecord[]

  const result = await supabase
    .from("reading_records")
    .select("*")
    .eq(ownerField, userId)
    .order("created_at", { ascending: false })
    .limit(1000)

  if (result.error) return [] as GenericRecord[]
  return (result.data ?? []) as GenericRecord[]
}

function countTreasuresUnlocked(
  definitions: Awaited<ReturnType<typeof loadTreasureDefinitions>>,
  metrics: ReturnType<typeof buildTreasureMetricsFromReadingRows>,
  unlockedMap: Map<string, string>,
) {
  let unlocked = 0
  for (const definition of definitions) {
    if (unlockedMap.has(definition.id)) {
      unlocked += 1
      continue
    }
    const evaluation = evaluateTreasureDefinition(definition, metrics)
    if (evaluation.unlocked) unlocked += 1
  }
  return unlocked
}

function buildAdventureUserFromRow(row: GenericRecord | null): AdventureUserSnapshot | null {
  if (!row) return null
  const streakRaw = row.daily_streak ?? row.streak ?? row.reading_streak
  const expRaw = row.experience ?? row.user_exp ?? row.exp ?? 0
  const expParts = resolveUserExpInLevel(getNumber(expRaw, 0))

  return {
    adventureLevel: resolveAdventureLevelFromRow(row),
    dailyStreak: Math.max(0, Math.floor(getNumber(streakRaw, 0))),
    ...expParts,
  }
}

export async function fetchProfileOverview(params: {
  supabase: SupabaseClient
  serviceClient: SupabaseClient
  userId: string
}): Promise<ProfileOverview | null> {
  const ownerField = await getUsersOwnerField(params.serviceClient)
  if (!ownerField) return null

  const [userResult, petResult, social, readingRows, booksResult, definitions, unlockedMap] =
    await Promise.all([
      params.serviceClient.from("users").select("*").eq(ownerField, params.userId).limit(1).maybeSingle(),
      fetchPrimaryPetRow(params.serviceClient, params.userId),
      fetchSocialStats(params.serviceClient, params.userId, ownerField),
      fetchReadingRows(params.supabase, params.serviceClient, params.userId),
      params.supabase.from("books").select("*"),
      loadTreasureDefinitions(params.serviceClient),
      loadUnlockedTreasureMap(params.serviceClient, params.userId),
    ])

  if (userResult.error) throw userResult.error
  if (!userResult.data) return null

  const userRow = userResult.data as GenericRecord
  const user = parseUserRecord(userRow)

  const petRow = petResult.row as GenericRecord | null
  const pet = petRow ? mergePetProfile(parsePetRecord(petRow), null, petRow) : DEFAULT_PET_PROFILE
  const vitals = petRow ? parsePetVitalsFromRecord(petRow) : null
  const petCreatedAt = typeof petRow?.created_at === "string" ? petRow.created_at : null
  const petMeta: ProfileOverviewPetMeta = {
    bond: vitals?.bond ?? 0,
    createdAt: petCreatedAt,
  }

  const adventureProgress = buildAdventureProgressFromRows(readingRows) as AdventureProgressSnapshot
  const adventureUser = buildAdventureUserFromRow(userRow)
  const banner = deriveHomeAdventureBanner(adventureProgress)

  const books = (booksResult.data ?? []) as GenericRecord[]
  const completedBooks = countCompletedBooks(books)

  const treasureMetrics = mergeDailyStreakIntoMetrics(
    buildTreasureMetricsFromReadingRows(readingRows),
    user.dailyStreak,
  )
  const treasuresUnlocked = countTreasuresUnlocked(definitions, treasureMetrics, unlockedMap)
  const treasuresTotal = definitions.length

  const worldsExplored = countExploredWorlds(adventureProgress)
  const dailyStreak = adventureUser?.dailyStreak ?? user.dailyStreak
  const totalStars = adventureProgress.totalStars ?? 0
  const battleWins = user.battleWins

  const badgeResult = buildProfileBadges({
    dailyStreak,
    totalStars,
    worldsExplored,
    completedBooks,
    battleWins,
    treasuresUnlocked,
    petName: pet.name,
    petLevel: pet.level,
    currentWorld: banner.currentWorld,
  })

  const journalEntries = buildProfileJournal({
    dailyStreak,
    petName: pet.name,
    petLevel: pet.level,
    currentWorld: banner.currentWorld,
    treasuresUnlocked,
    petCreatedAt,
  })

  return {
    user,
    pet,
    petMeta,
    social,
    dashboard: {
      adventureProgress,
      adventureUser,
      currentWorld: banner.currentWorld,
      worldsExplored,
      completedBooks,
      treasuresUnlocked,
      treasuresTotal,
      petBond: petMeta.bond,
      companionDays: companionDaysFromDate(petCreatedAt),
      petCreatedAt,
      battleWins,
      featuredBadges: badgeResult.featured,
      totalBadgesUnlocked: badgeResult.totalUnlocked,
      totalBadges: badgeResult.totalBadges,
      journalEntries,
    },
  }
}

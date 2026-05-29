import type { SupabaseClient } from "@supabase/supabase-js"

import { findExistingColumn, findExistingColumns } from "@/lib/data/schema-compat"
import { fetchPrimaryPetRow } from "@/lib/pets/fetch-primary-pet"
import { parsePetRecord } from "@/lib/pets/pet-profile"
import { parsePetVitalsFromRecord } from "@/lib/pets/state"
import { resolveAdventurerTitleLabel } from "@/lib/adventure/adventure-dashboard-client"
import {
  readAvatarId,
  readBattleWins,
  readUserId,
  readUsername,
  toSocialUserCard,
} from "@/lib/social/parse-user-row"
import { resolveUserAvatarSrc } from "@/lib/user/avatar-catalog"
import type { LeaderboardScope, PublicPetSummary, PublicUserProfile, SocialStats, SocialUserCard } from "@/lib/social/types"

type GenericRecord = Record<string, unknown>

async function resolveLeaderboardOrderColumn(supabase: SupabaseClient) {
  const columns = await findExistingColumns(supabase, "users", ["battle_wins", "battle_score"])
  if (columns.includes("battle_wins")) return "battle_wins"
  if (columns.includes("battle_score")) return "battle_score"
  return null
}

export async function getUsersOwnerField(supabase: SupabaseClient) {
  return findExistingColumn(supabase, "users", ["id", "user_id", "uid", "auth_user_id"])
}

export async function listFollowingIds(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", userId)
  if (error) {
    // 社交表未迁移时不阻塞搜索/排行榜
    if (error.code === "42P01" || error.message?.includes("user_follows")) return []
    throw error
  }
  return (data ?? []).map((row) => String(row.following_id))
}

export async function listFollowerIds(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("following_id", userId)
  if (error) throw error
  return (data ?? []).map((row) => String(row.follower_id))
}

async function isFollowingUser(supabase: SupabaseClient, viewerId: string, targetId: string) {
  if (viewerId === targetId) return false
  const { data, error } = await supabase
    .from("user_follows")
    .select("id")
    .eq("follower_id", viewerId)
    .eq("following_id", targetId)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}

function readNumber(row: GenericRecord, keys: string[], fallback = 0) {
  for (const key of keys) {
    const n = Number(row[key])
    if (Number.isFinite(n)) return Math.max(0, Math.floor(n))
  }
  return fallback
}

function readString(row: GenericRecord, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

async function fetchUsersByIds(
  supabase: SupabaseClient,
  ownerField: string,
  ids: string[],
  viewerId: string,
): Promise<SocialUserCard[]> {
  if (ids.length === 0) return []

  const { data, error } = await supabase.from("users").select("*").in(ownerField, ids)
  if (error) throw error

  const followingIds = new Set(await listFollowingIds(supabase, viewerId))
  const rowById = new Map<string, GenericRecord>()
  for (const row of (data ?? []) as GenericRecord[]) {
    const id = String(row[ownerField] ?? row.id ?? "")
    if (id) rowById.set(id, row)
  }

  return ids
    .map((id, index) => {
      const row = rowById.get(id)
      if (!row) return null
      return toSocialUserCard(row, {
        rank: index + 1,
        isSelf: id === viewerId,
        isFollowing: followingIds.has(id),
      })
    })
    .filter((item): item is SocialUserCard => item !== null)
}

export async function fetchFollowingList(
  supabase: SupabaseClient,
  viewerId: string,
  ownerField: string,
): Promise<SocialUserCard[]> {
  const ids = await listFollowingIds(supabase, viewerId)
  return fetchUsersByIds(supabase, ownerField, ids, viewerId)
}

export async function fetchFollowersList(
  supabase: SupabaseClient,
  viewerId: string,
  ownerField: string,
): Promise<SocialUserCard[]> {
  const ids = await listFollowerIds(supabase, viewerId)
  return fetchUsersByIds(supabase, ownerField, ids, viewerId)
}
export async function fetchPublicUserProfile(
  supabase: SupabaseClient,
  viewerId: string,
  targetUserId: string,
  ownerField: string,
): Promise<PublicUserProfile | null> {
  const [userResult, petResult, followingRes, followerRes, following] = await Promise.all([
    supabase.from("users").select("*").eq(ownerField, targetUserId).limit(1).maybeSingle(),
    fetchPrimaryPetRow(supabase, targetUserId),
    supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("follower_id", targetUserId),
    supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("following_id", targetUserId),
    isFollowingUser(supabase, viewerId, targetUserId),
  ])

  if (userResult.error) throw userResult.error
  if (!userResult.data) return null

  const row = userResult.data as GenericRecord
  const userId = readUserId(row)
  if (!userId) return null

  let pet: PublicPetSummary | null = null
  const petRowData = petResult.row
  if (petRowData) {
    const petRow = petRowData as GenericRecord
    const parsed = parsePetRecord(petRow)
    const vitals = parsePetVitalsFromRecord(petRow)
    pet = {
      name: parsed.name,
      species: parsed.species,
      breed: parsed.breed,
      level: parsed.level,
      lifeStage: parsed.lifeStage,
      emoji: parsed.emoji,
      avatarSrc: parsed.avatarSrc,
      bond: vitals.bond,
    }
  }

  const adventureLevel = Math.max(
    1,
    readNumber(row, ["adventure_level", "chapter_level", "level", "user_level"], 1),
  )
  const ageRaw = row.age
  const age =
    typeof ageRaw === "number" && ageRaw >= 5 && ageRaw <= 18
      ? Math.floor(ageRaw)
      : typeof ageRaw === "string" && Number(ageRaw) >= 5 && Number(ageRaw) <= 18
        ? Math.floor(Number(ageRaw))
        : null

  const avatarId = readAvatarId(row)

  return {
    userId,
    username: readUsername(row),
    avatarId,
    avatarSrc: resolveUserAvatarSrc(avatarId),
    adventureLevel,
    adventureTitle: resolveAdventurerTitleLabel(adventureLevel),
    battleWins: readBattleWins(row),
    dailyStreak: readNumber(row, ["daily_streak", "streak", "reading_streak"], 0),
    schoolName: readString(row, ["school_name", "school"]),
    gradeClass: readString(row, ["grade_class", "grade"]),
    age,
    followingCount: followingRes.count ?? 0,
    followerCount: followerRes.count ?? 0,
    isSelf: userId === viewerId,
    isFollowing: following,
    pet,
  }
}

export async function fetchSocialStats(
  supabase: SupabaseClient,
  userId: string,
  ownerField: string,
): Promise<SocialStats> {
  const orderColumn = await resolveLeaderboardOrderColumn(supabase)

  const [followingRes, followerRes, userRes, globalQuery] = await Promise.all([
    supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
    supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("users").select("*").eq(ownerField, userId).limit(1).maybeSingle(),
    orderColumn
      ? supabase.from("users").select("*").order(orderColumn, { ascending: false }).limit(200)
      : supabase.from("users").select("*").limit(200),
  ])

  if (followingRes.error) throw followingRes.error
  if (followerRes.error) throw followerRes.error
  if (userRes.error) throw userRes.error
  if (globalQuery.error) throw globalQuery.error

  const myRow = (userRes.data ?? null) as GenericRecord | null
  const myBattleWins = myRow ? readBattleWins(myRow) : 0
  const sorted = (globalQuery.data ?? []) as GenericRecord[]
  let myRank: number | null = null
  sorted.forEach((row, index) => {
    const id = String(row[ownerField] ?? row.id ?? "")
    if (id === userId) myRank = index + 1
  })

  return {
    followingCount: followingRes.count ?? 0,
    followerCount: followerRes.count ?? 0,
    myRank,
    myBattleWins,
  }
}

export async function fetchLeaderboard(
  supabase: SupabaseClient,
  userId: string,
  ownerField: string,
  scope: LeaderboardScope,
  limit = 50,
): Promise<SocialUserCard[]> {
  const orderColumn = await resolveLeaderboardOrderColumn(supabase)
  let rows: GenericRecord[] = []

  const baseQuery = () => {
    if (orderColumn) {
      return supabase.from("users").select("*").order(orderColumn, { ascending: false }).limit(limit)
    }
    return supabase.from("users").select("*").limit(limit)
  }

  if (scope === "friends") {
    const followingIds = await listFollowingIds(supabase, userId)
    const ids = Array.from(new Set([userId, ...followingIds]))
    if (ids.length === 0) return []
    const query = orderColumn
      ? supabase.from("users").select("*").in(ownerField, ids).order(orderColumn, { ascending: false }).limit(limit)
      : supabase.from("users").select("*").in(ownerField, ids).limit(limit)
    const { data, error } = await query
    if (error) throw error
    rows = (data ?? []) as GenericRecord[]
  } else {
    const { data, error } = await baseQuery()
    if (error) throw error
    rows = (data ?? []) as GenericRecord[]
  }

  const followingIds = new Set(await listFollowingIds(supabase, userId))

  return rows
    .map((row, index) => {
      const id = String(row[ownerField] ?? row.id ?? "")
      return toSocialUserCard(row, {
        rank: index + 1,
        isSelf: id === userId,
        isFollowing: followingIds.has(id),
      })
    })
    .filter((item): item is SocialUserCard => item !== null)
}

export async function searchUsersByName(
  supabase: SupabaseClient,
  userId: string,
  ownerField: string,
  query: string,
  limit = 20,
): Promise<SocialUserCard[]> {
  const q = query.trim()
  if (!q) return []

  const nameColumns = await findExistingColumns(supabase, "users", ["nickname", "username", "name"])
  if (nameColumns.length === 0) return []

  const escaped = q.replace(/[%_,]/g, "")
  const filters = nameColumns.map((col) => `${col}.ilike.%${escaped}%`).join(",")

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .or(filters)
    .limit(Math.min(limit + 10, 50))

  if (error) throw error

  let followingIds = new Set<string>()
  try {
    followingIds = new Set(await listFollowingIds(supabase, userId))
  } catch {
    followingIds = new Set()
  }

  const lower = q.toLowerCase()

  const matched = ((data ?? []) as GenericRecord[])
    .filter((row) => {
      const id = String(row[ownerField] ?? row.id ?? "")
      if (!id || id === userId) return false
      return nameColumns.some((col) => {
        const value = row[col]
        return typeof value === "string" && value.toLowerCase().includes(lower)
      })
    })
    .slice(0, limit)

  return matched
    .map((row, index) =>
      toSocialUserCard(row, {
        rank: index + 1,
        isFollowing: followingIds.has(String(row[ownerField] ?? row.id ?? "")),
      }),
    )
    .filter((item): item is SocialUserCard => item !== null)
}

/** 对战胜利时累计 +1 胜场 */
export async function incrementBattleWin(
  supabase: SupabaseClient,
  userId: string,
  ownerField: string,
) {
  const userColumns = await findExistingColumns(supabase, "users", ["battle_wins", "battle_score", "updated_at"])
  const winsColumn = userColumns.includes("battle_wins")
    ? "battle_wins"
    : userColumns.includes("battle_score")
      ? "battle_score"
      : null
  if (!winsColumn) return null

  const userResult = await supabase.from("users").select("*").eq(ownerField, userId).limit(1).maybeSingle()
  if (userResult.error || !userResult.data) return null

  const row = userResult.data as GenericRecord
  const prev = readBattleWins(row)
  const next = prev + 1

  const payload: GenericRecord = { [winsColumn]: next }
  if (userColumns.includes("updated_at")) payload.updated_at = new Date().toISOString()

  const { error } = await supabase.from("users").update(payload).eq(ownerField, userId)
  if (error) throw error
  return next
}

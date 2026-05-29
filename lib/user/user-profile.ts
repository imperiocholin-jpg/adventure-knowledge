import {
  DEFAULT_USER_AVATAR_ID,
  getUserAvatarOption,
  isValidUserAvatarId,
  resolveUserAvatarSrc,
} from "@/lib/user/avatar-catalog"
import { resolveUserExpInLevel } from "@/lib/adventure/adventure-dashboard-client"

export const USER_PROFILE_STORAGE_KEY = "ak_user_profile_v1"
export const USER_PROFILE_UPDATED_EVENT = "ak-user-profile-updated"

export interface UserProfile {
  username: string
  level: number
  coins: number
  avatarId: string
  avatarSrc: string
  email: string | null
  schoolName: string | null
  gradeClass: string | null
  age: number | null
  dailyStreak: number
  adventureLevel: number
  experience: number
  userExpInLevel: number
  userExpToNext: number
  battleWins: number
}

export interface UserProfilePatch {
  avatarId?: string
  username?: string
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  username: "小冒险家",
  level: 1,
  coins: 0,
  avatarId: DEFAULT_USER_AVATAR_ID,
  avatarSrc: resolveUserAvatarSrc(DEFAULT_USER_AVATAR_ID),
  email: null,
  schoolName: null,
  gradeClass: null,
  age: null,
  dailyStreak: 0,
  adventureLevel: 1,
  experience: 0,
  userExpInLevel: 0,
  userExpToNext: 100,
  battleWins: 0,
}

function getStringField(row: Record<string, unknown>, fields: string[], fallback: string) {
  for (const field of fields) {
    const value = row[field]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return fallback
}

function getNumberField(row: Record<string, unknown>, fields: string[], fallback: number) {
  for (const field of fields) {
    const value = row[field]
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string") {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return fallback
}

function resolveAvatarIdFromRow(row: Record<string, unknown>): string {
  const raw = row.avatar_id ?? row.user_avatar_id ?? row.avatarId
  if (isValidUserAvatarId(raw)) return raw
  return DEFAULT_USER_AVATAR_ID
}

export function parseUserRecord(row: Record<string, unknown> | null): UserProfile {
  if (!row) return DEFAULT_USER_PROFILE

  const avatarId = resolveAvatarIdFromRow(row)
  const expRaw = getNumberField(row, ["experience", "user_exp", "exp"], 0)
  const expParts = resolveUserExpInLevel(expRaw)
  const adventureLevel = getNumberField(row, ["adventure_level", "chapter_level", "level", "user_level"], 1)
  const ageRaw = row.age
  const age =
    typeof ageRaw === "number" && ageRaw >= 5 && ageRaw <= 18
      ? Math.floor(ageRaw)
      : typeof ageRaw === "string" && Number(ageRaw) >= 5 && Number(ageRaw) <= 18
        ? Math.floor(Number(ageRaw))
        : null

  return {
    username: getStringField(row, ["nickname", "username", "name"], DEFAULT_USER_PROFILE.username),
    level: getNumberField(row, ["level", "user_level"], DEFAULT_USER_PROFILE.level),
    coins: getNumberField(row, ["coins", "coin", "points"], DEFAULT_USER_PROFILE.coins),
    avatarId,
    avatarSrc: resolveUserAvatarSrc(avatarId),
    email: getStringField(row, ["email"], "") || null,
    schoolName: getStringField(row, ["school_name", "school"], "") || null,
    gradeClass: getStringField(row, ["grade_class", "grade"], "") || null,
    age,
    dailyStreak: getNumberField(row, ["daily_streak", "streak", "reading_streak"], 0),
    adventureLevel: Math.max(1, Math.floor(adventureLevel)),
    experience: expParts.userExp,
    userExpInLevel: expParts.userExpInLevel,
    userExpToNext: expParts.userExpToNext,
    battleWins: getNumberField(row, ["battle_wins"], 0),
  }
}

export function readLocalUserProfilePatch(): UserProfilePatch | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(USER_PROFILE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as UserProfilePatch
    if (!parsed || typeof parsed !== "object") return null
    const patch: UserProfilePatch = {}
    if (isValidUserAvatarId(parsed.avatarId)) patch.avatarId = parsed.avatarId
    if (typeof parsed.username === "string" && parsed.username.trim()) {
      patch.username = parsed.username.trim().slice(0, 20)
    }
    return Object.keys(patch).length > 0 ? patch : null
  } catch {
    return null
  }
}

export function writeLocalUserProfilePatch(patch: UserProfilePatch) {
  if (typeof window === "undefined") return
  const existing = readLocalUserProfilePatch() ?? {}
  const next = { ...existing, ...patch }
  window.localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(USER_PROFILE_UPDATED_EVENT))
}

export function mergeUserProfile(base: UserProfile, patch: UserProfilePatch | null): UserProfile {
  if (!patch) return base
  const avatarId = patch.avatarId ?? base.avatarId
  return {
    ...base,
    username: patch.username ?? base.username,
    avatarId,
    avatarSrc: resolveUserAvatarSrc(avatarId),
  }
}

export async function saveUserAvatarToServer(avatarId: string): Promise<boolean> {
  return saveUserProfileToServer({ avatarId })
}

export async function saveUserProfileToServer(input: {
  avatarId?: string
  username?: string
  schoolName?: string
  gradeClass?: string
  age?: number
}): Promise<boolean> {
  try {
    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    const payload = await response.json()
    return Boolean(response.ok && payload?.ok)
  } catch {
    return false
  }
}

export async function persistUserAvatarChoice(avatarId: string) {
  writeLocalUserProfilePatch({ avatarId })
  await saveUserAvatarToServer(avatarId)
}

export function notifyUserProfileUpdated() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(USER_PROFILE_UPDATED_EVENT))
}

export { getUserAvatarOption }

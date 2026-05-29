import type { ProfileOverview } from "@/lib/profile/fetch-profile-overview"
import type { PetProfile } from "@/lib/pets/pet-profile"
import type { UserProfile } from "@/lib/user/user-profile"

const USER_CACHE_KEY = "ak_cached_user_profile_v1"
const PET_CACHE_KEY = "ak_cached_pet_profile_v1"
const OVERVIEW_CACHE_KEY = "ak_cached_profile_overview_v1"

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota / private mode
  }
}

export function readCachedUserProfile(): UserProfile | null {
  return readJson<UserProfile>(USER_CACHE_KEY)
}

export function writeCachedUserProfile(profile: UserProfile) {
  writeJson(USER_CACHE_KEY, profile)
}

export function readCachedPetProfile(): PetProfile | null {
  return readJson<PetProfile>(PET_CACHE_KEY)
}

export function writeCachedPetProfile(profile: PetProfile) {
  writeJson(PET_CACHE_KEY, profile)
}

export function readCachedProfileOverview(): ProfileOverview | null {
  return readJson<ProfileOverview>(OVERVIEW_CACHE_KEY)
}

export function writeCachedProfileOverview(overview: ProfileOverview) {
  writeJson(OVERVIEW_CACHE_KEY, overview)
}

export function clearProfileSessionCache() {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(USER_CACHE_KEY)
  window.sessionStorage.removeItem(PET_CACHE_KEY)
  window.sessionStorage.removeItem(OVERVIEW_CACHE_KEY)
}

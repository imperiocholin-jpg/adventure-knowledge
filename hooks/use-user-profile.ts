"use client"

import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_USER_PROFILE,
  mergeUserProfile,
  parseUserRecord,
  readLocalUserProfilePatch,
  USER_PROFILE_STORAGE_KEY,
  USER_PROFILE_UPDATED_EVENT,
  type UserProfile,
} from "@/lib/user/user-profile"

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const localPatch = readLocalUserProfilePatch()
      const response = await fetch("/api/users", { cache: "no-store" })
      const payload = await response.json()
      const row = Array.isArray(payload?.data) ? (payload.data[0] as Record<string, unknown>) : null
      const parsed = parseUserRecord(row)
      setProfile(mergeUserProfile(parsed, localPatch))
    } catch {
      const localPatch = readLocalUserProfilePatch()
      setProfile(mergeUserProfile(DEFAULT_USER_PROFILE, localPatch))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const handleProfileUpdated = () => {
      void refresh()
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key === USER_PROFILE_STORAGE_KEY) {
        void refresh()
      }
    }
    window.addEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdated)
    window.addEventListener("storage", handleStorage)
    return () => {
      window.removeEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdated)
      window.removeEventListener("storage", handleStorage)
    }
  }, [refresh])

  return { profile, isLoading, refresh }
}

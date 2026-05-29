"use client"

import { useCallback, useEffect, useState } from "react"

import { isUserProfileSetupCompleted } from "@/lib/auth/onboarding"
import {
  DEFAULT_USER_PROFILE,
  clearLocalUserProfilePatch,
  mergeUserProfile,
  parseUserRecord,
  readLocalUserProfilePatch,
  USER_PROFILE_STORAGE_KEY,
  USER_PROFILE_UPDATED_EVENT,
  type UserProfile,
} from "@/lib/user/user-profile"
import {
  readCachedUserProfile,
  writeCachedUserProfile,
} from "@/lib/profile/session-cache"

function createInitialState(): { profile: UserProfile; isLoading: boolean; hasCache: boolean } {
  const cached = readCachedUserProfile()
  if (cached) {
    return { profile: cached, isLoading: true, hasCache: true }
  }
  return { profile: DEFAULT_USER_PROFILE, isLoading: true, hasCache: false }
}

export function useUserProfile() {
  const [state, setState] = useState(createInitialState)

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))
    try {
      const response = await fetch("/api/users", { cache: "no-store" })
      const payload = await response.json()
      const row = Array.isArray(payload?.data) ? (payload.data[0] as Record<string, unknown>) : null
      if (row && isUserProfileSetupCompleted(row)) {
        clearLocalUserProfilePatch()
      }
      const localPatch = readLocalUserProfilePatch()
      const parsed = parseUserRecord(row)
      const profile = mergeUserProfile(parsed, localPatch)
      writeCachedUserProfile(profile)
      setState({ profile, isLoading: false, hasCache: true })
    } catch {
      const cached = readCachedUserProfile()
      const localPatch = readLocalUserProfilePatch()
      const profile = mergeUserProfile(cached ?? DEFAULT_USER_PROFILE, localPatch)
      setState({ profile, isLoading: false, hasCache: Boolean(cached) })
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

  const isDisplayReady = !state.isLoading || state.hasCache

  return {
    profile: state.profile,
    isLoading: state.isLoading,
    isDisplayReady,
    refresh,
  }
}

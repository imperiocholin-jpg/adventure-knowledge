"use client"

import { useCallback, useEffect, useState } from "react"

import { inferPetProfileCompleted } from "@/lib/auth/onboarding"
import {
  DEFAULT_PET_PROFILE,
  clearLocalPetProfilePatch,
  mergePetProfile,
  parsePetRecord,
  PET_PROFILE_STORAGE_KEY,
  PET_PROFILE_UPDATED_EVENT,
  readLocalPetProfilePatch,
  type PetProfile,
} from "@/lib/pets/pet-profile"
import { parsePetVitalsFromRecord } from "@/lib/pets/state"
import {
  readCachedPetProfile,
  writeCachedPetProfile,
} from "@/lib/profile/session-cache"

export interface PetProfileMeta {
  bond: number
  createdAt: string | null
}

const DEFAULT_PET_META: PetProfileMeta = { bond: 0, createdAt: null }

function createInitialState(): {
  profile: PetProfile
  meta: PetProfileMeta
  isLoading: boolean
  hasCache: boolean
} {
  const cached = readCachedPetProfile()
  if (cached) {
    return { profile: cached, meta: DEFAULT_PET_META, isLoading: true, hasCache: true }
  }
  return { profile: DEFAULT_PET_PROFILE, meta: DEFAULT_PET_META, isLoading: true, hasCache: false }
}

export function usePetProfile() {
  const [state, setState] = useState(createInitialState)

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))
    try {
      const response = await fetch("/api/pets", { cache: "no-store" })
      const payload = await response.json()
      const row = Array.isArray(payload?.data) ? (payload.data[0] as Record<string, unknown>) : null
      const serverComplete = row ? inferPetProfileCompleted(row) : false
      if (serverComplete) clearLocalPetProfilePatch()
      const localPatch = serverComplete ? null : readLocalPetProfilePatch()
      const parsed = parsePetRecord(row)
      const profile = mergePetProfile(parsed, localPatch, row)
      writeCachedPetProfile(profile)
      if (row) {
        const vitals = parsePetVitalsFromRecord(row)
        setState({
          profile,
          meta: {
            bond: vitals.bond,
            createdAt: typeof row.created_at === "string" ? row.created_at : null,
          },
          isLoading: false,
          hasCache: true,
        })
      } else {
        setState({ profile, meta: DEFAULT_PET_META, isLoading: false, hasCache: true })
      }
    } catch {
      const cached = readCachedPetProfile()
      const localPatch = readLocalPetProfilePatch()
      const profile = mergePetProfile(cached ?? DEFAULT_PET_PROFILE, localPatch)
      setState({
        profile,
        meta: DEFAULT_PET_META,
        isLoading: false,
        hasCache: Boolean(cached),
      })
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
      if (event.key === PET_PROFILE_STORAGE_KEY) {
        void refresh()
      }
    }
    window.addEventListener(PET_PROFILE_UPDATED_EVENT, handleProfileUpdated)
    window.addEventListener("storage", handleStorage)
    return () => {
      window.removeEventListener(PET_PROFILE_UPDATED_EVENT, handleProfileUpdated)
      window.removeEventListener("storage", handleStorage)
    }
  }, [refresh])

  const isDisplayReady = !state.isLoading || state.hasCache

  return {
    profile: state.profile,
    meta: state.meta,
    isLoading: state.isLoading,
    isDisplayReady,
    refresh,
  }
}

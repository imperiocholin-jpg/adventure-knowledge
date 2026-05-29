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

export interface PetProfileMeta {
  bond: number
  createdAt: string | null
}

const DEFAULT_PET_META: PetProfileMeta = { bond: 0, createdAt: null }

export function usePetProfile() {
  const [profile, setProfile] = useState<PetProfile>(DEFAULT_PET_PROFILE)
  const [meta, setMeta] = useState<PetProfileMeta>(DEFAULT_PET_META)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/pets", { cache: "no-store" })
      const payload = await response.json()
      const row = Array.isArray(payload?.data) ? (payload.data[0] as Record<string, unknown>) : null
      const serverComplete = row ? inferPetProfileCompleted(row) : false
      if (serverComplete) clearLocalPetProfilePatch()
      const localPatch = serverComplete ? null : readLocalPetProfilePatch()
      const parsed = parsePetRecord(row)
      setProfile(mergePetProfile(parsed, localPatch, row))
      if (row) {
        const vitals = parsePetVitalsFromRecord(row)
        setMeta({
          bond: vitals.bond,
          createdAt: typeof row.created_at === "string" ? row.created_at : null,
        })
      } else {
        setMeta(DEFAULT_PET_META)
      }
    } catch {
      const localPatch = readLocalPetProfilePatch()
      setProfile(mergePetProfile(DEFAULT_PET_PROFILE, localPatch))
      setMeta(DEFAULT_PET_META)
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

  return { profile, meta, isLoading, refresh }
}

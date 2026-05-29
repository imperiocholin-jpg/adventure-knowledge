"use client"



import { useCallback, useEffect, useState } from "react"

import { useParams, useRouter } from "next/navigation"

import { ArrowLeft } from "lucide-react"



import { UserHomeView } from "@/components/social/user-home-view"

import { UserHomeSkeleton } from "@/components/profile/profile-skeleton"

import { PlayerPageShell } from "@/components/layout/player-page-shell"

import { useFollowToggle } from "@/hooks/use-follow-toggle"

import type { PublicUserProfile } from "@/lib/social/types"



export default function UserHomePage() {

  const params = useParams<{ id: string }>()

  const router = useRouter()

  const userId = params.id

  const [profile, setProfile] = useState<PublicUserProfile | null>(null)

  const [error, setError] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(true)



  const loadProfile = useCallback(async () => {

    setError(null)

    try {

      const response = await fetch(`/api/social/users/${userId}`, { cache: "no-store" })

      const payload = await response.json()

      if (!response.ok) throw new Error(payload?.error?.message ?? "加载失败")

      const data = payload.data as PublicUserProfile

      if (data.isSelf) {

        router.replace("/profile")

        return

      }

      setProfile(data)

    } catch (loadError) {

      setProfile(null)

      setError(loadError instanceof Error ? loadError.message : "加载失败")

    } finally {

      setIsLoading(false)

    }

  }, [userId, router])



  useEffect(() => {

    setIsLoading(true)

    void loadProfile()

  }, [loadProfile])



  const { followLoadingId, toggleFollow } = useFollowToggle(loadProfile)



  const handleFollowToggle = async () => {

    if (!profile) return

    const result = await toggleFollow({ userId: profile.userId, isFollowing: profile.isFollowing })

    if (!result.ok) window.alert(result.error)

  }



  return (

    <PlayerPageShell bottomPad="compact" className="bg-background">

      <div className="px-4 pt-3">

        <button

          type="button"

          onClick={() => router.back()}

          className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground transition hover:bg-muted/80 active:scale-95"

        >

          <ArrowLeft className="h-4 w-4" />

        </button>

      </div>



      {isLoading ? (

        <UserHomeSkeleton />

      ) : error || !profile ? (

        <p className="px-4 py-8 text-center text-sm text-rose-600">{error ?? "用户不存在"}</p>

      ) : (

        <UserHomeView

          profile={profile}

          isFollowLoading={followLoadingId === profile.userId}

          onFollowToggle={() => void handleFollowToggle()}

        />

      )}

    </PlayerPageShell>

  )

}


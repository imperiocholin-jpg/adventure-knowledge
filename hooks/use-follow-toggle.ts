"use client"

import { useCallback, useState } from "react"

import { toggleFollowUser } from "@/lib/social/follow-client"
import type { SocialUserCard } from "@/lib/social/types"

export function useFollowToggle(onUpdated?: () => void | Promise<void>) {
  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null)
  const [followError, setFollowError] = useState<string | null>(null)

  const toggleFollow = useCallback(
    async (user: Pick<SocialUserCard, "userId" | "isFollowing">) => {
      setFollowLoadingId(user.userId)
      setFollowError(null)
      try {
        await toggleFollowUser(user.userId, Boolean(user.isFollowing))
        await onUpdated?.()
        return { ok: true as const }
      } catch (error) {
        const message = error instanceof Error ? error.message : "操作失败"
        setFollowError(message)
        return { ok: false as const, error: message }
      } finally {
        setFollowLoadingId(null)
      }
    },
    [onUpdated],
  )

  return { followLoadingId, followError, toggleFollow, clearFollowError: () => setFollowError(null) }
}

export function navigateToUserProfile(
  router: { push: (path: string) => void },
  user: Pick<SocialUserCard, "userId" | "isSelf">,
) {
  if (user.isSelf) {
    router.push("/profile")
    return
  }
  router.push(`/users/${user.userId}`)
}

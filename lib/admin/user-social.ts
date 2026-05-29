import {
  fetchFollowersList,
  fetchFollowingList,
  fetchSocialStats,
  getUsersOwnerField,
} from "@/lib/social/server"
import { fetchAuthEmailsByUserIds } from "@/lib/admin/auth-emails"
import { summarizeUserRow } from "@/lib/admin/record-fields"
import type { SocialUserCard } from "@/lib/social/types"

export async function fetchAdminUserSocialStats(serviceClient: any, userId: string) {
  const ownerField = await getUsersOwnerField(serviceClient)
  if (!ownerField) {
    return { followingCount: 0, followerCount: 0 }
  }
  try {
    const stats = await fetchSocialStats(serviceClient, userId, ownerField)
    return {
      followingCount: stats.followingCount,
      followerCount: stats.followerCount,
    }
  } catch {
    return { followingCount: 0, followerCount: 0 }
  }
}

export async function fetchAdminUserFollowing(serviceClient: any, userId: string) {
  const ownerField = await getUsersOwnerField(serviceClient)
  if (!ownerField) return []
  return fetchFollowingList(serviceClient, userId, ownerField)
}

export async function fetchAdminUserFollowers(serviceClient: any, userId: string) {
  const ownerField = await getUsersOwnerField(serviceClient)
  if (!ownerField) return []
  return fetchFollowersList(serviceClient, userId, ownerField)
}

export async function enrichSocialCardsWithEmail(
  serviceClient: any,
  ownerField: string,
  cards: SocialUserCard[],
) {
  if (cards.length === 0) return []

  const ids = cards.map((c) => c.userId)
  const authEmails = await fetchAuthEmailsByUserIds(serviceClient, ids)
  const { data } = await serviceClient.from("users").select("*").in(ownerField, ids)

  const rowById = new Map<string, Record<string, unknown>>()
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const id = String(row[ownerField] ?? row.id ?? "")
    if (id) rowById.set(id, row)
  }

  return cards.map((card) => {
    const row = rowById.get(card.userId)
    const email = authEmails.get(card.userId) ?? (row ? String(row.email ?? "") : "")
    const summary = row ? summarizeUserRow(row, email) : null
    return {
      ...card,
      email: email || "",
      schoolName: summary?.schoolName ?? null,
      gradeClass: summary?.gradeClass ?? null,
    }
  })
}

export type AdminSocialUserCard = SocialUserCard & {
  email: string
  schoolName: string | null
  gradeClass: string | null
}

import { NextRequest, NextResponse } from "next/server"

import {
  enrichSocialCardsWithEmail,
  fetchAdminUserFollowing,
} from "@/lib/admin/user-social"
import { getUsersOwnerField } from "@/lib/social/server"
import { setAuthCookies } from "@/lib/auth/server"
import { requireAdminApi } from "@/lib/auth/require-admin"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const { id } = await context.params
    const ownerField = await getUsersOwnerField(admin.serviceClient)
    if (!ownerField) {
      return NextResponse.json({ ok: false, error: { message: "users 表不可用" } }, { status: 422 })
    }

    const cards = await fetchAdminUserFollowing(admin.serviceClient, id)
    const list = await enrichSocialCardsWithEmail(admin.serviceClient, ownerField, cards)

    const response = NextResponse.json({ ok: true, data: { list } })
    if (admin.sessionState.refreshedSession) {
      setAuthCookies(response, admin.sessionState.refreshedSession)
    }
    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown error" } },
      { status: 503 },
    )
  }
}

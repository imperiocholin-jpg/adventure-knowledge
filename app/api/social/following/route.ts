import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { fetchFollowingList, getUsersOwnerField } from "@/lib/social/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user) return unauthorizedResponse("User is not authenticated.")

    const supabase = createSupabaseServiceClient()
    const ownerField = await getUsersOwnerField(supabase)
    if (!ownerField) {
      return NextResponse.json({ ok: false, error: { message: "users 表缺少主键字段。" } }, { status: 422 })
    }

    const list = await fetchFollowingList(supabase, sessionState.user.id, ownerField)
    const response = NextResponse.json({ ok: true, data: { list } })
    if (sessionState.refreshedSession) setAuthCookies(response, sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown server error" } },
      { status: 503 },
    )
  }
}

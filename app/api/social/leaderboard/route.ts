import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { fetchLeaderboard, getUsersOwnerField } from "@/lib/social/server"
import type { LeaderboardScope } from "@/lib/social/types"

export const dynamic = "force-dynamic"

function parseScope(value: string | null): LeaderboardScope {
  return value === "friends" ? "friends" : "global"
}

export async function GET(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user) return unauthorizedResponse("User is not authenticated.")

    const scope = parseScope(request.nextUrl.searchParams.get("scope"))
    const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? 50)
    const limit = Number.isFinite(limitRaw) ? Math.min(100, Math.max(1, Math.floor(limitRaw))) : 50

    const supabase = createSupabaseServiceClient()
    const ownerField = await getUsersOwnerField(supabase)
    if (!ownerField) {
      return NextResponse.json(
        { ok: false, error: { message: "users 表缺少主键字段。" } },
        { status: 422 },
      )
    }

    const list = await fetchLeaderboard(supabase, sessionState.user.id, ownerField, scope, limit)
    const response = NextResponse.json({ ok: true, data: { scope, list } })
    if (sessionState.refreshedSession) setAuthCookies(response, sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown server error" } },
      { status: 503 },
    )
  }
}

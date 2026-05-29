import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { fetchPublicUserProfile, getUsersOwnerField } from "@/lib/social/server"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user) return unauthorizedResponse("User is not authenticated.")

    const { id } = await context.params
    const supabase = createSupabaseServiceClient()
    const ownerField = await getUsersOwnerField(supabase)
    if (!ownerField) {
      return NextResponse.json({ ok: false, error: { message: "users 表缺少主键字段。" } }, { status: 422 })
    }

    const profile = await fetchPublicUserProfile(supabase, sessionState.user.id, id, ownerField)
    if (!profile) {
      return NextResponse.json({ ok: false, error: { message: "用户不存在。" } }, { status: 404 })
    }

    const response = NextResponse.json({ ok: true, data: profile })
    if (sessionState.refreshedSession) setAuthCookies(response, sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown server error" } },
      { status: 503 },
    )
  }
}

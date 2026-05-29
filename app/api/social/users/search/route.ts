import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { getUsersOwnerField, searchUsersByName } from "@/lib/social/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user) return unauthorizedResponse("User is not authenticated.")

    const q = request.nextUrl.searchParams.get("q") ?? ""
    const supabase = createSupabaseServiceClient()
    const ownerField = await getUsersOwnerField(supabase)
    if (!ownerField) {
      return NextResponse.json(
        { ok: false, error: { message: "users 表缺少主键字段。" } },
        { status: 422 },
      )
    }

    const list = await searchUsersByName(supabase, sessionState.user.id, ownerField, q)
    const response = NextResponse.json({ ok: true, data: { list } })
    if (sessionState.refreshedSession) setAuthCookies(response, sessionState.refreshedSession)
    return response
  } catch (error) {
    console.error("[social/users/search]", error)
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : "搜索失败，请稍后重试"
    return NextResponse.json({ ok: false, error: { message } }, { status: 503 })
  }
}

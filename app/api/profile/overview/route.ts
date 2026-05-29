import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  createSupabaseUserClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { fetchProfileOverview } from "@/lib/profile/fetch-profile-overview"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) {
      return unauthorizedResponse("User is not authenticated.")
    }

    const supabase = createSupabaseUserClient(sessionState.accessToken)
    const serviceClient = createSupabaseServiceClient()
    const overview = await fetchProfileOverview({
      supabase,
      serviceClient,
      userId: sessionState.user.id,
    })

    if (!overview) {
      return NextResponse.json(
        { ok: false, error: { message: "用户资料不存在。" } },
        { status: 404 },
      )
    }

    const response = NextResponse.json({ ok: true, data: overview })
    if (sessionState.refreshedSession) setAuthCookies(response, sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: { message: error instanceof Error ? error.message : "Unknown server error" },
      },
      { status: 503 },
    )
  }
}

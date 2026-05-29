import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  createSupabaseUserClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { countTodayDirectChallenges, getChallengeLimitSummary } from "@/lib/adventure/server-challenge"

export async function GET(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")

    const supabase = createSupabaseUserClient(sessionState.accessToken)
    const serviceClient = createSupabaseServiceClient()

    const countResult = await countTodayDirectChallenges({
      supabase,
      serviceClient,
      userId: sessionState.user.id,
    })

    if (countResult.error) {
      return NextResponse.json(
        {
          ok: false,
          source: "supabase",
          action: "count-direct-challenges",
          error: { message: countResult.error.message },
        },
        { status: 502 },
      )
    }

    const response = NextResponse.json({
      ok: true,
      data: getChallengeLimitSummary(countResult.count),
    })
    if (sessionState.refreshedSession) {
      setAuthCookies(response, sessionState.refreshedSession)
    }
    return response
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "server",
        action: "get-direct-challenge-usage",
        error: {
          message: error instanceof Error ? error.message : "Unknown server error",
        },
      },
      { status: 503 },
    )
  }
}


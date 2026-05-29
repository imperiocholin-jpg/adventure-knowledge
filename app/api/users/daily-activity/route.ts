import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  createSupabaseUserClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { syncUserTreasuresAfterActivity } from "@/lib/treasures/server"
import { recordUserDailyActivity } from "@/lib/user/daily-streak-server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) {
      return unauthorizedResponse("User is not authenticated.")
    }

    const supabase = createSupabaseUserClient(sessionState.accessToken)
    const serviceClient = createSupabaseServiceClient()
    const result = await recordUserDailyActivity(serviceClient, sessionState.user.id)

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          action: "record-daily-activity",
          error: result.error ?? { message: "记录连续天数失败。" },
        },
        { status: result.reason === "user_not_found" ? 404 : 502 },
      )
    }

    const treasureResult = await syncUserTreasuresAfterActivity({
      supabase,
      serviceClient,
      userId: sessionState.user.id,
    })

    const response = NextResponse.json({
      ok: true,
      data: {
        applied: result.applied,
        dailyStreak: result.dailyStreak,
        lastActiveDate: result.lastActiveDate,
        reason: result.reason,
        newlyUnlockedTreasures: treasureResult.newlyUnlocked,
      },
    })
    if (sessionState.refreshedSession) {
      setAuthCookies(response, sessionState.refreshedSession)
    }
    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      {
        ok: false,
        source: "server",
        action: "record-daily-activity",
        error: {
          message: error instanceof Error ? error.message : "Unknown server error",
        },
      },
      { status: 503 },
    )
  }
}

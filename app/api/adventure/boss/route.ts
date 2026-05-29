import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  createSupabaseUserClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { buildBossChallengeSnapshot } from "@/lib/adventure/boss-eligibility"
import { fetchUserReadingRows } from "@/lib/adventure/boss-server"
import { getRegionBossConfig } from "@/lib/adventure/region-boss"
import { fetchUserAdventureProgress } from "@/lib/adventure/server-progress"
import { ADVENTURE_REGION_IDS } from "@/lib/library/adventure-regions"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) {
      return unauthorizedResponse("User is not authenticated.")
    }

    const regionId = request.nextUrl.searchParams.get("regionId") ?? ""
    if (!ADVENTURE_REGION_IDS.includes(regionId as (typeof ADVENTURE_REGION_IDS)[number])) {
      return NextResponse.json({ ok: false, error: { message: "无效的区域 ID。" } }, { status: 400 })
    }

    const supabase = createSupabaseUserClient(sessionState.accessToken)
    const serviceClient = createSupabaseServiceClient()
    const [readingRows, progressResult] = await Promise.all([
      fetchUserReadingRows({
        supabase,
        serviceClient,
        userId: sessionState.user.id,
      }),
      fetchUserAdventureProgress({
        supabase,
        serviceClient,
        userId: sessionState.user.id,
      }),
    ])

    const regionProgress = progressResult.data?.regionProgress?.[regionId]?.progress ?? 0

    const snapshot = buildBossChallengeSnapshot({
      regionId,
      regionProgress,
      readingRows,
    })

    const response = NextResponse.json({
      ok: true,
      data: {
        ...snapshot,
        boss: snapshot.boss ?? getRegionBossConfig(regionId),
      },
    })
    if (sessionState.refreshedSession) setAuthCookies(response, sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown server error" } },
      { status: 503 },
    )
  }
}

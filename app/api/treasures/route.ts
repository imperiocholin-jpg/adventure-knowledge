import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  createSupabaseUserClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { TREASURE_HOME_PREVIEW_IDS } from "@/lib/treasures/definitions"
import { syncUserTreasures } from "@/lib/treasures/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) {
      return unauthorizedResponse("User is not authenticated.")
    }

    const supabase = createSupabaseUserClient(sessionState.accessToken)
    const serviceClient = createSupabaseServiceClient()
    const result = await syncUserTreasures({
      supabase,
      serviceClient,
      userId: sessionState.user.id,
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          action: "list-treasures",
          error: result.error ?? { message: "加载神秘宝藏失败。" },
        },
        { status: 502 },
      )
    }

    const unlockedCount = result.items.filter((item) => item.unlocked).length
    const previewIds = new Set<string>(TREASURE_HOME_PREVIEW_IDS)
    const preview = result.items.filter((item) => previewIds.has(item.id))

    const response = NextResponse.json({
      ok: true,
      data: {
        items: result.items,
        preview: preview.length > 0 ? preview : result.items.slice(0, 5),
        unlockedCount,
        totalCount: result.items.length,
        newlyUnlocked: result.newlyUnlocked,
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
        action: "list-treasures",
        error: {
          message: error instanceof Error ? error.message : "Unknown server error",
        },
      },
      { status: 503 },
    )
  }
}

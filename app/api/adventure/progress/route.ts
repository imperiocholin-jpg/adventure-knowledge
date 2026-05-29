import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  createSupabaseUserClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { fetchUserAdventureProgress } from "@/lib/adventure/server-progress"

export async function GET(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")

    const supabase = createSupabaseUserClient(sessionState.accessToken)
    const serviceClient = createSupabaseServiceClient()
    const progressResult = await fetchUserAdventureProgress({
      supabase,
      serviceClient,
      userId: sessionState.user.id,
    })

    if (progressResult.error) {
      return NextResponse.json(
        {
          ok: false,
          source: "supabase",
          action: "fetch-adventure-progress",
          error: { message: progressResult.error.message },
        },
        { status: 502 },
      )
    }

    const response = NextResponse.json({
      ok: true,
      data: progressResult.data,
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
        action: "get-adventure-progress",
        error: { message: error instanceof Error ? error.message : "Unknown server error" },
      },
      { status: 503 },
    )
  }
}


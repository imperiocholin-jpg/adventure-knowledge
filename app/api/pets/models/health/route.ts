import { NextRequest, NextResponse } from "next/server"

import { getRequestSessionUser, setAuthCookies, unauthorizedResponse } from "@/lib/auth/server"
import { scanPetModelHealth } from "@/lib/pets/model-health"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) {
      return unauthorizedResponse("User is not authenticated.")
    }

    const report = await scanPetModelHealth()
    const response = NextResponse.json({
      ok: true,
      data: report,
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
        action: "scan-pet-model-health",
        error: { message: error instanceof Error ? error.message : "Unknown server error" },
      },
      { status: 503 },
    )
  }
}


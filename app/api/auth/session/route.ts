import { NextRequest, NextResponse } from "next/server"

import { ensureUserBootstrap } from "@/lib/auth/bootstrap"
import {
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"

export async function GET(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user) {
      return unauthorizedResponse("User is not authenticated.")
    }

    const bootstrap = await ensureUserBootstrap(sessionState.user)
    if (!bootstrap.ok) {
      console.error(bootstrap.error)
      return NextResponse.json(
        { ok: false, error: { message: "Failed to initialize user data." } },
        { status: 502 },
      )
    }

    const response = NextResponse.json({
      ok: true,
      data: {
        user: {
          id: sessionState.user.id,
          email: sessionState.user.email,
        },
      },
    })

    if (sessionState.refreshedSession) {
      setAuthCookies(response, sessionState.refreshedSession)
    }
    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown server error" } },
      { status: 503 },
    )
  }
}

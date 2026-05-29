import { NextRequest, NextResponse } from "next/server"

import { loadShopItems } from "@/lib/admin/shop-store"
import { getRequestSessionUser, setAuthCookies, unauthorizedResponse } from "@/lib/auth/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user) return unauthorizedResponse("User is not authenticated.")

    const items = await loadShopItems()
    const response = NextResponse.json({ ok: true, data: { items } })
    if (sessionState.refreshedSession) setAuthCookies(response, sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown error" } },
      { status: 503 },
    )
  }
}

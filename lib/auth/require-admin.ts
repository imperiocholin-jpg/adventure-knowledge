import { NextRequest, NextResponse } from "next/server"

import { isAdminEmail, resolveUserRole } from "@/lib/admin/audit-log"
import { createSupabaseServiceClient, getRequestSessionUser, unauthorizedResponse } from "@/lib/auth/server"

export function forbiddenResponse(message = "Admin access required.") {
  return NextResponse.json(
    {
      ok: false,
      source: "auth",
      error: { message },
    },
    { status: 403 },
  )
}

export async function requireAdminApi(request: NextRequest) {
  const sessionState = await getRequestSessionUser(request)
  if (!sessionState.user || !sessionState.accessToken) {
    return {
      ok: false as const,
      response: unauthorizedResponse("User is not authenticated."),
    }
  }

  const serviceClient = createSupabaseServiceClient()
  const role = await resolveUserRole(serviceClient, sessionState.user.id)
  const allowed = role === "admin" || isAdminEmail(sessionState.user.email)

  if (!allowed) {
    return {
      ok: false as const,
      response: forbiddenResponse(),
    }
  }

  return {
    ok: true as const,
    sessionState,
    serviceClient,
    adminUserId: sessionState.user.id,
  }
}

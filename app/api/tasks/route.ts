import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseUserClient,
  createSupabaseServiceClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { findExistingColumn } from "@/lib/data/schema-compat"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")

    const supabase = createSupabaseUserClient(sessionState.accessToken)
    const serviceClient = createSupabaseServiceClient()
    const ownerField = await findExistingColumn(serviceClient, "daily_tasks", [
      "user_id",
      "uid",
      "owner_id",
      "auth_user_id",
    ])
    if (!ownerField) {
      const response = NextResponse.json({ ok: true, data: [] })
      if (sessionState.refreshedSession) {
        setAuthCookies(response, sessionState.refreshedSession)
      }
      return response
    }

    const { data, error } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq(ownerField, sessionState.user.id)

    if (error) {
      console.error(error)
      return NextResponse.json(
        {
          ok: false,
          source: "supabase",
          table: "daily_tasks",
          error: {
            message: error.message,
            code: error.code ?? null,
            details: error.details ?? null,
            hint: error.hint ?? null,
          },
          data: [],
        },
        { status: 502 },
      )
    }

    const response = NextResponse.json({ ok: true, data: data ?? [] })
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
        table: "daily_tasks",
        error: {
          message: error instanceof Error ? error.message : "Unknown server error",
        },
        data: [],
      },
      { status: 503 },
    )
  }
}

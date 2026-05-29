import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseUserClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")

    const supabase = createSupabaseUserClient(sessionState.accessToken)

    const { data, error } = await supabase.from("books").select("*")

    if (error) {
      console.error(error)
      return NextResponse.json(
        {
          ok: false,
          source: "supabase",
          table: "books",
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
        table: "books",
        error: {
          message: error instanceof Error ? error.message : "Unknown server error",
        },
        data: [],
      },
      { status: 503 },
    )
  }
}

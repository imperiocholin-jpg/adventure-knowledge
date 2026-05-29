import { NextRequest, NextResponse } from "next/server"

import { resolveReadingOwnerField, resolveUsersOwnerField } from "@/lib/admin/record-fields"
import { setAuthCookies } from "@/lib/auth/server"
import { requireAdminApi } from "@/lib/auth/require-admin"
import { findExistingColumn } from "@/lib/data/schema-compat"
import { getTodayDateKey } from "@/lib/user/daily-streak"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const { serviceClient } = admin
    const today = getTodayDateKey()

    const [usersCount, petsDead, lastActiveField, readingOwnerField] = await Promise.all([
      serviceClient.from("users").select("*", { count: "exact", head: true }),
      serviceClient.from("pets").select("*", { count: "exact", head: true }).eq("is_dead", true),
      findExistingColumn(serviceClient, "users", ["last_active_date", "last_streak_date"]),
      resolveReadingOwnerField(serviceClient),
    ])

    let activeToday = 0
    if (lastActiveField) {
      const activeResult = await serviceClient
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq(lastActiveField, today)
      activeToday = activeResult.count ?? 0
    }

    let readingToday = 0
    if (readingOwnerField) {
      const start = `${today}T00:00:00.000Z`
      const end = `${today}T23:59:59.999Z`
      const readingResult = await serviceClient
        .from("reading_records")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start)
        .lte("created_at", end)
      readingToday = readingResult.count ?? 0
    }

    const response = NextResponse.json({
      ok: true,
      data: {
        totalUsers: usersCount.count ?? 0,
        activeToday,
        readingToday,
        deadPets: petsDead.count ?? 0,
      },
    })
    if (admin.sessionState.refreshedSession) {
      setAuthCookies(response, admin.sessionState.refreshedSession)
    }
    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown error" } },
      { status: 503 },
    )
  }
}

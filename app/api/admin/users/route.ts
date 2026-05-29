import { NextRequest, NextResponse } from "next/server"

import { writeAdminAuditLog } from "@/lib/admin/audit-log"
import { fetchAuthEmailsByUserIds } from "@/lib/admin/auth-emails"
import { getString, resolveUsersOwnerField, summarizeUserRow } from "@/lib/admin/record-fields"
import { createSockUser } from "@/lib/admin/user-lifecycle"
import { setAuthCookies } from "@/lib/auth/server"
import { requireAdminApi } from "@/lib/auth/require-admin"
import { findExistingColumn } from "@/lib/data/schema-compat"

export const dynamic = "force-dynamic"

interface CreateAdminUserBody {
  email?: string
  password?: string
  nickname?: string
  schoolName?: string
  gradeClass?: string
  age?: number | string
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const { serviceClient } = admin
    const ownerField = await resolveUsersOwnerField(serviceClient)
    if (!ownerField) {
      return NextResponse.json({ ok: false, error: { message: "users 表不可用" } }, { status: 422 })
    }

    const url = new URL(request.url)
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase()
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1)
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? "20") || 20))
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = serviceClient.from("users").select("*", { count: "exact" }).order("created_at", {
      ascending: false,
    })

    if (q) {
      const emailField = await findExistingColumn(serviceClient, "users", ["email"])
      const nicknameField = await findExistingColumn(serviceClient, "users", ["nickname", "username", "name"])
      const schoolField = await findExistingColumn(serviceClient, "users", ["school_name", "school"])
      const gradeField = await findExistingColumn(serviceClient, "users", ["grade_class", "grade"])
      const filters: string[] = []
      if (emailField) filters.push(`${emailField}.ilike.%${q}%`)
      if (nicknameField) filters.push(`${nicknameField}.ilike.%${q}%`)
      if (schoolField) filters.push(`${schoolField}.ilike.%${q}%`)
      if (gradeField) filters.push(`${gradeField}.ilike.%${q}%`)
      if (filters.length > 0) {
        query = query.or(filters.join(","))
      }
    }

    const result = await query.range(from, to)
    if (result.error) {
      return NextResponse.json({ ok: false, error: { message: result.error.message } }, { status: 502 })
    }

    const rows = (result.data ?? []) as Record<string, unknown>[]
    const ids = rows.map((row) => getString(row, ["id", "user_id", "uid"])).filter(Boolean)
    const authEmails = await fetchAuthEmailsByUserIds(serviceClient, ids)

    const items = rows.map((row) => {
      const id = getString(row, ["id", "user_id", "uid"])
      const dbEmail = getString(row, ["email"])
      const email = dbEmail || authEmails.get(id) || ""
      return summarizeUserRow(row, email)
    })

    const response = NextResponse.json({
      ok: true,
      data: {
        items,
        page,
        pageSize,
        total: result.count ?? items.length,
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

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const body = (await request.json()) as CreateAdminUserBody
    const created = await createSockUser(admin.serviceClient, {
      email: body.email ?? "",
      password: body.password ?? "",
      nickname: body.nickname,
      schoolName: body.schoolName,
      gradeClass: body.gradeClass,
      age: body.age,
    })

    if (!created.ok) {
      return NextResponse.json({ ok: false, error: { message: created.error } }, { status: 400 })
    }

    await writeAdminAuditLog(admin.serviceClient, {
      adminUserId: admin.adminUserId,
      action: "create_user",
      targetType: "user",
      targetId: created.user.id,
      payload: { email: body.email, nickname: body.nickname },
    })

    const authEmails = await fetchAuthEmailsByUserIds(admin.serviceClient, [created.user.id])
    const row = created.row ?? {}
    const response = NextResponse.json({
      ok: true,
      data: summarizeUserRow(row, authEmails.get(created.user.id) ?? created.user.email ?? ""),
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

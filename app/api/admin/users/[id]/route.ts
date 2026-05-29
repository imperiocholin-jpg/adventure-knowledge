import { NextRequest, NextResponse } from "next/server"

import { writeAdminAuditLog } from "@/lib/admin/audit-log"
import { fetchAuthEmailsByUserIds } from "@/lib/admin/auth-emails"
import { fetchAdminUserDetail } from "@/lib/admin/user-detail"
import {
  assertUserDeletable,
  deleteUserCompletely,
} from "@/lib/admin/user-lifecycle"
import {
  getString,
  resolveField,
  resolveUsersIdField,
  resolveUsersOwnerField,
  summarizeUserRow,
} from "@/lib/admin/record-fields"
import { setAuthCookies } from "@/lib/auth/server"
import { requireAdminApi } from "@/lib/auth/require-admin"
import { findExistingColumns } from "@/lib/data/schema-compat"

type GenericRecord = Record<string, unknown>

interface PatchAdminUserBody {
  coins?: number
  dailyStreak?: number
  lastActiveDate?: string | null
  experience?: number
  level?: number
}

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const { id } = await context.params
    const detail = await fetchAdminUserDetail(admin.serviceClient, id)
    if (!detail.ok) {
      return NextResponse.json(
        { ok: false, error: { message: detail.error } },
        { status: detail.notFound ? 404 : 502 },
      )
    }

    const response = NextResponse.json({ ok: true, data: detail.data })
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

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const { id } = await context.params
    const body = (await request.json()) as PatchAdminUserBody
    const ownerField = await resolveUsersOwnerField(admin.serviceClient)
    const idField = await resolveUsersIdField(admin.serviceClient)
    if (!ownerField || !idField) {
      return NextResponse.json({ ok: false, error: { message: "users 表字段不完整" } }, { status: 422 })
    }

    const existing = await admin.serviceClient.from("users").select("*").eq(ownerField, id).limit(1).maybeSingle()
    if (existing.error || !existing.data) {
      return NextResponse.json({ ok: false, error: { message: "用户不存在" } }, { status: 404 })
    }

    const row = existing.data as GenericRecord
    const writable = await findExistingColumns(admin.serviceClient, "users", [
      "coins",
      "gold",
      "coin_balance",
      "daily_streak",
      "streak",
      "reading_streak",
      "last_active_date",
      "last_streak_date",
      "experience",
      "exp",
      "user_exp",
      "level",
      "user_level",
      "updated_at",
    ])

    const payload: GenericRecord = {}
    if (typeof body.coins === "number" && Number.isFinite(body.coins)) {
      const field = resolveField(row, ["coins", "gold", "coin_balance"]) ?? writable.find((f) =>
        ["coins", "gold", "coin_balance"].includes(f),
      )
      if (field) payload[field] = Math.max(0, Math.floor(body.coins))
    }
    if (typeof body.dailyStreak === "number" && Number.isFinite(body.dailyStreak)) {
      const field = resolveField(row, ["daily_streak", "streak", "reading_streak"]) ??
        writable.find((f) => ["daily_streak", "streak", "reading_streak"].includes(f))
      if (field) payload[field] = Math.max(0, Math.floor(body.dailyStreak))
    }
    if (body.lastActiveDate !== undefined) {
      const field = resolveField(row, ["last_active_date", "last_streak_date"]) ??
        writable.find((f) => ["last_active_date", "last_streak_date"].includes(f))
      if (field) payload[field] = body.lastActiveDate
    }
    if (typeof body.experience === "number" && Number.isFinite(body.experience)) {
      const field = resolveField(row, ["experience", "exp", "user_exp"]) ??
        writable.find((f) => ["experience", "exp", "user_exp"].includes(f))
      if (field) payload[field] = Math.max(0, Math.floor(body.experience))
    }
    if (typeof body.level === "number" && Number.isFinite(body.level)) {
      const field = resolveField(row, ["level", "user_level", "adventure_level"]) ??
        writable.find((f) => ["level", "user_level", "adventure_level"].includes(f))
      if (field) payload[field] = Math.max(1, Math.floor(body.level))
    }
    if (writable.includes("updated_at")) payload.updated_at = new Date().toISOString()

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ ok: false, error: { message: "没有可更新的字段" } }, { status: 400 })
    }

    const updateResult = await admin.serviceClient
      .from("users")
      .update(payload)
      .eq(idField, row[idField])
      .select("*")
      .limit(1)

    if (updateResult.error) {
      return NextResponse.json({ ok: false, error: { message: updateResult.error.message } }, { status: 502 })
    }

    await writeAdminAuditLog(admin.serviceClient, {
      adminUserId: admin.adminUserId,
      action: "patch_user",
      targetType: "user",
      targetId: id,
      payload: body as Record<string, unknown>,
    })

    const updated = (updateResult.data?.[0] ?? row) as GenericRecord
    const authEmails = await fetchAuthEmailsByUserIds(admin.serviceClient, [id])
    const response = NextResponse.json({
      ok: true,
      data: summarizeUserRow(updated, authEmails.get(id) ?? getString(updated, ["email"])),
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

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const { id } = await context.params
    const check = await assertUserDeletable(admin.serviceClient, id, admin.adminUserId)
    if (!check.ok) {
      return NextResponse.json(
        { ok: false, error: { message: check.error } },
        { status: "notFound" in check && check.notFound ? 404 : 400 },
      )
    }

    const deleted = await deleteUserCompletely(admin.serviceClient, id)
    if (!deleted.ok) {
      return NextResponse.json({ ok: false, error: { message: deleted.error } }, { status: 502 })
    }

    await writeAdminAuditLog(admin.serviceClient, {
      adminUserId: admin.adminUserId,
      action: "delete_user",
      targetType: "user",
      targetId: id,
      payload: {},
    })

    const response = NextResponse.json({ ok: true, data: { id } })
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

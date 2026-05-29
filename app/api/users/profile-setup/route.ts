import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { findExistingColumn, findExistingColumns } from "@/lib/data/schema-compat"
import { isValidUserAvatarId } from "@/lib/user/avatar-catalog"
import {
  normalizeAge,
  normalizeGradeClass,
  normalizeSchoolName,
} from "@/lib/user/profile-fields"

type GenericRecord = Record<string, unknown>

interface ProfileSetupPayload {
  username?: string
  avatarId?: string
  schoolName?: string
  gradeClass?: string
  age?: number | string
}

function normalizeUsername(value: unknown) {
  if (typeof value !== "string") return null
  const trimmed = value.trim().slice(0, 20)
  if (trimmed.length < 2) return null
  return trimmed
}

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user) return unauthorizedResponse("User is not authenticated.")

    const body = (await request.json()) as ProfileSetupPayload
    const username = normalizeUsername(body.username)
    const avatarId = isValidUserAvatarId(body.avatarId) ? body.avatarId : null
    const schoolName = normalizeSchoolName(body.schoolName)
    const gradeClass = normalizeGradeClass(body.gradeClass)
    const age = normalizeAge(body.age)

    if (!username) {
      return NextResponse.json({ ok: false, error: { message: "昵称至少 2 个字。" } }, { status: 400 })
    }
    if (!avatarId) {
      return NextResponse.json({ ok: false, error: { message: "请选择头像。" } }, { status: 400 })
    }
    if (!schoolName) {
      return NextResponse.json({ ok: false, error: { message: "请填写就读学校（至少 2 个字）。" } }, { status: 400 })
    }
    if (!gradeClass) {
      return NextResponse.json({ ok: false, error: { message: "请填写年级班级（如：三年级2班）。" } }, { status: 400 })
    }
    if (age === null) {
      return NextResponse.json({ ok: false, error: { message: "请填写年龄（5～18 岁）。" } }, { status: 400 })
    }

    const supabase = createSupabaseServiceClient()
    const ownerField = await findExistingColumn(supabase, "users", ["id", "user_id", "uid", "auth_user_id"])
    if (!ownerField) {
      return NextResponse.json({ ok: false, error: { message: "users 表缺少主键字段。" } }, { status: 422 })
    }

    const writableColumns = await findExistingColumns(supabase, "users", [
      "nickname",
      "username",
      "name",
      "avatar_id",
      "user_avatar_id",
      "email",
      "school_name",
      "grade_class",
      "age",
      "profile_setup_completed",
      "updated_at",
    ])

    const payload: GenericRecord = {}
    if (writableColumns.includes("nickname")) payload.nickname = username
    if (writableColumns.includes("username")) payload.username = username
    if (writableColumns.includes("name")) payload.name = username
    if (writableColumns.includes("avatar_id")) payload.avatar_id = avatarId
    if (writableColumns.includes("user_avatar_id")) payload.user_avatar_id = avatarId
    if (writableColumns.includes("email") && sessionState.user.email) payload.email = sessionState.user.email
    if (writableColumns.includes("school_name")) payload.school_name = schoolName
    if (writableColumns.includes("grade_class")) payload.grade_class = gradeClass
    if (writableColumns.includes("age")) payload.age = age
    if (writableColumns.includes("profile_setup_completed")) payload.profile_setup_completed = true
    if (writableColumns.includes("updated_at")) payload.updated_at = new Date().toISOString()

    const updateResult = await supabase
      .from("users")
      .update(payload)
      .eq(ownerField, sessionState.user.id)
      .select("*")
      .limit(1)

    if (updateResult.error) {
      return NextResponse.json({ ok: false, error: { message: updateResult.error.message } }, { status: 502 })
    }

    const response = NextResponse.json({ ok: true, data: updateResult.data?.[0] ?? null })
    if (sessionState.refreshedSession) setAuthCookies(response, sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown server error" } },
      { status: 503 },
    )
  }
}

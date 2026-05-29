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

interface PatchUserPayload {
  avatarId?: string
  username?: string
  schoolName?: string
  gradeClass?: string
  age?: number | string
}

function normalizeUsername(value: unknown) {
  if (typeof value !== "string") return null
  const trimmed = value.trim().slice(0, 20)
  return trimmed.length >= 2 ? trimmed : null
}

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")

    const serviceClient = createSupabaseServiceClient()
    const ownerField = await findExistingColumn(serviceClient, "users", [
      "id",
      "user_id",
      "uid",
      "auth_user_id",
    ])
    if (!ownerField) {
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          table: "users",
          error: { message: "users table missing ownership field." },
          data: [],
        },
        { status: 422 },
      )
    }

    // 使用 service role 按当前登录用户 id 读取，避免 users 表 RLS 误配 user_id 导致读不到 coins
    const { data, error } = await serviceClient
      .from("users")
      .select("*")
      .eq(ownerField, sessionState.user.id)

    if (error) {
      console.error(error)
      return NextResponse.json(
        {
          ok: false,
          source: "supabase",
          table: "users",
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
        table: "users",
        error: {
          message: error instanceof Error ? error.message : "Unknown server error",
        },
        data: [],
      },
      { status: 503 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")

    const body = (await request.json()) as PatchUserPayload
    const avatarId = isValidUserAvatarId(body.avatarId) ? body.avatarId : null
    const username = body.username !== undefined ? normalizeUsername(body.username) : undefined
    const schoolName = body.schoolName !== undefined ? normalizeSchoolName(body.schoolName) : undefined
    const gradeClass = body.gradeClass !== undefined ? normalizeGradeClass(body.gradeClass) : undefined
    const age = body.age !== undefined ? normalizeAge(body.age) : undefined

    if (body.avatarId !== undefined && !avatarId) {
      return NextResponse.json({ ok: false, error: { message: "无效的头像 ID。" } }, { status: 400 })
    }
    if (body.username !== undefined && !username) {
      return NextResponse.json({ ok: false, error: { message: "昵称至少 2 个字。" } }, { status: 400 })
    }
    if (body.schoolName !== undefined && body.schoolName !== "" && !schoolName) {
      return NextResponse.json({ ok: false, error: { message: "学校名称至少 2 个字。" } }, { status: 400 })
    }
    if (body.gradeClass !== undefined && body.gradeClass !== "" && !gradeClass) {
      return NextResponse.json({ ok: false, error: { message: "年级班级至少 2 个字。" } }, { status: 400 })
    }
    if (body.age !== undefined && body.age !== "" && age === null) {
      return NextResponse.json({ ok: false, error: { message: "年龄请填写 5～18 岁。" } }, { status: 400 })
    }

    const hasUpdate =
      avatarId ||
      username !== undefined ||
      schoolName !== undefined ||
      gradeClass !== undefined ||
      age !== undefined
    if (!hasUpdate) {
      return NextResponse.json({ ok: false, error: { message: "没有可更新的字段。" } }, { status: 400 })
    }

    const serviceClient = createSupabaseServiceClient()
    const ownerField = await findExistingColumn(serviceClient, "users", [
      "id",
      "user_id",
      "uid",
      "auth_user_id",
    ])
    if (!ownerField) {
      return NextResponse.json({ ok: false, error: { message: "users 表缺少用户归属字段。" } }, { status: 422 })
    }

    const writableColumns = await findExistingColumns(serviceClient, "users", [
      "nickname",
      "username",
      "name",
      "avatar_id",
      "user_avatar_id",
      "school_name",
      "grade_class",
      "age",
      "updated_at",
    ])

    const userResult = await serviceClient
      .from("users")
      .select("*")
      .eq(ownerField, sessionState.user.id)
      .limit(1)
      .maybeSingle()

    if (userResult.error || !userResult.data) {
      return NextResponse.json(
        { ok: false, error: { message: userResult.error?.message ?? "未找到用户记录。" } },
        { status: 404 },
      )
    }

    const userRow = userResult.data as GenericRecord

    const updatePayload: GenericRecord = {}
    if (avatarId && writableColumns.includes("avatar_id")) updatePayload.avatar_id = avatarId
    if (avatarId && writableColumns.includes("user_avatar_id")) updatePayload.user_avatar_id = avatarId
    if (username !== undefined) {
      if (writableColumns.includes("nickname")) updatePayload.nickname = username
      if (writableColumns.includes("username")) updatePayload.username = username
      if (writableColumns.includes("name")) updatePayload.name = username
    }
    if (schoolName !== undefined && writableColumns.includes("school_name")) {
      updatePayload.school_name = schoolName
    }
    if (gradeClass !== undefined && writableColumns.includes("grade_class")) {
      updatePayload.grade_class = gradeClass
    }
    if (age !== undefined && writableColumns.includes("age")) {
      updatePayload.age = age
    }
    if (writableColumns.includes("updated_at")) updatePayload.updated_at = new Date().toISOString()

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { ok: true, data: userRow, warning: "users 表尚未添加 avatar_id 列，头像仅保存在本地。" },
      )
    }

    const updateResult = await serviceClient
      .from("users")
      .update(updatePayload)
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

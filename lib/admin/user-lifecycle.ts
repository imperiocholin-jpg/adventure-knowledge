import type { User } from "@supabase/supabase-js"

import { fetchAuthEmailsByUserIds } from "@/lib/admin/auth-emails"
import { isAdminEmail, resolveUserRole } from "@/lib/admin/audit-log"
import { getString, resolveUsersOwnerField } from "@/lib/admin/record-fields"
import { ensureUserBootstrap } from "@/lib/auth/bootstrap"
import { findExistingColumn, findExistingColumns } from "@/lib/data/schema-compat"
import { DEFAULT_USER_AVATAR_ID, isValidUserAvatarId } from "@/lib/user/avatar-catalog"
import {
  normalizeAge,
  normalizeGradeClass,
  normalizeSchoolName,
} from "@/lib/user/profile-fields"

type GenericRecord = Record<string, unknown>

export interface CreateSockUserInput {
  email: string
  password: string
  nickname?: string
  schoolName?: string
  gradeClass?: string
  age?: number | string
  avatarId?: string
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return null
  const email = value.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

function normalizePassword(value: unknown) {
  if (typeof value !== "string") return null
  const password = value.trim()
  if (password.length < 6) return null
  return password
}

function nicknameFromEmail(email: string) {
  const left = email.split("@")[0]?.trim()
  return left && left.length >= 2 ? left.slice(0, 20) : "测试马甲"
}

export async function isProtectedAdminUser(serviceClient: any, userId: string) {
  const role = await resolveUserRole(serviceClient, userId)
  if (role === "admin") return true
  const emails = await fetchAuthEmailsByUserIds(serviceClient, [userId])
  return isAdminEmail(emails.get(userId))
}

async function deleteByOwnerField(serviceClient: any, table: string, userId: string) {
  if (table === "user_follows") {
    await serviceClient.from(table).delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`)
    return
  }

  if (table === "users") {
    const ownerField = await findExistingColumn(serviceClient, "users", ["id", "user_id", "uid", "auth_user_id"])
    if (!ownerField) return
    await serviceClient.from(table).delete().eq(ownerField, userId)
    return
  }

  const ownerField = await findExistingColumn(serviceClient, table, ["user_id", "uid", "owner_id", "auth_user_id"])
  if (!ownerField) return
  await serviceClient.from(table).delete().eq(ownerField, userId)
}

export async function deleteUserCompletely(serviceClient: any, userId: string) {
  const tables = [
    "reading_records",
    "daily_tasks",
    "user_treasures",
    "pets",
    "user_auth_identities",
    "user_follows",
    "users",
  ] as const

  for (const table of tables) {
    const probe = await serviceClient.from(table).select("id").limit(1)
    if (probe.error) continue
    await deleteByOwnerField(serviceClient, table, userId)
  }

  const authDelete = await serviceClient.auth.admin.deleteUser(userId)
  if (authDelete.error) {
    return { ok: false as const, error: authDelete.error.message }
  }

  return { ok: true as const }
}

async function applySockUserProfile(serviceClient: any, authUser: User, input: CreateSockUserInput) {
  const ownerField = await resolveUsersOwnerField(serviceClient)
  if (!ownerField) return

  const nickname = (() => {
    if (typeof input.nickname === "string" && input.nickname.trim().length >= 2) {
      return input.nickname.trim().slice(0, 20)
    }
    return nicknameFromEmail(input.email)
  })()

  const schoolName = input.schoolName ? normalizeSchoolName(input.schoolName) : null
  const gradeClass = input.gradeClass ? normalizeGradeClass(input.gradeClass) : null
  const age = input.age !== undefined ? normalizeAge(input.age) : null

  const writableColumns = await findExistingColumns(serviceClient, "users", [
    "nickname",
    "username",
    "name",
    "email",
    "avatar_id",
    "user_avatar_id",
    "school_name",
    "grade_class",
    "age",
    "profile_setup_completed",
    "updated_at",
  ])

  const payload: GenericRecord = {}
  if (writableColumns.includes("nickname")) payload.nickname = nickname
  if (writableColumns.includes("username")) payload.username = nickname
  if (writableColumns.includes("name")) payload.name = nickname
  if (writableColumns.includes("email")) payload.email = input.email
  const avatarId = isValidUserAvatarId(input.avatarId) ? input.avatarId : DEFAULT_USER_AVATAR_ID
  if (writableColumns.includes("avatar_id")) payload.avatar_id = avatarId
  if (writableColumns.includes("user_avatar_id")) payload.user_avatar_id = avatarId
  if (schoolName && writableColumns.includes("school_name")) payload.school_name = schoolName
  if (gradeClass && writableColumns.includes("grade_class")) payload.grade_class = gradeClass
  if (age !== null && writableColumns.includes("age")) payload.age = age

  const profileComplete =
    nickname.length >= 2 &&
    schoolName !== null &&
    gradeClass !== null &&
    age !== null &&
    writableColumns.includes("profile_setup_completed")

  if (profileComplete) payload.profile_setup_completed = true
  if (writableColumns.includes("updated_at")) payload.updated_at = new Date().toISOString()

  if (Object.keys(payload).length === 0) return

  await serviceClient.from("users").update(payload).eq(ownerField, authUser.id)
}

export async function createSockUser(serviceClient: any, input: CreateSockUserInput) {
  const email = normalizeEmail(input.email)
  const password = normalizePassword(input.password)
  if (!email) return { ok: false as const, error: "请填写有效邮箱。" }
  if (!password) return { ok: false as const, error: "密码至少 6 位。" }

  const createResult = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { created_by_admin: true, account_type: "sock" },
  })

  if (createResult.error || !createResult.data.user) {
    const message = createResult.error?.message ?? "创建 Auth 用户失败"
    if (message.toLowerCase().includes("already")) {
      return { ok: false as const, error: "该邮箱已注册，请换一个或使用已有账号。" }
    }
    return { ok: false as const, error: message }
  }

  const authUser = createResult.data.user as User
  const bootstrap = await ensureUserBootstrap(authUser)
  if (!bootstrap.ok) {
    await serviceClient.auth.admin.deleteUser(authUser.id)
    return { ok: false as const, error: "用户数据初始化失败。" }
  }

  await applySockUserProfile(serviceClient, authUser, { ...input, email, password })

  const ownerField = await resolveUsersOwnerField(serviceClient)
  const userResult = ownerField
    ? await serviceClient.from("users").select("*").eq(ownerField, authUser.id).limit(1).maybeSingle()
    : { data: null, error: null }

  return {
    ok: true as const,
    user: authUser,
    row: (userResult.data ?? null) as GenericRecord | null,
  }
}

export async function assertUserDeletable(
  serviceClient: any,
  targetUserId: string,
  adminUserId: string,
) {
  if (targetUserId === adminUserId) {
    return { ok: false as const, error: "不能删除当前登录的管理员账号。" }
  }

  const ownerField = await resolveUsersOwnerField(serviceClient)
  if (!ownerField) {
    return { ok: false as const, error: "users 表不可用。" }
  }

  const existing = await serviceClient.from("users").select("*").eq(ownerField, targetUserId).limit(1).maybeSingle()
  if (!existing.data) {
    const authProbe = await serviceClient.auth.admin.getUserById(targetUserId)
    if (!authProbe.data?.user) {
      return { ok: false as const, error: "用户不存在。", notFound: true as const }
    }
  } else {
    const row = existing.data as GenericRecord
    const id = getString(row, ["id", "user_id", "uid"])
    if (await isProtectedAdminUser(serviceClient, id || targetUserId)) {
      return { ok: false as const, error: "不能删除管理员账号。" }
    }
  }

  return { ok: true as const }
}

export async function createSockUsersBatch(
  serviceClient: any,
  inputs: CreateSockUserInput[],
): Promise<{
  ok: true
  created: Array<{ email: string; userId: string; nickname: string }>
  failed: Array<{ email: string; error: string }>
}> {
  const created: Array<{ email: string; userId: string; nickname: string }> = []
  const failed: Array<{ email: string; error: string }> = []

  for (const input of inputs) {
    const result = await createSockUser(serviceClient, input)
    if (result.ok) {
      const nickname =
        typeof input.nickname === "string" && input.nickname.trim()
          ? input.nickname.trim()
          : nicknameFromEmail(input.email)
      created.push({ email: input.email, userId: result.user.id, nickname })
    } else {
      failed.push({ email: input.email, error: result.error })
    }
  }

  return { ok: true as const, created, failed }
}

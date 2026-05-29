import { findExistingColumn, findExistingColumns } from "@/lib/data/schema-compat"
import {
  computeDailyStreakUpdate,
  getTodayDateKey,
  normalizeDateKey,
  type DailyStreakReason,
} from "@/lib/user/daily-streak"

type GenericRecord = Record<string, unknown>

export interface RecordDailyActivityResult {
  ok: boolean
  applied: boolean
  dailyStreak: number
  lastActiveDate: string | null
  reason: DailyStreakReason | "columns_missing" | "user_not_found"
  error?: { message: string }
}

function getNumeric(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function resolveStreakFromRow(row: GenericRecord, streakField: string | null) {
  if (!streakField) return 0
  return Math.max(0, Math.floor(getNumeric(row[streakField], 0)))
}

function resolveLastActiveFromRow(row: GenericRecord, lastActiveField: string | null) {
  if (!lastActiveField) return null
  return normalizeDateKey(row[lastActiveField])
}

/**
 * 记录用户当日活跃（登录进首页 / 阅读挑战 / 领取任务等入口调用）。
 * 幂等：同一天多次调用不会重复 +1。
 */
export async function recordUserDailyActivity(
  serviceClient: any,
  userId: string,
): Promise<RecordDailyActivityResult> {
  const ownerField = await findExistingColumn(serviceClient, "users", [
    "user_id",
    "id",
    "uid",
    "auth_user_id",
  ])
  if (!ownerField) {
    return {
      ok: false,
      applied: false,
      dailyStreak: 0,
      lastActiveDate: null,
      reason: "columns_missing",
      error: { message: "users 表缺少归属字段。" },
    }
  }

  const streakField = await findExistingColumn(serviceClient, "users", [
    "daily_streak",
    "streak",
    "reading_streak",
  ])
  const lastActiveField = await findExistingColumn(serviceClient, "users", [
    "last_active_date",
    "last_streak_date",
    "last_login_date",
  ])

  if (!streakField || !lastActiveField) {
    return {
      ok: true,
      applied: false,
      dailyStreak: 0,
      lastActiveDate: null,
      reason: "columns_missing",
    }
  }

  const userResult = await serviceClient
    .from("users")
    .select("*")
    .eq(ownerField, userId)
    .limit(1)
    .maybeSingle()

  if (userResult.error) {
    return {
      ok: false,
      applied: false,
      dailyStreak: 0,
      lastActiveDate: null,
      reason: "user_not_found",
      error: { message: userResult.error.message },
    }
  }

  if (!userResult.data) {
    return {
      ok: false,
      applied: false,
      dailyStreak: 0,
      lastActiveDate: null,
      reason: "user_not_found",
      error: { message: "用户记录不存在。" },
    }
  }

  const row = userResult.data as GenericRecord
  const today = getTodayDateKey()
  const computation = computeDailyStreakUpdate({
    today,
    lastActiveDate: resolveLastActiveFromRow(row, lastActiveField),
    currentStreak: resolveStreakFromRow(row, streakField),
  })

  if (!computation.changed) {
    return {
      ok: true,
      applied: false,
      dailyStreak: computation.dailyStreak,
      lastActiveDate: computation.lastActiveDate,
      reason: computation.reason,
    }
  }

  const idField = await findExistingColumn(serviceClient, "users", ["id", "user_id"])
  if (!idField || !(idField in row)) {
    return {
      ok: false,
      applied: false,
      dailyStreak: computation.dailyStreak,
      lastActiveDate: null,
      reason: "user_not_found",
      error: { message: "users 表缺少主键字段。" },
    }
  }

  const writable = await findExistingColumns(serviceClient, "users", [
    streakField,
    lastActiveField,
    "updated_at",
  ])

  const payload: GenericRecord = {}
  if (writable.includes(streakField)) payload[streakField] = computation.dailyStreak
  if (writable.includes(lastActiveField)) payload[lastActiveField] = computation.lastActiveDate
  if (writable.includes("updated_at")) payload.updated_at = new Date().toISOString()

  const updateResult = await serviceClient
    .from("users")
    .update(payload)
    .eq(idField, row[idField])
    .select("*")
    .limit(1)

  if (updateResult.error) {
    return {
      ok: false,
      applied: false,
      dailyStreak: resolveStreakFromRow(row, streakField),
      lastActiveDate: resolveLastActiveFromRow(row, lastActiveField),
      reason: computation.reason,
      error: { message: updateResult.error.message },
    }
  }

  return {
    ok: true,
    applied: true,
    dailyStreak: computation.dailyStreak,
    lastActiveDate: computation.lastActiveDate,
    reason: computation.reason,
  }
}

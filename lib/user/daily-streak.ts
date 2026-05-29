/** 连续活跃天数 — 纯函数（与产品规则 §0.6 一致） */

/** 与 daily-decay 相同：UTC 日历日 YYYY-MM-DD */
export function getTodayDateKey(reference = new Date()) {
  return reference.toISOString().slice(0, 10)
}

export function getPreviousDateKey(dateKey: string) {
  const base = new Date(`${dateKey}T12:00:00.000Z`)
  base.setUTCDate(base.getUTCDate() - 1)
  return base.toISOString().slice(0, 10)
}

export function normalizeDateKey(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10)
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

export type DailyStreakReason =
  | "already_active_today"
  | "streak_incremented"
  | "streak_reset"
  | "first_activity"

export interface DailyStreakComputation {
  dailyStreak: number
  lastActiveDate: string
  changed: boolean
  reason: DailyStreakReason
}

/**
 * 根据上次活跃日计算新的连续天数。
 * - 今日已活跃：不变
 * - 昨日活跃：+1
 * - 更早或无记录：重置为 1
 */
export function computeDailyStreakUpdate(params: {
  today: string
  lastActiveDate: string | null
  currentStreak: number
}): DailyStreakComputation {
  const today = params.today
  const last = params.lastActiveDate
  const current = Math.max(0, Math.floor(params.currentStreak))

  if (last === today) {
    return {
      dailyStreak: current,
      lastActiveDate: today,
      changed: false,
      reason: "already_active_today",
    }
  }

  if (last === getPreviousDateKey(today)) {
    return {
      dailyStreak: current + 1,
      lastActiveDate: today,
      changed: true,
      reason: "streak_incremented",
    }
  }

  return {
    dailyStreak: 1,
    lastActiveDate: today,
    changed: true,
    reason: last ? "streak_reset" : "first_activity",
  }
}

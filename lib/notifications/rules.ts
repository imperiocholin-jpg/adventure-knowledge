/** 消息规则键 — 与 docs/NOTIFICATION_RULES.md 保持一致 */
export const NOTIFICATION_RULE_KEYS = {
  WELCOME: "welcome",
  REGION_UNLOCK: "region_unlock",
  REGION_PROGRESS: "region_progress",
  BOSS_VICTORY: "boss_victory",
  STREAK_MILESTONE: "streak_milestone",
  TREASURE_UNLOCK: "treasure_unlock",
  READING_REWARD: "reading_reward",
  BOOK_RECOMMEND: "book_recommend",
  PET_LOW_SATIETY: "pet_low_satiety",
  PET_LOW_SPIRIT: "pet_low_spirit",
  PET_LOW_BOND: "pet_low_bond",
  PET_DEATH: "pet_death",
  TASK_REWARD: "task_reward",
} as const

export type NotificationRuleKey = (typeof NOTIFICATION_RULE_KEYS)[keyof typeof NOTIFICATION_RULE_KEYS]

/** 饱食/精神/亲密低于此值触发「需要照顾」提醒 */
export const PET_CARE_THRESHOLD = 50

/** 区域进度达到此百分比时提醒挑战 BOSS（每区域仅一次） */
export const REGION_PROGRESS_REMINDER_THRESHOLD = 80

/** 连续活跃里程碑（天） */
export const STREAK_MILESTONES = [7, 14, 30] as const

/** 列表最多返回条数 */
export const MAX_NOTIFICATIONS_LIST = 100

/** 服务端保留天数（文档约定，清理任务可后续接入） */
export const NOTIFICATION_RETENTION_DAYS = 90

export function buildPetCareDedupeKey(kind: "satiety" | "spirit" | "bond", dateKey: string) {
  return `pet_${kind}:${dateKey}`
}

export function buildReadingRewardDedupeKey(dateKey: string) {
  return `reading_reward:${dateKey}`
}

export function buildBookRecommendDedupeKey(weekKey: string) {
  return `book_recommend:${weekKey}`
}

export function getIsoWeekKey(date = new Date()) {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
}

export function getTodayDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

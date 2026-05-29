import { ADVENTURE_REGION_META, getAdventureRegionName } from "@/lib/library/adventure-regions"
import { getRegionBossConfig } from "@/lib/adventure/region-boss"
import { ADVENTURE_REGION_UNLOCK_ORDER } from "@/lib/library/adventure-regions"
import type { TreasureDefinition } from "@/lib/treasures/types"
import type { PetVitalState } from "@/lib/pets/state"
import { createNotificationIfAbsent } from "@/lib/notifications/server"
import {
  NOTIFICATION_RULE_KEYS,
  PET_CARE_THRESHOLD,
  REGION_PROGRESS_REMINDER_THRESHOLD,
  STREAK_MILESTONES,
  buildBookRecommendDedupeKey,
  buildPetCareDedupeKey,
  buildReadingRewardDedupeKey,
  getIsoWeekKey,
  getTodayDateKey,
} from "@/lib/notifications/rules"

type GenericRecord = Record<string, unknown>

export interface AdventureProgressSnapshot {
  regionProgress?: Record<
    string,
    {
      progress: number
      unlocked: boolean
    }
  >
}

export async function emitWelcomeNotification(serviceClient: any, userId: string) {
  await createNotificationIfAbsent(serviceClient, {
    userId,
    category: "adventure",
    ruleKey: NOTIFICATION_RULE_KEYS.WELCOME,
    dedupeKey: "welcome",
    title: "欢迎来到阅读大陆",
    body: "魔法森林已为你开启，快去挑战第一位守护者吧！",
    href: "/adventure/magic-forest",
  })
}

export async function emitTreasureUnlockNotifications(
  serviceClient: any,
  userId: string,
  treasureIds: string[],
  definitions: TreasureDefinition[],
) {
  if (treasureIds.length === 0) return

  const definitionMap = new Map(definitions.map((item) => [item.id, item]))
  for (const treasureId of treasureIds) {
    const definition = definitionMap.get(treasureId)
    const name = definition?.name ?? "神秘宝藏"
    await createNotificationIfAbsent(serviceClient, {
      userId,
      category: "library",
      ruleKey: NOTIFICATION_RULE_KEYS.TREASURE_UNLOCK,
      dedupeKey: `treasure:${treasureId}`,
      title: "宝藏图鉴更新",
      body: `你解锁了「${name}」，快去看看吧。`,
      href: "/library/treasures",
      payload: { treasureId, treasureName: name },
    })
  }
}

export async function emitReadingRewardNotification(
  serviceClient: any,
  userId: string,
  params: { bookTitle?: string; starsGain?: number },
) {
  const today = getTodayDateKey()
  const bookPart = params.bookTitle ? `《${params.bookTitle}》` : "本次阅读"
  const starsPart =
    params.starsGain && params.starsGain > 0 ? `，星星 +${params.starsGain}` : ""
  await createNotificationIfAbsent(serviceClient, {
    userId,
    category: "library",
    ruleKey: NOTIFICATION_RULE_KEYS.READING_REWARD,
    dedupeKey: buildReadingRewardDedupeKey(today),
    title: "阅读奖励到账",
    body: `${bookPart} 已完成${starsPart}，已计入冒险进度。`,
    href: "/library",
    payload: { bookTitle: params.bookTitle ?? null, starsGain: params.starsGain ?? 0 },
  })
}

export async function emitBookRecommendNotification(
  serviceClient: any,
  userId: string,
  unreadBookCount: number,
) {
  if (unreadBookCount <= 0) return

  const weekKey = getIsoWeekKey()
  const countLabel = unreadBookCount >= 4 ? "多本" : `${Math.min(unreadBookCount, 3)} 本`
  await createNotificationIfAbsent(serviceClient, {
    userId,
    category: "library",
    ruleKey: NOTIFICATION_RULE_KEYS.BOOK_RECOMMEND,
    dedupeKey: buildBookRecommendDedupeKey(weekKey),
    title: "新书推荐",
    body: `书库为你挑选了 ${countLabel} 适合当前等级的冒险故事。`,
    href: "/library",
    payload: { unreadBookCount, weekKey },
  })
}

export async function emitStreakMilestoneNotification(serviceClient: any, userId: string, streak: number) {
  if (!STREAK_MILESTONES.includes(streak as (typeof STREAK_MILESTONES)[number])) return

  await createNotificationIfAbsent(serviceClient, {
    userId,
    category: "adventure",
    ruleKey: NOTIFICATION_RULE_KEYS.STREAK_MILESTONE,
    dedupeKey: `streak:${streak}`,
    title: "连续活跃里程碑",
    body: `已连续活跃 ${streak} 天，坚持阅读的小冒险家真棒！`,
    href: "/profile",
    payload: { streak },
  })
}

export async function emitBossVictoryNotification(
  serviceClient: any,
  userId: string,
  regionId: string,
  bossName: string,
) {
  const regionName = getAdventureRegionName(regionId)
  await createNotificationIfAbsent(serviceClient, {
    userId,
    category: "adventure",
    ruleKey: NOTIFICATION_RULE_KEYS.BOSS_VICTORY,
    dedupeKey: `boss_victory:${regionId}`,
    title: "守护者已击败",
    body: `你在 ${regionName} 击败了 ${bossName}，区域宝藏与进度已更新。`,
    href: `/adventure/${regionId}`,
    payload: { regionId, bossName },
  })
}

export async function emitRegionUnlockNotifications(
  serviceClient: any,
  userId: string,
  before: AdventureProgressSnapshot | null | undefined,
  after: AdventureProgressSnapshot | null | undefined,
) {
  if (!after?.regionProgress) return

  for (const regionId of ADVENTURE_REGION_UNLOCK_ORDER) {
    const meta = ADVENTURE_REGION_META[regionId]
    if (!meta || meta.unlockedByDefault) continue

    const wasUnlocked = before?.regionProgress?.[regionId]?.unlocked ?? false
    const isUnlocked = after.regionProgress[regionId]?.unlocked ?? false
    if (!wasUnlocked && isUnlocked) {
      await createNotificationIfAbsent(serviceClient, {
        userId,
        category: "adventure",
        ruleKey: NOTIFICATION_RULE_KEYS.REGION_UNLOCK,
        dedupeKey: `region_unlock:${regionId}`,
        title: "新区域解锁",
        body: `${meta.name} 已向你敞开，快去探索新的冒险故事吧！`,
        href: `/adventure/${regionId}`,
        payload: { regionId, regionName: meta.name },
      })
    }
  }
}

export async function emitRegionProgressReminders(
  serviceClient: any,
  userId: string,
  progress: AdventureProgressSnapshot | null | undefined,
) {
  if (!progress?.regionProgress) return

  for (const regionId of ADVENTURE_REGION_UNLOCK_ORDER) {
    const region = progress.regionProgress[regionId]
    if (!region?.unlocked) continue
    if (region.progress < REGION_PROGRESS_REMINDER_THRESHOLD) continue

    const regionName = getAdventureRegionName(regionId)
    const boss = getRegionBossConfig(regionId)
    await createNotificationIfAbsent(serviceClient, {
      userId,
      category: "adventure",
      ruleKey: NOTIFICATION_RULE_KEYS.REGION_PROGRESS,
      dedupeKey: `region_progress:${regionId}`,
      title: "区域进度提醒",
      body: boss
        ? `${regionName} 进度已达 ${region.progress}%，可以挑战 ${boss.name} 了。`
        : `${regionName} 进度已达 ${region.progress}%，继续完成关卡解锁更多内容。`,
      href: `/adventure/${regionId}`,
      payload: { regionId, progress: region.progress },
    })
  }
}

export async function emitPetCareNotifications(
  serviceClient: any,
  userId: string,
  state: Pick<PetVitalState, "satiety" | "spirit" | "bond" | "isDead">,
  petName: string,
) {
  if (state.isDead) return

  const today = getTodayDateKey()
  const safeName = petName.trim() || "伙伴"

  if (state.satiety < PET_CARE_THRESHOLD) {
    await createNotificationIfAbsent(serviceClient, {
      userId,
      category: "pet",
      ruleKey: NOTIFICATION_RULE_KEYS.PET_LOW_SATIETY,
      dedupeKey: buildPetCareDedupeKey("satiety", today),
      title: "伙伴需要照顾",
      body: `${safeName} 的饱食度偏低（${state.satiety}%），记得回宠物页喂食哦。`,
      href: "/pets",
      payload: { petName: safeName, satiety: state.satiety },
    })
  }

  if (state.spirit < PET_CARE_THRESHOLD) {
    await createNotificationIfAbsent(serviceClient, {
      userId,
      category: "pet",
      ruleKey: NOTIFICATION_RULE_KEYS.PET_LOW_SPIRIT,
      dedupeKey: buildPetCareDedupeKey("spirit", today),
      title: "伙伴需要休息",
      body: `${safeName} 的精神值偏低（${state.spirit}%），让它休息一下恢复状态吧。`,
      href: "/pets",
      payload: { petName: safeName, spirit: state.spirit },
    })
  }

  if (state.bond < PET_CARE_THRESHOLD) {
    await createNotificationIfAbsent(serviceClient, {
      userId,
      category: "pet",
      ruleKey: NOTIFICATION_RULE_KEYS.PET_LOW_BOND,
      dedupeKey: buildPetCareDedupeKey("bond", today),
      title: "伙伴想你了",
      body: `${safeName} 的亲密值偏低（${state.bond}%），去陪它玩耍增进感情吧。`,
      href: "/pets",
      payload: { petName: safeName, bond: state.bond },
    })
  }
}

export async function emitPetDeathNotification(
  serviceClient: any,
  userId: string,
  petName: string,
  petId?: string,
) {
  const safeName = petName.trim() || "伙伴"
  const dedupeKey = petId ? `pet_death:${petId}` : `pet_death:${getTodayDateKey()}`
  await createNotificationIfAbsent(serviceClient, {
    userId,
    category: "pet",
    ruleKey: NOTIFICATION_RULE_KEYS.PET_DEATH,
    dedupeKey,
    title: "伙伴离开了",
    body: `${safeName} 因饱食度耗尽离开了冒险队伍，你可以重新领养一只新的伙伴。`,
    href: "/pets",
    payload: { petName: safeName, petId: petId ?? null },
  })
}

export async function emitTaskRewardNotification(
  serviceClient: any,
  userId: string,
  params: { taskTitle: string; taskId?: string; coins?: number; xp?: number },
) {
  const dedupeKey = params.taskId
    ? `task_reward:${params.taskId}:${getTodayDateKey()}`
    : `task_reward:${getTodayDateKey()}:${params.taskTitle}`

  const rewardParts = [
    params.xp && params.xp > 0 ? `经验 +${params.xp}` : null,
    params.coins && params.coins > 0 ? `金币 +${params.coins}` : null,
  ].filter(Boolean)

  await createNotificationIfAbsent(serviceClient, {
    userId,
    category: "system",
    ruleKey: NOTIFICATION_RULE_KEYS.TASK_REWARD,
    dedupeKey,
    title: "任务奖励领取",
    body:
      rewardParts.length > 0
        ? `「${params.taskTitle}」奖励已到账：${rewardParts.join("，")}。`
        : `「${params.taskTitle}」奖励已领取。`,
    href: "/",
    payload: { taskTitle: params.taskTitle, taskId: params.taskId ?? null },
  })
}

/** 统计未完成阅读的书目数量（progress < 100） */
export function countUnreadBooksFromRows(rows: GenericRecord[]) {
  let count = 0
  for (const row of rows) {
    const progressField = ["progress", "reading_progress", "completion"].find((field) => field in row)
    const completedField = ["completed", "is_completed"].find((field) => field in row)
    const progress = progressField ? Number(row[progressField]) : 0
    const completed = completedField ? Boolean(row[completedField]) : false
    if (!completed && (!Number.isFinite(progress) || progress < 100)) {
      count += 1
    }
  }
  return count
}

export function resolvePetNameFromRow(row: GenericRecord | null | undefined) {
  if (!row) return "伙伴"
  const nameField = ["pet_name", "name", "nickname"].find((field) => field in row)
  const raw = nameField ? row[nameField] : null
  return typeof raw === "string" && raw.trim() ? raw.trim() : "伙伴"
}

export function resolveBookTitleFromRow(row: GenericRecord | null | undefined) {
  if (!row) return undefined
  const titleField = ["title", "book_title", "name"].find((field) => field in row)
  const raw = titleField ? row[titleField] : null
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined
}

/** 每日活跃相关：欢迎、连续活跃里程碑、每周新书推荐 */
export async function emitDailyEngagementNotifications(
  serviceClient: any,
  userId: string,
  params: { streak: number; streakApplied: boolean; readingRows?: GenericRecord[] },
) {
  await emitWelcomeNotification(serviceClient, userId)
  await emitStreakMilestoneNotification(serviceClient, userId, params.streak)

  if (params.streakApplied && params.readingRows) {
    const unreadCount = countUnreadBooksFromRows(params.readingRows)
    await emitBookRecommendNotification(serviceClient, userId, unreadCount)
  }
}

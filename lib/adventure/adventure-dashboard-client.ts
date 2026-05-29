import { REGION_SHELF_CONFIG } from "@/lib/adventure/config"
import {
  ADVENTURE_REGION_META,
  ADVENTURE_REGION_UNLOCK_ORDER,
  type AdventureRegionId,
} from "@/lib/library/adventure-regions"
import { REGION_UI_META } from "@/lib/adventure/region-ui"

export interface ProgressSectionRegionRow {
  name: string
  progress: number
  icon: string
  color: string
}

/** 与 server-progress / API 返回一致 */
export interface AdventureProgressSnapshot {
  totalStars: number
  worldProgress: number
  regionProgress: Record<
    string,
    {
      stars: number
      totalStages: number
      completedStages: number
      progress: number
      unlocked: boolean
    }
  >
}

export interface AdventureUserSnapshot {
  adventureLevel: number
  dailyStreak: number
  userExp: number
  userExpInLevel: number
  userExpToNext: number
}

export interface AdventureRegionCard {
  id: AdventureRegionId
  name: string
  description: string
  icon: string
  color: string
  bgColor: string
  difficulty: string
  unlocked: boolean
  progress: number
  stages: number
  completedStages: number
  stars: number
  maxStars: number
  unlockHint: string
}

const USER_EXP_STEP = 100

/** 主人冒险家称号（与产品规则 §0.3、adventurer-hero 档位一致） */
export function resolveAdventurerTitleLabel(adventureLevel: number): string {
  const level = Math.max(1, Math.floor(adventureLevel))
  if (level <= 5) return "见习冒险家"
  if (level <= 15) return "青铜冒险家"
  if (level <= 30) return "白银冒险家"
  if (level <= 45) return "黄金守护者"
  if (level < 60) return "钻石传说"
  return "至尊大师"
}

function getNumeric(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function resolveUserExpInLevel(totalExp: number) {
  const exp = Math.max(0, Math.floor(totalExp))
  const inLevel = exp % USER_EXP_STEP
  return {
    userExp: exp,
    userExpInLevel: inLevel,
    userExpToNext: USER_EXP_STEP,
  }
}

export function mapRegionProgressToRows(
  regionProgress: AdventureProgressSnapshot["regionProgress"],
): ProgressSectionRegionRow[] {
  return ADVENTURE_REGION_UNLOCK_ORDER.map((regionId) => {
    const row = regionProgress[regionId]
    if (!row?.unlocked) return null
    const meta = REGION_UI_META[regionId]
    return {
      name: ADVENTURE_REGION_META[regionId].name,
      progress: row.progress ?? 0,
      icon: meta.icon,
      color: meta.color,
    }
  }).filter((item): item is ProgressSectionRegionRow => item !== null)
}

export function buildRegionCards(
  regionProgress: AdventureProgressSnapshot["regionProgress"],
): AdventureRegionCard[] {
  return ADVENTURE_REGION_UNLOCK_ORDER.map((regionId) => {
    const meta = ADVENTURE_REGION_META[regionId]
    const ui = REGION_UI_META[regionId]
    const row = regionProgress[regionId]
    const stages = row?.totalStages ?? meta.totalStages
    const completedStages = row?.completedStages ?? 0
    const stars = row?.stars ?? 0
    const unlocked = row?.unlocked ?? Boolean(meta.unlockedByDefault)
    const prevId = ADVENTURE_REGION_UNLOCK_ORDER[ADVENTURE_REGION_UNLOCK_ORDER.indexOf(regionId) - 1]
    const prevName = prevId ? ADVENTURE_REGION_META[prevId].name : ""
    const threshold = REGION_SHELF_CONFIG[regionId]?.unlockWhenPrevProgressAtLeast ?? 50

    return {
      id: regionId,
      name: meta.name,
      description: meta.description,
      icon: ui.icon,
      color: ui.color,
      bgColor: ui.bgColor,
      difficulty: ui.difficulty,
      unlocked,
      progress: row?.progress ?? 0,
      stages,
      completedStages,
      stars,
      maxStars: stages * 3,
      unlockHint: prevName
        ? `完成${prevName}进度达 ${threshold}% 后解锁`
        : "完成前置区域后解锁",
    }
  })
}

export async function fetchAdventureProgress(): Promise<AdventureProgressSnapshot | null> {
  try {
    const response = await fetch("/api/adventure/progress", { cache: "no-store" })
    const payload = await response.json()
    if (!response.ok || !payload?.data) return null
    const data = payload.data as Partial<AdventureProgressSnapshot>
    return {
      totalStars: getNumeric(data.totalStars, 0),
      worldProgress: getNumeric(data.worldProgress, 0),
      regionProgress: (data.regionProgress as AdventureProgressSnapshot["regionProgress"]) ?? {},
    }
  } catch {
    return null
  }
}

export async function fetchAdventureUserSnapshot(): Promise<AdventureUserSnapshot | null> {
  try {
    const response = await fetch("/api/users", { cache: "no-store" })
    const payload = await response.json()
    if (!response.ok || !Array.isArray(payload?.data) || payload.data.length === 0) return null
    const row = payload.data[0] as Record<string, unknown>
    const levelRaw =
      row.adventure_level ?? row.chapter_level ?? row.level ?? row.user_level
    const streakRaw = row.daily_streak ?? row.streak ?? row.reading_streak
    const expRaw = row.experience ?? row.user_exp ?? row.exp ?? 0
    const expParts = resolveUserExpInLevel(getNumeric(expRaw, 0))
    const level = getNumeric(levelRaw, 1)

    return {
      adventureLevel: Math.max(1, Math.floor(level)),
      dailyStreak: Math.max(0, Math.floor(getNumeric(streakRaw, 0))),
      ...expParts,
    }
  } catch {
    return null
  }
}

export async function fetchAdventureDashboard() {
  const [progress, user] = await Promise.all([
    fetchAdventureProgress(),
    fetchAdventureUserSnapshot(),
  ])
  return { progress, user }
}

/** 首页 AdventureBanner 展示用 */
export interface HomeAdventureBannerSnapshot {
  currentWorld: string
  currentChapter: string
  regionProgressPercent: number
  worldProgressPercent: number
  discoveredRegions: number
  totalRegions: number
  activeRegionId: AdventureRegionId | null
}

const DEFAULT_BANNER: HomeAdventureBannerSnapshot = {
  currentWorld: ADVENTURE_REGION_META["magic-forest"].name,
  currentChapter: "开始你的冒险",
  regionProgressPercent: 0,
  worldProgressPercent: 0,
  discoveredRegions: 1,
  totalRegions: ADVENTURE_REGION_UNLOCK_ORDER.length,
  activeRegionId: "magic-forest",
}

function pickActiveRegionId(
  regionProgress: AdventureProgressSnapshot["regionProgress"],
): AdventureRegionId | null {
  const unlocked = ADVENTURE_REGION_UNLOCK_ORDER.filter(
    (id) => regionProgress[id]?.unlocked ?? ADVENTURE_REGION_META[id].unlockedByDefault,
  )
  if (unlocked.length === 0) return "magic-forest"

  const inProgress = unlocked.find((id) => {
    const row = regionProgress[id]
    const progress = row?.progress ?? 0
    return progress > 0 && progress < 100
  })
  if (inProgress) return inProgress

  const notStarted = unlocked.find((id) => (regionProgress[id]?.progress ?? 0) === 0)
  if (notStarted) return notStarted

  return unlocked[unlocked.length - 1] ?? null
}

export function deriveHomeAdventureBanner(
  progress: AdventureProgressSnapshot | null,
  options?: {
    currentBookTitle?: string
    readingProgressPercent?: number
  },
): HomeAdventureBannerSnapshot {
  if (!progress) return { ...DEFAULT_BANNER }

  const totalRegions = ADVENTURE_REGION_UNLOCK_ORDER.length
  const discoveredRegions = ADVENTURE_REGION_UNLOCK_ORDER.filter(
    (id) => progress.regionProgress[id]?.unlocked ?? ADVENTURE_REGION_META[id].unlockedByDefault,
  ).length

  const activeRegionId = pickActiveRegionId(progress.regionProgress)
  const activeRow = activeRegionId ? progress.regionProgress[activeRegionId] : null
  const activeMeta = activeRegionId ? ADVENTURE_REGION_META[activeRegionId] : null
  const totalStages = activeRow?.totalStages ?? activeMeta?.totalStages ?? 12
  const completedStages = activeRow?.completedStages ?? 0
  const regionProgressPercent = activeRow?.progress ?? 0

  const bookTitle = options?.currentBookTitle?.trim()
  const readPct = options?.readingProgressPercent
  const hasActiveReading =
    bookTitle &&
    typeof readPct === "number" &&
    readPct > 0 &&
    readPct < 100

  let currentChapter: string
  if (hasActiveReading) {
    currentChapter = `正在读《${bookTitle}》· ${Math.round(readPct)}%`
  } else if (completedStages >= totalStages && totalStages > 0) {
    currentChapter = `本区 ${totalStages} 关已完成`
  } else if (completedStages > 0) {
    currentChapter = `第 ${completedStages + 1} / ${totalStages} 关`
  } else {
    currentChapter = "完成阅读挑战推进关卡"
  }

  return {
    currentWorld: activeMeta?.name ?? DEFAULT_BANNER.currentWorld,
    currentChapter,
    regionProgressPercent,
    worldProgressPercent: progress.worldProgress,
    discoveredRegions,
    totalRegions,
    activeRegionId,
  }
}

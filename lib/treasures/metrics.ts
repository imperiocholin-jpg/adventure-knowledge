import { CHALLENGE_REWARD_POLICY } from "@/lib/adventure/config"
import { buildAdventureProgressFromRows } from "@/lib/adventure/server-progress"
import type { TreasureUserMetrics } from "@/lib/treasures/types"

type GenericRecord = Record<string, unknown>

function resolveField(row: GenericRecord, candidates: string[]) {
  return candidates.find((field) => field in row)
}

function getNumeric(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function resolveStarsFromRow(row: GenericRecord) {
  const starsField = resolveField(row, ["stars_gain", "stars"])
  if (starsField) return Math.max(0, getNumeric(row[starsField], 0))
  return 0
}

function resolveBookId(row: GenericRecord) {
  const bookField = resolveField(row, ["book_id", "bookId"])
  if (!bookField) return null
  const raw = row[bookField]
  if (typeof raw === "string" && raw.trim()) return raw.trim()
  if (typeof raw === "number") return String(raw)
  return null
}

export function buildTreasureMetricsFromReadingRows(rows: GenericRecord[]): TreasureUserMetrics {
  const adventure = buildAdventureProgressFromRows(rows)
  const completedBookIds = new Set<string>()
  const booksWithStars = new Set<string>()
  const postReadBooks = new Set<string>()

  for (const row of rows) {
    const bookId = resolveBookId(row)
    if (!bookId) continue
    const stars = resolveStarsFromRow(row)
    if (stars <= 0) continue
    booksWithStars.add(bookId)
    if (stars >= CHALLENGE_REWARD_POLICY.post_read.stars) {
      postReadBooks.add(bookId)
      completedBookIds.add(bookId)
    }
  }

  const regionProgress: Record<string, number> = {}
  let regionsUnlocked = 0
  Object.entries(adventure.regionProgress).forEach(([regionId, region]) => {
    regionProgress[regionId] = region.progress
    if (region.unlocked) regionsUnlocked += 1
  })

  return {
    totalStars: adventure.totalStars,
    worldProgress: adventure.worldProgress,
    dailyStreak: 0,
    regionsUnlocked,
    regionProgress,
    booksReadCount: booksWithStars.size,
    postReadBooksCount: postReadBooks.size,
    completedBookIds,
  }
}

export function mergeDailyStreakIntoMetrics(
  metrics: TreasureUserMetrics,
  dailyStreak: number,
): TreasureUserMetrics {
  return {
    ...metrics,
    dailyStreak: Math.max(0, Math.floor(dailyStreak)),
  }
}

export function resolveDailyStreakFromUserRow(row: GenericRecord | null) {
  if (!row) return 0
  const field = resolveField(row, ["daily_streak", "streak", "reading_streak"])
  if (!field) return 0
  return Math.max(0, Math.floor(getNumeric(row[field], 0)))
}

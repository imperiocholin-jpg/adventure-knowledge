import type { TreasureDefinition, TreasureUserMetrics } from "@/lib/treasures/types"

function clampProgress(current: number, target: number) {
  if (target <= 0) return current > 0 ? 100 : 0
  return Math.min(100, Math.max(0, Math.round((current / target) * 100)))
}

function resolveCurrentValue(definition: TreasureDefinition, metrics: TreasureUserMetrics) {
  const target = Math.max(1, definition.targetValue)
  const payload = definition.conditionPayload

  switch (definition.conditionType) {
    case "stars_total":
      return { current: metrics.totalStars, target, progress: clampProgress(metrics.totalStars, target) }
    case "daily_streak":
      return { current: metrics.dailyStreak, target, progress: clampProgress(metrics.dailyStreak, target) }
    case "book_complete": {
      const bookId = String(payload.bookId ?? "")
      const done = bookId ? metrics.completedBookIds.has(bookId) : false
      return { current: done ? 1 : 0, target: 1, progress: done ? 100 : 0 }
    }
    case "books_read_count":
      return {
        current: metrics.booksReadCount,
        target,
        progress: clampProgress(metrics.booksReadCount, target),
      }
    case "post_read_books_count":
      return {
        current: metrics.postReadBooksCount,
        target,
        progress: clampProgress(metrics.postReadBooksCount, target),
      }
    case "regions_unlocked":
      return {
        current: metrics.regionsUnlocked,
        target,
        progress: clampProgress(metrics.regionsUnlocked, target),
      }
    case "region_progress": {
      const regionId = String(payload.regionId ?? "")
      const progress = regionId ? metrics.regionProgress[regionId] ?? 0 : 0
      return { current: progress, target, progress: clampProgress(progress, target) }
    }
    case "world_progress":
      return {
        current: metrics.worldProgress,
        target,
        progress: clampProgress(metrics.worldProgress, target),
      }
    default:
      return { current: 0, target, progress: 0 }
  }
}

export function evaluateTreasureDefinition(definition: TreasureDefinition, metrics: TreasureUserMetrics) {
  const result = resolveCurrentValue(definition, metrics)
  const unlocked = result.progress >= 100
  return {
    progress: result.progress,
    unlocked,
    current: result.current,
    target: result.target,
  }
}

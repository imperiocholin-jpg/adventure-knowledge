import {
  CHALLENGE_REWARD_POLICY,
  REGION_SHELF_CONFIG,
  REGION_UNLOCK_ORDER,
  resolveRegionIdByBookId,
} from "@/lib/adventure/config"
import { findExistingColumn } from "@/lib/data/schema-compat"

type GenericRecord = Record<string, unknown>

function resolveFieldName(record: GenericRecord, candidates: string[]) {
  return candidates.find((field) => field in record)
}

function getNumericValue(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function resolveStarsGainFromRow(row: GenericRecord) {
  const starsField = resolveFieldName(row, ["stars_gain", "stars"])
  if (starsField) {
    return Math.max(0, getNumericValue(row[starsField], 0))
  }
  const expField = resolveFieldName(row, ["experience_gain", "experience", "exp"])
  const petExpField = resolveFieldName(row, ["pet_exp_gain", "pet_exp"])
  const exp = getNumericValue(expField ? row[expField] : null, 0)
  const petExp = getNumericValue(petExpField ? row[petExpField] : null, 0)
  if (exp === CHALLENGE_REWARD_POLICY.direct.experienceGain && petExp === CHALLENGE_REWARD_POLICY.direct.petExpGain) {
    return CHALLENGE_REWARD_POLICY.direct.stars
  }
  if (
    exp === CHALLENGE_REWARD_POLICY.post_read.experienceGain &&
    petExp === CHALLENGE_REWARD_POLICY.post_read.petExpGain
  ) {
    return CHALLENGE_REWARD_POLICY.post_read.stars
  }
  return 0
}

function resolveRegionIdFromRow(row: GenericRecord) {
  const regionField = resolveFieldName(row, ["region_id", "region"])
  if (regionField && typeof row[regionField] === "string" && row[regionField]) {
    return row[regionField] as string
  }
  const bookField = resolveFieldName(row, ["book_id", "bookId"])
  if (!bookField) return null
  const rawBookId = row[bookField]
  const bookId = typeof rawBookId === "string" || typeof rawBookId === "number" ? String(rawBookId) : null
  if (!bookId) return null
  return resolveRegionIdByBookId(bookId)
}

export function buildAdventureProgressFromRows(rows: GenericRecord[]) {
  const regionProgress: Record<
    string,
    {
      stars: number
      totalStages: number
      completedStages: number
      progress: number
      unlocked: boolean
    }
  > = {}

  Object.entries(REGION_SHELF_CONFIG).forEach(([regionId, regionConfig]) => {
    regionProgress[regionId] = {
      stars: 0,
      totalStages: regionConfig.totalStages,
      completedStages: 0,
      progress: 0,
      unlocked: Boolean(regionConfig.unlockedByDefault),
    }
  })

  for (const row of rows) {
    const regionId = resolveRegionIdFromRow(row)
    if (!regionId || !regionProgress[regionId]) continue
    regionProgress[regionId].stars += resolveStarsGainFromRow(row)
  }

  let totalStars = 0
  let totalStages = 0
  let completedStages = 0

  Object.values(regionProgress).forEach((region) => {
    region.completedStages = Math.min(region.totalStages, region.stars)
    region.progress = Math.min(100, Math.round((region.completedStages / region.totalStages) * 100))
  })

  REGION_UNLOCK_ORDER.forEach((regionId, index) => {
    const current = regionProgress[regionId]
    if (!current) return
    if (current.stars > 0) {
      current.unlocked = true
      return
    }
    if (index === 0) {
      current.unlocked = true
      return
    }
    const prevRegionId = REGION_UNLOCK_ORDER[index - 1]
    const prev = prevRegionId ? regionProgress[prevRegionId] : null
    const threshold = REGION_SHELF_CONFIG[regionId]?.unlockWhenPrevProgressAtLeast ?? 100
    current.unlocked = Boolean(prev && prev.progress >= threshold)
  })

  Object.values(regionProgress).forEach((region) => {
    totalStars += region.stars
    totalStages += region.totalStages
    completedStages += region.completedStages
  })

  const worldProgress = totalStages === 0 ? 0 : Math.min(100, Math.round((completedStages / totalStages) * 100))
  return {
    totalStars,
    worldProgress,
    regionProgress,
  }
}

export async function fetchUserAdventureProgress(params: {
  supabase: any
  serviceClient: any
  userId: string
}) {
  const ownerField = await findExistingColumn(params.serviceClient, "reading_records", [
    "user_id",
    "uid",
    "owner_id",
    "auth_user_id",
  ])
  if (!ownerField) {
    return {
      data: buildAdventureProgressFromRows([]),
      error: null,
    }
  }

  const queryResult = await params.supabase
    .from("reading_records")
    .select("*")
    .eq(ownerField, params.userId)
    .order("created_at", { ascending: false })
    .limit(1000)

  if (queryResult.error) {
    return {
      data: null,
      error: queryResult.error,
    }
  }

  return {
    data: buildAdventureProgressFromRows((queryResult.data ?? []) as GenericRecord[]),
    error: null,
  }
}


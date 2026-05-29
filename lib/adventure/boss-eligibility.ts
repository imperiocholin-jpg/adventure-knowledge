import { CHALLENGE_REWARD_POLICY } from "@/lib/adventure/config"
import {
  REGION_BOSS_PROGRESS_MIN,
  getRegionBossConfig,
  type RegionBossConfig,
} from "@/lib/adventure/region-boss"

type GenericRecord = Record<string, unknown>

export type BossChallengeStatus = "locked" | "need_post_read" | "ready" | "defeated"

export interface BossChallengeSnapshot {
  regionId: string
  status: BossChallengeStatus
  regionProgress: number
  hasPostRead: boolean
  bossDefeated: boolean
  boss: RegionBossConfig | null
  requirementText: string
}

function resolveFieldName(record: GenericRecord, candidates: string[]) {
  return candidates.find((field) => field in record)
}

function getNumeric(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function readRegionId(row: GenericRecord) {
  const field = resolveFieldName(row, ["region_id", "region"])
  if (!field) return null
  const raw = row[field]
  return typeof raw === "string" && raw.trim() ? raw.trim() : null
}

function readEntryMode(row: GenericRecord) {
  const field = resolveFieldName(row, ["entry_mode", "challenge_mode", "mode"])
  if (!field) return null
  const raw = row[field]
  return typeof raw === "string" ? raw.toLowerCase() : null
}

function readStarsGain(row: GenericRecord) {
  const starsField = resolveFieldName(row, ["stars_gain", "stars"])
  if (starsField) return Math.max(0, getNumeric(row[starsField], 0))
  return 0
}

export function isBossVictoryRow(row: GenericRecord, regionId: string) {
  const rowRegion = readRegionId(row)
  if (rowRegion && rowRegion !== regionId) return false

  const mode = readEntryMode(row)
  if (mode === "boss") return true

  const chapterField = resolveFieldName(row, ["challenge_chapter_id", "challengeChapterId"])
  if (chapterField) {
    const raw = row[chapterField]
    if (raw === `boss-${regionId}`) return true
  }
  return false
}

export function isPostReadChallengeRow(row: GenericRecord, regionId: string) {
  if (isBossVictoryRow(row, regionId)) return false

  const rowRegion = readRegionId(row)
  if (rowRegion && rowRegion !== regionId) return false

  const mode = readEntryMode(row)
  if (mode === "post_read") return true
  if (mode === "direct") return false

  return readStarsGain(row) >= CHALLENGE_REWARD_POLICY.post_read.stars
}

export function regionHasPostReadChallenge(rows: GenericRecord[], regionId: string) {
  return rows.some((row) => isPostReadChallengeRow(row, regionId))
}

export function regionBossDefeated(rows: GenericRecord[], regionId: string) {
  return rows.some((row) => isBossVictoryRow(row, regionId))
}

export function resolveBossChallengeStatus(input: {
  regionId: string
  regionProgress: number
  hasPostRead: boolean
  bossDefeated: boolean
}): BossChallengeStatus {
  if (input.bossDefeated) return "defeated"
  if (input.regionProgress < REGION_BOSS_PROGRESS_MIN) return "locked"
  if (!input.hasPostRead) return "need_post_read"
  return "ready"
}

export function buildBossRequirementText(status: BossChallengeStatus, regionProgress: number) {
  if (status === "defeated") return "已击败区域守护者"
  if (status === "locked") {
    return `区域进度需达到 ${REGION_BOSS_PROGRESS_MIN}%（当前 ${Math.round(regionProgress)}%）`
  }
  if (status === "need_post_read") return "需先完成 1 次「读完再挑战」"
  return "满足条件，可发起守护者挑战"
}

export function buildBossChallengeSnapshot(input: {
  regionId: string
  regionProgress: number
  readingRows: GenericRecord[]
}): BossChallengeSnapshot {
  const boss = getRegionBossConfig(input.regionId)
  const hasPostRead = regionHasPostReadChallenge(input.readingRows, input.regionId)
  const bossDefeated = regionBossDefeated(input.readingRows, input.regionId)
  const status = resolveBossChallengeStatus({
    regionId: input.regionId,
    regionProgress: input.regionProgress,
    hasPostRead,
    bossDefeated,
  })

  return {
    regionId: input.regionId,
    status,
    regionProgress: input.regionProgress,
    hasPostRead,
    bossDefeated,
    boss,
    requirementText: buildBossRequirementText(status, input.regionProgress),
  }
}

import {
  CHALLENGE_REWARD_POLICY,
  DIRECT_CHALLENGE_DAILY_LIMIT,
  type StoryEntryMode,
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

function toDateLabel(value: unknown) {
  if (typeof value !== "string") return null
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return null
  return new Date(parsed).toISOString().slice(0, 10)
}

function isDirectChallengeRow(row: GenericRecord) {
  const modeField = resolveFieldName(row, ["entry_mode", "challenge_mode", "mode"])
  if (modeField && String(row[modeField]).toLowerCase() === "direct") return true

  // Fallback: infer from reward payload when mode columns are unavailable.
  const expField = resolveFieldName(row, ["experience_gain", "experience", "exp"])
  const petExpField = resolveFieldName(row, ["pet_exp_gain", "pet_exp"])
  const exp = getNumericValue(expField ? row[expField] : 0, 0)
  const petExp = getNumericValue(petExpField ? row[petExpField] : 0, 0)
  return (
    exp === CHALLENGE_REWARD_POLICY.direct.experienceGain &&
    petExp === CHALLENGE_REWARD_POLICY.direct.petExpGain
  )
}

export async function countTodayDirectChallenges(params: {
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
  if (!ownerField) return { count: 0, error: null }

  const queryResult = await params.supabase
    .from("reading_records")
    .select("*")
    .eq(ownerField, params.userId)
    .order("created_at", { ascending: false })
    .limit(500)

  if (queryResult.error) return { count: 0, error: queryResult.error }
  const rows = (queryResult.data ?? []) as GenericRecord[]
  const today = new Date().toISOString().slice(0, 10)
  const count = rows.filter((row) => {
    const createdAtField = resolveFieldName(row, ["created_at"])
    const createdDate = toDateLabel(createdAtField ? row[createdAtField] : null)
    if (createdDate !== today) return false
    return isDirectChallengeRow(row)
  }).length
  return { count, error: null }
}

export function normalizeEntryMode(raw: unknown): StoryEntryMode {
  return raw === "direct" ? "direct" : "post_read"
}

export function getChallengeLimitSummary(usedDirectChallenges: number) {
  const used = Math.max(0, usedDirectChallenges)
  const limit = DIRECT_CHALLENGE_DAILY_LIMIT
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
  }
}


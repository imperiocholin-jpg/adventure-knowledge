import { findExistingColumn } from "@/lib/data/schema-compat"
import { emitTreasureUnlockNotifications } from "@/lib/notifications/emitters"
import { TREASURE_DEFINITIONS } from "@/lib/treasures/definitions"
import { evaluateTreasureDefinition } from "@/lib/treasures/evaluate"
import {
  buildTreasureMetricsFromReadingRows,
  mergeDailyStreakIntoMetrics,
  resolveDailyStreakFromUserRow,
} from "@/lib/treasures/metrics"
import type { TreasureDefinition, TreasureListItem } from "@/lib/treasures/types"

type GenericRecord = Record<string, unknown>

function mapDbDefinitionRow(row: GenericRecord): TreasureDefinition | null {
  const id = typeof row.id === "string" ? row.id : null
  if (!id) return null
  const rewardType = row.reward_type
  const rarity = row.rarity
  const conditionType = row.condition_type
  if (typeof rewardType !== "string" || typeof rarity !== "string" || typeof conditionType !== "string") {
    return null
  }

  return {
    id,
    name: String(row.name ?? ""),
    icon: String(row.icon ?? "🎁"),
    type: rewardType as TreasureDefinition["type"],
    rarity: rarity as TreasureDefinition["rarity"],
    description: String(row.description ?? ""),
    requirement: String(row.requirement_label ?? ""),
    conditionType: conditionType as TreasureDefinition["conditionType"],
    targetValue: Math.max(1, Number(row.target_value ?? 1)),
    conditionPayload:
      row.condition_payload && typeof row.condition_payload === "object"
        ? (row.condition_payload as Record<string, unknown>)
        : {},
    sortOrder: Number(row.sort_order ?? 0),
  }
}

export async function loadTreasureDefinitions(serviceClient: any): Promise<TreasureDefinition[]> {
  const probe = await serviceClient.from("treasure_definitions").select("id").limit(1)
  if (probe.error) {
    return [...TREASURE_DEFINITIONS].sort((a, b) => a.sortOrder - b.sortOrder)
  }

  const result = await serviceClient
    .from("treasure_definitions")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })

  if (result.error || !Array.isArray(result.data) || result.data.length === 0) {
    return [...TREASURE_DEFINITIONS].sort((a, b) => a.sortOrder - b.sortOrder)
  }

  return (result.data as GenericRecord[])
    .map(mapDbDefinitionRow)
    .filter((item): item is TreasureDefinition => item !== null)
}

async function fetchReadingRowsForTreasures(params: {
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
  if (!ownerField) return [] as GenericRecord[]

  const queryResult = await params.supabase
    .from("reading_records")
    .select("*")
    .eq(ownerField, params.userId)
    .order("created_at", { ascending: false })
    .limit(1000)

  if (queryResult.error) return [] as GenericRecord[]
  return (queryResult.data ?? []) as GenericRecord[]
}

async function fetchUserRowForStreak(serviceClient: any, userId: string) {
  const ownerField = await findExistingColumn(serviceClient, "users", [
    "user_id",
    "id",
    "uid",
    "auth_user_id",
  ])
  if (!ownerField) return null

  const result = await serviceClient.from("users").select("*").eq(ownerField, userId).limit(1).maybeSingle()
  if (result.error || !result.data) return null
  return result.data as GenericRecord
}

export async function loadUnlockedTreasureMap(serviceClient: any, userId: string) {
  const probe = await serviceClient.from("user_treasures").select("treasure_id").limit(1)
  if (probe.error) return new Map<string, string>()

  const result = await serviceClient
    .from("user_treasures")
    .select("treasure_id, unlocked_at")
    .eq("user_id", userId)

  const map = new Map<string, string>()
  if (result.error || !Array.isArray(result.data)) return map

  for (const row of result.data as GenericRecord[]) {
    const treasureId = typeof row.treasure_id === "string" ? row.treasure_id : null
    const unlockedAt = typeof row.unlocked_at === "string" ? row.unlocked_at : null
    if (treasureId && unlockedAt) map.set(treasureId, unlockedAt)
  }
  return map
}

export async function buildTreasureUserMetrics(params: {
  supabase: any
  serviceClient: any
  userId: string
}) {
  const [readingRows, userRow] = await Promise.all([
    fetchReadingRowsForTreasures(params),
    fetchUserRowForStreak(params.serviceClient, params.userId),
  ])

  const base = buildTreasureMetricsFromReadingRows(readingRows)
  const dailyStreak = resolveDailyStreakFromUserRow(userRow)
  return mergeDailyStreakIntoMetrics(base, dailyStreak)
}

export interface SyncUserTreasuresResult {
  ok: boolean
  items: TreasureListItem[]
  newlyUnlocked: string[]
  error?: { message: string }
}

export async function syncUserTreasures(params: {
  supabase: any
  serviceClient: any
  userId: string
}): Promise<SyncUserTreasuresResult> {
  try {
    const [definitions, metrics, unlockedMap] = await Promise.all([
      loadTreasureDefinitions(params.serviceClient),
      buildTreasureUserMetrics(params),
      loadUnlockedTreasureMap(params.serviceClient, params.userId),
    ])

    const canPersist = (await params.serviceClient.from("user_treasures").select("treasure_id").limit(1)).error === null
    const newlyUnlocked: string[] = []
    const items: TreasureListItem[] = []

    for (const definition of definitions) {
      const evaluation = evaluateTreasureDefinition(definition, metrics)
      const existingUnlockedAt = unlockedMap.get(definition.id) ?? null
      const shouldUnlock = evaluation.unlocked

      if (shouldUnlock && !existingUnlockedAt && canPersist) {
        const unlockedAt = new Date().toISOString()
        const insertResult = await params.serviceClient.from("user_treasures").upsert(
          {
            user_id: params.userId,
            treasure_id: definition.id,
            unlocked_at: unlockedAt,
          },
          { onConflict: "user_id,treasure_id", ignoreDuplicates: true },
        )
        if (!insertResult.error) {
          newlyUnlocked.push(definition.id)
          unlockedMap.set(definition.id, unlockedAt)
        }
      }

      const unlocked = Boolean(existingUnlockedAt) || shouldUnlock
      items.push({
        id: definition.id,
        name: definition.name,
        icon: definition.icon,
        type: definition.type,
        rarity: definition.rarity,
        description: definition.description,
        requirement: definition.requirement,
        progress: unlocked ? 100 : evaluation.progress,
        unlocked,
        unlockedAt: unlockedMap.get(definition.id) ?? (unlocked ? new Date().toISOString() : null),
      })
    }

    if (newlyUnlocked.length > 0) {
      await emitTreasureUnlockNotifications(
        params.serviceClient,
        params.userId,
        newlyUnlocked,
        definitions,
      )
    }

    return { ok: true, items, newlyUnlocked }
  } catch (error) {
    return {
      ok: false,
      items: [],
      newlyUnlocked: [],
      error: { message: error instanceof Error ? error.message : "同步宝藏失败" },
    }
  }
}

/** 活动后轻量同步（阅读/签到/领任务） */
export async function syncUserTreasuresAfterActivity(params: {
  supabase: any
  serviceClient: any
  userId: string
}) {
  const result = await syncUserTreasures(params)
  if (!result.ok && result.error) {
    console.error("[treasures]", result.error.message)
  }
  return result
}

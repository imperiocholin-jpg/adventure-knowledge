import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  createSupabaseUserClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { buildBossChallengeSnapshot } from "@/lib/adventure/boss-eligibility"
import { fetchUserReadingRows, insertBossVictoryRecord } from "@/lib/adventure/boss-server"
import { buildBossChallengeChapterId, getRegionBossConfig } from "@/lib/adventure/region-boss"
import { fetchUserAdventureProgress } from "@/lib/adventure/server-progress"
import { findExistingColumn, findExistingColumns } from "@/lib/data/schema-compat"
import { fetchPrimaryPetRow } from "@/lib/pets/fetch-primary-pet"
import { levelFromTotalExp, resolveLifeStageFromLevel } from "@/lib/pets/level-progress"
import { syncUserTreasuresAfterActivity } from "@/lib/treasures/server"
import { ADVENTURE_REGION_IDS } from "@/lib/library/adventure-regions"
import {
  emitBossVictoryNotification,
  emitRegionProgressReminders,
  emitRegionUnlockNotifications,
} from "@/lib/notifications/emitters"

export const dynamic = "force-dynamic"

type GenericRecord = Record<string, unknown>

function getNumeric(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.floor(n) : fallback
}

function resolveFieldName(record: GenericRecord, candidates: string[]) {
  return candidates.find((field) => field in record)
}

export async function POST(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) {
      return unauthorizedResponse("User is not authenticated.")
    }

    const body = (await request.json().catch(() => ({}))) as { regionId?: string; result?: string }
    const regionId = typeof body.regionId === "string" ? body.regionId : ""
    if (!ADVENTURE_REGION_IDS.includes(regionId as (typeof ADVENTURE_REGION_IDS)[number])) {
      return NextResponse.json({ ok: false, error: { message: "无效的区域 ID。" } }, { status: 400 })
    }
    if (body.result !== "win") {
      return NextResponse.json({ ok: false, error: { message: "仅胜利可结算 BOSS 挑战。" } }, { status: 400 })
    }

    const boss = getRegionBossConfig(regionId)
    if (!boss) {
      return NextResponse.json({ ok: false, error: { message: "区域守护者配置不存在。" } }, { status: 404 })
    }

    const supabase = createSupabaseUserClient(sessionState.accessToken)
    const serviceClient = createSupabaseServiceClient()
    const userId = sessionState.user.id

    const progressBeforeResult = await fetchUserAdventureProgress({ supabase, serviceClient, userId })

    const [readingRows, progressResult, petResult] = await Promise.all([
      fetchUserReadingRows({ supabase, serviceClient, userId }),
      fetchUserAdventureProgress({ supabase, serviceClient, userId }),
      fetchPrimaryPetRow(serviceClient, userId),
    ])

    if (progressResult.error) {
      return NextResponse.json(
        { ok: false, error: { message: progressResult.error.message ?? "读取冒险进度失败。" } },
        { status: 502 },
      )
    }

    const regionProgress = progressResult.data?.regionProgress?.[regionId]?.progress ?? 0
    const snapshot = buildBossChallengeSnapshot({
      regionId,
      regionProgress,
      readingRows,
    })

    if (snapshot.status !== "ready") {
      return NextResponse.json(
        {
          ok: false,
          error: { message: snapshot.requirementText },
          data: { status: snapshot.status },
        },
        { status: 422 },
      )
    }

    const petRow = petResult.row as GenericRecord | null
    if (!petRow) {
      return NextResponse.json({ ok: false, error: { message: "未找到宠物记录。" } }, { status: 404 })
    }

    const petIdField = resolveFieldName(petRow, ["id", "pet_id"])
    const petId = petIdField ? String(petRow[petIdField]) : null
    if (!petId) {
      return NextResponse.json({ ok: false, error: { message: "宠物 ID 无效。" } }, { status: 422 })
    }

    const userOwnerField = await findExistingColumn(serviceClient, "users", [
      "user_id",
      "id",
      "uid",
      "auth_user_id",
    ])
    const userResult = userOwnerField
      ? await serviceClient.from("users").select("*").eq(userOwnerField, userId).limit(1).maybeSingle()
      : { data: null, error: null }

    if (userResult.error || !userResult.data) {
      return NextResponse.json({ ok: false, error: { message: "未找到用户记录。" } }, { status: 404 })
    }

    const userRow = userResult.data as GenericRecord
    const userIdField = resolveFieldName(userRow, ["id", "user_id"]) ?? userOwnerField ?? "id"

    const petColumns = await findExistingColumns(serviceClient, "pets", [
      "pet_level",
      "level",
      "pet_exp",
      "experience",
      "exp",
      "life_stage",
      "pet_life_stage",
    ])
    const userColumns = await findExistingColumns(serviceClient, "users", ["coins", "gold", "coin_balance", "experience", "exp", "user_exp"])

    const levelField = petColumns.includes("pet_level") ? "pet_level" : petColumns.includes("level") ? "level" : null
    const petExpField = petColumns.includes("pet_exp")
      ? "pet_exp"
      : petColumns.includes("experience")
        ? "experience"
        : petColumns.includes("exp")
          ? "exp"
          : null
    const lifeStageField = petColumns.includes("life_stage")
      ? "life_stage"
      : petColumns.includes("pet_life_stage")
        ? "pet_life_stage"
        : null
    const coinsField = userColumns.includes("coins")
      ? "coins"
      : userColumns.includes("gold")
        ? "gold"
        : userColumns.includes("coin_balance")
          ? "coin_balance"
          : null
    const userExpField = userColumns.includes("experience")
      ? "experience"
      : userColumns.includes("user_exp")
        ? "user_exp"
        : userColumns.includes("exp")
          ? "exp"
          : null

    const challengeChapterId = buildBossChallengeChapterId(regionId)
    const insertResult = await insertBossVictoryRecord({
      supabase,
      userId,
      petId,
      regionId,
      challengeChapterId,
      starsGain: boss.starsGain,
      experienceGain: boss.experienceGain,
      petExpGain: boss.petExpGain,
    })

    if (insertResult.error) {
      return NextResponse.json(
        { ok: false, error: { message: insertResult.error instanceof Error ? insertResult.error.message : "写入 BOSS 记录失败。" } },
        { status: 502 },
      )
    }

    const petUpdate: GenericRecord = {}
    if (levelField && petExpField) {
      const currentPetExp = Math.max(0, getNumeric(petRow[petExpField], 0))
      const nextPetExp = currentPetExp + boss.petExpGain
      petUpdate[petExpField] = nextPetExp
      petUpdate[levelField] = levelFromTotalExp(nextPetExp)
      if (lifeStageField) {
        petUpdate[lifeStageField] = resolveLifeStageFromLevel(levelFromTotalExp(nextPetExp))
      }
    }

    if (Object.keys(petUpdate).length > 0) {
      const petIdColumn = resolveFieldName(petRow, ["id", "pet_id"]) ?? "id"
      await supabase.from("pets").update(petUpdate).eq(petIdColumn, petId)
    }

    const userUpdate: GenericRecord = {}
    if (coinsField) {
      userUpdate[coinsField] = Math.max(0, getNumeric(userRow[coinsField], 0)) + boss.ownerCoins
    }
    if (userExpField) {
      userUpdate[userExpField] = Math.max(0, getNumeric(userRow[userExpField], 0)) + boss.experienceGain
    }
    if (Object.keys(userUpdate).length > 0) {
      await supabase.from("users").update(userUpdate).eq(userIdField, userId)
    }

    const treasureResult = await syncUserTreasuresAfterActivity({ supabase, serviceClient, userId })
    const latestProgress = await fetchUserAdventureProgress({ supabase, serviceClient, userId })

    await emitBossVictoryNotification(serviceClient, userId, regionId, boss.name)
    await emitRegionUnlockNotifications(
      serviceClient,
      userId,
      progressBeforeResult.data,
      latestProgress.data,
    )
    await emitRegionProgressReminders(serviceClient, userId, latestProgress.data)

    const response = NextResponse.json({
      ok: true,
      data: {
        bossName: boss.name,
        starsGain: boss.starsGain,
        ownerCoins: boss.ownerCoins,
        petExpGain: boss.petExpGain,
        experienceGain: boss.experienceGain,
        adventureProgress: latestProgress.data,
        newlyUnlockedTreasures: treasureResult.newlyUnlocked,
      },
    })
    if (sessionState.refreshedSession) setAuthCookies(response, sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown server error" } },
      { status: 503 },
    )
  }
}

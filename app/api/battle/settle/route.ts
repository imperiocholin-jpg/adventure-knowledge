import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  createSupabaseUserClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { findExistingColumn, findExistingColumns } from "@/lib/data/schema-compat"
import { resolveBattleRewardGrant } from "@/lib/economy/reward-policy"
import { levelFromTotalExp, resolveLifeStageFromLevel } from "@/lib/pets/level-progress"
import { getUsersOwnerField, incrementBattleWin } from "@/lib/social/server"
import {
  applyBattleVitalDeduction,
  assertCanEnterBattle,
  buildVitalUpdatePayload,
  resolvePetVitalColumns,
} from "@/lib/pets/battle-vitals-server"
import { BATTLE_SATIETY_COST, BATTLE_SPIRIT_COST, parsePetVitalsFromRecord } from "@/lib/pets/state"
import {
  emitPetCareNotifications,
  emitPetDeathNotification,
  resolvePetNameFromRow,
} from "@/lib/notifications/emitters"

interface BattleSettlePayload {
  result?: "win" | "lose" | "draw"
  petExpGain?: number
  ownerCoinsGain?: number
  consumeSatiety?: number
  consumeSpirit?: number
  hasFirstWinBonus?: boolean
  /** 入场时已扣减状态（/api/battle/enter） */
  skipVitalCost?: boolean
  /** @deprecated */
  consumeHunger?: number
}

function readNumber(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.floor(n) : fallback
}

export async function POST(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")

    const body = (await request.json()) as BattleSettlePayload
    const result = body.result ?? "lose"
    if (result !== "win" && result !== "lose" && result !== "draw") {
      return NextResponse.json({ ok: false, error: { message: "无效的结算结果。" } }, { status: 400 })
    }

    const grant = resolveBattleRewardGrant(result, Boolean(body.hasFirstWinBonus))
    const petExpGain = Number.isFinite(Number(body.petExpGain))
      ? Math.max(0, Math.floor(Number(body.petExpGain)))
      : grant.petExp + grant.firstWinBonusPetExp
    const ownerCoinsGain = Number.isFinite(Number(body.ownerCoinsGain))
      ? Math.max(0, Math.floor(Number(body.ownerCoinsGain)))
      : grant.ownerCoins

    const consumeSatiety = Number.isFinite(Number(body.consumeSatiety ?? body.consumeHunger))
      ? Math.max(0, Math.floor(Number(body.consumeSatiety ?? body.consumeHunger)))
      : BATTLE_SATIETY_COST
    const consumeSpirit = Number.isFinite(Number(body.consumeSpirit))
      ? Math.max(0, Math.floor(Number(body.consumeSpirit)))
      : BATTLE_SPIRIT_COST

    const supabase = createSupabaseUserClient(sessionState.accessToken)
    const serviceClient = createSupabaseServiceClient()

    const columnResult = await resolvePetVitalColumns(serviceClient)
    if (!columnResult.ok) {
      return NextResponse.json({ ok: false, error: { message: columnResult.message } }, { status: columnResult.status })
    }
    const { ownerField, columns: vitalColumns } = columnResult

    const petColumns = await findExistingColumns(serviceClient, "pets", [
      "id",
      "pet_id",
      "pet_level",
      "level",
      "pet_exp",
      "experience",
      "exp",
      "life_stage",
      "pet_life_stage",
      "updated_at",
    ])

    const userColumns = await findExistingColumns(serviceClient, "users", ["id", "user_id", "coins", "gold", "coin_balance", "updated_at"])

    const idField = petColumns.includes("id") ? "id" : petColumns.includes("pet_id") ? "pet_id" : null
    const levelField = petColumns.includes("pet_level") ? "pet_level" : petColumns.includes("level") ? "level" : null
    const expField = petColumns.includes("pet_exp")
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

    if (!idField || !levelField || !expField) {
      return NextResponse.json(
        { ok: false, error: { message: "pets 表缺少 pet_level/pet_exp 相关字段，无法结算。" } },
        { status: 422 },
      )
    }

    const petResult = await supabase.from("pets").select("*").eq(ownerField, sessionState.user.id).limit(1).maybeSingle()
    if (petResult.error || !petResult.data) {
      return NextResponse.json(
        { ok: false, error: { message: petResult.error?.message ?? "未找到宠物记录。" } },
        { status: 404 },
      )
    }

    const row = petResult.data as Record<string, unknown>
    const vitals = parsePetVitalsFromRecord(row)
    const skipVitalCost = Boolean(body.skipVitalCost)

    if (!skipVitalCost) {
      const gate = assertCanEnterBattle(vitals)
      if (!gate.ok) {
        return NextResponse.json({ ok: false, error: { message: gate.message } }, { status: 422 })
      }
    } else if (vitals.isDead) {
      return NextResponse.json({ ok: false, error: { message: "宠物已离世，无法结算本场对战。" } }, { status: 422 })
    }

    const currentExp = Math.max(0, readNumber(row[expField], 0))
    const totalExp = currentExp + petExpGain
    const nextLevel = levelFromTotalExp(totalExp)
    const nextLifeStage = resolveLifeStageFromLevel(nextLevel)

    const updatePayload: Record<string, unknown> = {
      [levelField]: nextLevel,
      [expField]: totalExp,
    }
    if (lifeStageField) updatePayload[lifeStageField] = nextLifeStage

    const afterBattle = skipVitalCost
      ? vitals
      : applyBattleVitalDeduction(vitals, consumeSatiety, consumeSpirit)
    const vitalPayload = buildVitalUpdatePayload(vitalColumns, afterBattle)
    Object.assign(updatePayload, vitalPayload)
    if (petColumns.includes("updated_at") && !vitalColumns.hasUpdatedAt) {
      updatePayload.updated_at = new Date().toISOString()
    }

    const updateResult = await supabase.from("pets").update(updatePayload).eq(idField, row[idField]).select("*").limit(1)
    if (updateResult.error) {
      return NextResponse.json({ ok: false, error: { message: updateResult.error.message } }, { status: 502 })
    }

    let battleWinsAfter: number | null = null
    if (result === "win") {
      const userOwnerField = await getUsersOwnerField(serviceClient)
      if (userOwnerField) {
        try {
          battleWinsAfter = await incrementBattleWin(serviceClient, sessionState.user.id, userOwnerField)
        } catch {
          // 胜场写入失败不阻断对战结算
        }
      }
    }

    let coinsAfter: number | null = null
    if (ownerCoinsGain > 0) {
      const userIdField = userColumns.includes("id") ? "id" : userColumns.includes("user_id") ? "user_id" : null
      const coinsField = userColumns.includes("coins")
        ? "coins"
        : userColumns.includes("gold")
          ? "gold"
          : userColumns.includes("coin_balance")
            ? "coin_balance"
            : null

      if (userIdField && coinsField) {
        const userResult = await supabase.from("users").select("*").eq(userIdField, sessionState.user.id).limit(1).maybeSingle()
        if (!userResult.error && userResult.data) {
          const userRow = userResult.data as Record<string, unknown>
          const prevCoins = Math.max(0, readNumber(userRow[coinsField], 0))
          coinsAfter = prevCoins + ownerCoinsGain
          const userUpdate: Record<string, unknown> = { [coinsField]: coinsAfter }
          if (userColumns.includes("updated_at")) userUpdate.updated_at = new Date().toISOString()
          await supabase.from("users").update(userUpdate).eq(userIdField, sessionState.user.id)
        }
      }
    }

    const updatedPetRow = (updateResult.data?.[0] ?? row) as Record<string, unknown>
    const petName = resolvePetNameFromRow(updatedPetRow)
    const petIdValue = idField ? String(row[idField]) : undefined
    if (afterBattle.isDead && !vitals.isDead) {
      await emitPetDeathNotification(serviceClient, sessionState.user.id, petName, petIdValue)
    } else if (!skipVitalCost) {
      await emitPetCareNotifications(serviceClient, sessionState.user.id, afterBattle, petName)
    }

    const response = NextResponse.json({
      ok: true,
      data: {
        pet: updateResult.data?.[0] ?? null,
        applied: {
          result,
          petExpGain,
          ownerCoinsGain,
          coinsAfter,
          battleWinsAfter,
          nextLevel,
          nextExp: totalExp,
          nextLifeStage,
          consumeSatiety: skipVitalCost ? 0 : consumeSatiety,
          consumeSpirit: skipVitalCost ? 0 : consumeSpirit,
          skipVitalCost,
          satietyAfter: vitalColumns.hungerField ? afterBattle.satiety : null,
          spiritAfter: vitalColumns.spiritField ? afterBattle.spirit : null,
          isDeadAfter: afterBattle.isDead,
        },
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

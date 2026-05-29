import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  createSupabaseUserClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import {
  applyBattleVitalDeduction,
  assertCanEnterBattle,
  buildVitalUpdatePayload,
  resolvePetVitalColumns,
} from "@/lib/pets/battle-vitals-server"
import { BATTLE_SATIETY_COST, BATTLE_SPIRIT_COST, parsePetVitalsFromRecord } from "@/lib/pets/state"

interface BattleEnterPayload {
  modeId?: string
}

export async function POST(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")

    const body = (await request.json().catch(() => ({}))) as BattleEnterPayload
    const modeId = typeof body.modeId === "string" ? body.modeId : "unknown"

    const serviceClient = createSupabaseServiceClient()
    const columnResult = await resolvePetVitalColumns(serviceClient)
    if (!columnResult.ok) {
      return NextResponse.json({ ok: false, error: { message: columnResult.message } }, { status: columnResult.status })
    }

    const { ownerField, columns } = columnResult
    if (!columns.hungerField && !columns.spiritField) {
      return NextResponse.json(
        { ok: false, error: { message: "pets 表缺少饱食/精神字段，无法扣减对战状态。" } },
        { status: 422 },
      )
    }

    const supabase = createSupabaseUserClient(sessionState.accessToken)
    const petResult = await supabase.from("pets").select("*").eq(ownerField, sessionState.user.id).limit(1).maybeSingle()
    if (petResult.error || !petResult.data) {
      return NextResponse.json(
        { ok: false, error: { message: petResult.error?.message ?? "未找到宠物记录。" } },
        { status: 404 },
      )
    }

    const row = petResult.data as Record<string, unknown>
    const vitals = parsePetVitalsFromRecord(row)
    const gate = assertCanEnterBattle(vitals)
    if (!gate.ok) {
      return NextResponse.json({ ok: false, error: { message: gate.message } }, { status: 422 })
    }

    const afterBattle = applyBattleVitalDeduction(vitals, BATTLE_SATIETY_COST, BATTLE_SPIRIT_COST)
    const updatePayload = buildVitalUpdatePayload(columns, afterBattle)

    const updateResult = await supabase
      .from("pets")
      .update(updatePayload)
      .eq(columns.idField, row[columns.idField])
      .select("*")
      .limit(1)

    if (updateResult.error) {
      return NextResponse.json({ ok: false, error: { message: updateResult.error.message } }, { status: 502 })
    }

    const response = NextResponse.json({
      ok: true,
      data: {
        modeId,
        pet: updateResult.data?.[0] ?? null,
        applied: {
          consumeSatiety: BATTLE_SATIETY_COST,
          consumeSpirit: BATTLE_SPIRIT_COST,
          satietyAfter: afterBattle.satiety,
          spiritAfter: afterBattle.spirit,
          bondAfter: afterBattle.bond,
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

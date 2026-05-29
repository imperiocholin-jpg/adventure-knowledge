import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { findExistingColumn, findExistingColumns } from "@/lib/data/schema-compat"
import { applyDailyVitalDecay, parsePetVitalsFromRecord, writeVitalFieldsToPayload } from "@/lib/pets/state"

type GenericRecord = Record<string, unknown>

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")

    const serviceClient = createSupabaseServiceClient()
    const ownerField = await findExistingColumn(serviceClient, "pets", [
      "user_id",
      "uid",
      "owner_id",
      "auth_user_id",
    ])
    if (!ownerField) {
      return NextResponse.json({ ok: false, error: { message: "pets 表缺少用户归属字段。" } }, { status: 422 })
    }

    const columns = await findExistingColumns(serviceClient, "pets", [
      "id",
      "pet_id",
      "hunger",
      "pet_hunger",
      "spirit",
      "pet_spirit",
      "energy",
      "bond",
      "pet_bond",
      "happiness",
      "intimacy",
      "is_dead",
      "pet_dead",
      "dead_at",
      "pet_dead_at",
      "last_daily_decay_date",
      "updated_at",
    ])

    const petResult = await serviceClient
      .from("pets")
      .select("*")
      .eq(ownerField, sessionState.user.id)
      .limit(1)
      .maybeSingle()

    if (petResult.error || !petResult.data) {
      return NextResponse.json(
        { ok: false, error: { message: petResult.error?.message ?? "未找到宠物记录。" } },
        { status: 404 },
      )
    }

    const petRow = petResult.data as GenericRecord
    const today = new Date().toISOString().slice(0, 10)
    const lastDecay =
      columns.includes("last_daily_decay_date") && typeof petRow.last_daily_decay_date === "string"
        ? petRow.last_daily_decay_date.slice(0, 10)
        : null

    const currentState = parsePetVitalsFromRecord(petRow)
    if (lastDecay === today || currentState.isDead) {
      const response = NextResponse.json({
        ok: true,
        data: { applied: false, state: currentState, reason: lastDecay === today ? "already_decayed" : "pet_dead" },
      })
      if (sessionState.refreshedSession) setAuthCookies(response, sessionState.refreshedSession)
      return response
    }

    const nextState = applyDailyVitalDecay(currentState)
    const idField = columns.includes("id") ? "id" : columns.includes("pet_id") ? "pet_id" : null
    if (!idField) {
      return NextResponse.json({ ok: false, error: { message: "pets 表缺少主键字段。" } }, { status: 422 })
    }

    const payload: GenericRecord = {
      ...writeVitalFieldsToPayload(nextState, {
        satietyField: columns.includes("hunger") ? "hunger" : columns.includes("pet_hunger") ? "pet_hunger" : null,
        spiritField: columns.includes("spirit")
          ? "spirit"
          : columns.includes("pet_spirit")
            ? "pet_spirit"
            : columns.includes("energy")
              ? "energy"
              : null,
        bondField: columns.includes("bond")
          ? "bond"
          : columns.includes("pet_bond")
            ? "pet_bond"
            : columns.includes("happiness")
              ? "happiness"
              : null,
        deadField: columns.includes("is_dead") ? "is_dead" : columns.includes("pet_dead") ? "pet_dead" : null,
        deadAtField: columns.includes("dead_at") ? "dead_at" : columns.includes("pet_dead_at") ? "pet_dead_at" : null,
      }),
    }
    if (columns.includes("last_daily_decay_date")) payload.last_daily_decay_date = today
    if (columns.includes("updated_at")) payload.updated_at = new Date().toISOString()

    const updateResult = await serviceClient
      .from("pets")
      .update(payload)
      .eq(idField, petRow[idField])
      .select("*")
      .limit(1)

    if (updateResult.error) {
      return NextResponse.json({ ok: false, error: { message: updateResult.error.message } }, { status: 502 })
    }

    const response = NextResponse.json({
      ok: true,
      data: { applied: true, state: nextState, pet: updateResult.data?.[0] ?? null },
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

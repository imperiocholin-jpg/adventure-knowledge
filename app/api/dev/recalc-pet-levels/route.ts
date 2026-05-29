import { NextRequest, NextResponse } from "next/server"

import { createSupabaseServiceClient, getRequestSessionUser, unauthorizedResponse } from "@/lib/auth/server"
import { levelFromTotalExp, resolveLifeStageFromLevel } from "@/lib/pets/level-progress"

export const dynamic = "force-dynamic"

function readExp(row: Record<string, unknown>) {
  const raw = row.pet_exp ?? row.exp ?? row.experience ?? 0
  const n = Number(raw)
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
}

/** 开发用：按方案 A 重算全部宠物等级（需登录） */
export async function POST(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user) return unauthorizedResponse("User is not authenticated.")

    if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_RECALC !== "1") {
      return NextResponse.json({ ok: false, error: { message: "生产环境未开启重算。" } }, { status: 403 })
    }

    const supabase = createSupabaseServiceClient()
    const { data: pets, error } = await supabase.from("pets").select("*")
    if (error) {
      return NextResponse.json({ ok: false, error: { message: error.message } }, { status: 502 })
    }

    const results: Array<{ id: string; exp: number; level: number; lifeStage: string }> = []

    for (const row of (pets ?? []) as Record<string, unknown>[]) {
      const id = String(row.id ?? row.pet_id ?? "")
      if (!id) continue

      const exp = readExp(row)
      const level = levelFromTotalExp(exp)
      const lifeStage = resolveLifeStageFromLevel(level)

      const payload: Record<string, unknown> = {}
      if ("pet_level" in row) payload.pet_level = level
      if ("level" in row) payload.level = level
      if ("pet_exp" in row) payload.pet_exp = exp
      if ("exp" in row) payload.exp = exp
      if ("life_stage" in row) payload.life_stage = lifeStage
      if ("pet_life_stage" in row) payload.pet_life_stage = lifeStage
      if ("updated_at" in row) payload.updated_at = new Date().toISOString()

      const idField = row.id !== undefined ? "id" : "pet_id"
      const { error: updateError } = await supabase.from("pets").update(payload).eq(idField, id)
      if (updateError) continue

      results.push({ id, exp, level, lifeStage })
    }

    return NextResponse.json({ ok: true, data: { updated: results.length, results } })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown error" } },
      { status: 503 },
    )
  }
}

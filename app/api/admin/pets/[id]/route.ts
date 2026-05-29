import { NextRequest, NextResponse } from "next/server"

import { writeAdminAuditLog } from "@/lib/admin/audit-log"
import { preserveUnknownInventoryKeys, readPetInventoryFromRow, sanitizeAdminInventory } from "@/lib/admin/pet-inventory"
import { resolvePetsIdField, summarizePetRow } from "@/lib/admin/record-fields"
import { setAuthCookies } from "@/lib/auth/server"
import { requireAdminApi } from "@/lib/auth/require-admin"
import { findExistingColumns } from "@/lib/data/schema-compat"
import { levelFromTotalExp, cumulativeExpForLevel, resolveLifeStageFromLevel } from "@/lib/pets/level-progress"
import { buildPetTypeColumnPatch, isValidPetTypeId } from "@/lib/pets/pet-type-options"

type GenericRecord = Record<string, unknown>

interface PatchAdminPetBody {
  name?: string
  hunger?: number
  spirit?: number
  bond?: number
  petExp?: number
  petLevel?: number
  petType?: string
  isDead?: boolean
  inventory?: Record<string, number>
}

function normalizePetName(value: unknown) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, 12)
}

export const dynamic = "force-dynamic"

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const { id } = await context.params
    const body = (await request.json()) as PatchAdminPetBody
    const idField = await resolvePetsIdField(admin.serviceClient)
    if (!idField) {
      return NextResponse.json({ ok: false, error: { message: "pets 表缺少主键" } }, { status: 422 })
    }

    const existing = await admin.serviceClient.from("pets").select("*").eq(idField, id).limit(1).maybeSingle()
    if (existing.error || !existing.data) {
      return NextResponse.json({ ok: false, error: { message: "宠物不存在" } }, { status: 404 })
    }

    const row = existing.data as GenericRecord
    const writable = await findExistingColumns(admin.serviceClient, "pets", [
      "name",
      "pet_name",
      "hunger",
      "spirit",
      "bond",
      "pet_exp",
      "experience",
      "exp",
      "pet_level",
      "level",
      "life_stage",
      "species",
      "pet_species",
      "breed",
      "pet_breed",
      "emoji",
      "pet_emoji",
      "is_dead",
      "dead_at",
      "pet_inventory",
      "inventory",
      "updated_at",
    ])

    const payload: GenericRecord = {}
    if (body.name !== undefined) {
      const petName = normalizePetName(body.name)
      if (!petName) {
        return NextResponse.json({ ok: false, error: { message: "宠物名称不能为空" } }, { status: 400 })
      }
      if (writable.includes("name")) payload.name = petName
      if (writable.includes("pet_name")) payload.pet_name = petName
    }
    if (typeof body.petType === "string" && isValidPetTypeId(body.petType.trim())) {
      Object.assign(payload, buildPetTypeColumnPatch(writable, body.petType.trim()))
    }
    if (typeof body.hunger === "number" && Number.isFinite(body.hunger) && writable.includes("hunger")) {
      payload.hunger = Math.min(100, Math.max(0, Math.floor(body.hunger)))
    }
    if (typeof body.spirit === "number" && Number.isFinite(body.spirit) && writable.includes("spirit")) {
      payload.spirit = Math.min(100, Math.max(0, Math.floor(body.spirit)))
    }
    if (typeof body.bond === "number" && Number.isFinite(body.bond) && writable.includes("bond")) {
      payload.bond = Math.min(100, Math.max(0, Math.floor(body.bond)))
    }
    if (typeof body.petExp === "number" && Number.isFinite(body.petExp)) {
      const expField = writable.find((f) => ["pet_exp", "experience", "exp"].includes(f))
      if (expField) payload[expField] = Math.max(0, Math.floor(body.petExp))
    }
    if (typeof body.petLevel === "number" && Number.isFinite(body.petLevel)) {
      const level = Math.max(1, Math.min(50, Math.floor(body.petLevel)))
      const levelField = writable.find((f) => ["pet_level", "level"].includes(f))
      if (levelField) payload[levelField] = level
      if (body.petExp === undefined) {
        const expField = writable.find((f) => ["pet_exp", "experience", "exp"].includes(f))
        if (expField) payload[expField] = cumulativeExpForLevel(level)
      }
      if (writable.includes("life_stage")) payload.life_stage = resolveLifeStageFromLevel(level)
    }
    if (typeof body.isDead === "boolean" && writable.includes("is_dead")) {
      payload.is_dead = body.isDead
      if (writable.includes("dead_at")) {
        payload.dead_at = body.isDead ? new Date().toISOString() : null
      }
    }

    if (body.inventory !== undefined) {
      const inventoryField = ["pet_inventory", "inventory"].find((field) => writable.includes(field))
      if (inventoryField) {
        const existingInventory = readPetInventoryFromRow(row)
        const nextInventory = preserveUnknownInventoryKeys(
          sanitizeAdminInventory(body.inventory),
          existingInventory,
        )
        payload[inventoryField] = nextInventory
      }
    }

    if (payload.pet_exp !== undefined || payload.experience !== undefined || payload.exp !== undefined) {
      const totalExp = Number(payload.pet_exp ?? payload.experience ?? payload.exp ?? 0)
      const level = levelFromTotalExp(totalExp)
      if (writable.includes("pet_level")) payload.pet_level = level
      if (writable.includes("life_stage")) payload.life_stage = resolveLifeStageFromLevel(level)
    }

    if (writable.includes("updated_at")) payload.updated_at = new Date().toISOString()

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ ok: false, error: { message: "没有可更新的字段" } }, { status: 400 })
    }

    const updateResult = await admin.serviceClient
      .from("pets")
      .update(payload)
      .eq(idField, row[idField])
      .select("*")
      .limit(1)

    if (updateResult.error) {
      return NextResponse.json({ ok: false, error: { message: updateResult.error.message } }, { status: 502 })
    }

    await writeAdminAuditLog(admin.serviceClient, {
      adminUserId: admin.adminUserId,
      action: "patch_pet",
      targetType: "pet",
      targetId: id,
      payload: body as Record<string, unknown>,
    })

    const updated = (updateResult.data?.[0] ?? row) as GenericRecord
    const response = NextResponse.json({ ok: true, data: summarizePetRow(updated) })
    if (admin.sessionState.refreshedSession) {
      setAuthCookies(response, admin.sessionState.refreshedSession)
    }
    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown error" } },
      { status: 503 },
    )
  }
}

import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { findExistingColumn, findExistingColumns } from "@/lib/data/schema-compat"
import { getBattleItemConfig } from "@/lib/pets/battle-items"
import { normalizeInventory } from "@/lib/pets/state"

type GenericRecord = Record<string, unknown>

interface ConsumePayload {
  itemIds?: string[]
}

const INVENTORY_FIELDS = ["pet_inventory", "inventory", "pet_loadout", "pet_equipment_ids", "equipment_ids"]

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")

    const body = (await request.json()) as ConsumePayload
    const rawIds = Array.isArray(body.itemIds) ? body.itemIds : []
    const itemIds = [...new Set(rawIds.filter((id) => typeof id === "string" && getBattleItemConfig(id)))]
    if (itemIds.length === 0) {
      return NextResponse.json({ ok: true, data: { consumed: [], inventory: {} } })
    }

    const serviceClient = createSupabaseServiceClient()
    const ownerField = await findExistingColumn(serviceClient, "pets", ["user_id", "uid", "owner_id", "auth_user_id"])
    if (!ownerField) {
      return NextResponse.json({ ok: false, error: { message: "pets 表缺少用户归属字段。" } }, { status: 422 })
    }

    const existingColumns = await findExistingColumns(serviceClient, "pets", ["id", "pet_id", ...INVENTORY_FIELDS, "updated_at"])
    const idField = existingColumns.includes("id") ? "id" : existingColumns.includes("pet_id") ? "pet_id" : null
    const inventoryField = INVENTORY_FIELDS.find((field) => existingColumns.includes(field)) ?? null
    if (!idField || !inventoryField) {
      return NextResponse.json({ ok: false, error: { message: "缺少背包字段，无法扣减道具。" } }, { status: 422 })
    }

    const petResult = await serviceClient.from("pets").select("*").eq(ownerField, sessionState.user.id).limit(1).maybeSingle()
    if (petResult.error || !petResult.data) {
      return NextResponse.json({ ok: false, error: { message: petResult.error?.message ?? "未找到宠物记录。" } }, { status: 404 })
    }

    const petRow = petResult.data as GenericRecord
    const inventory = normalizeInventory(petRow[inventoryField])
    const consumed: string[] = []
    const nextInventory = { ...inventory }

    for (const itemId of itemIds) {
      const count = nextInventory[itemId] ?? 0
      if (count <= 0) continue
      nextInventory[itemId] = count - 1
      if (nextInventory[itemId] <= 0) delete nextInventory[itemId]
      consumed.push(itemId)
    }

    const updatePayload: GenericRecord = { [inventoryField]: nextInventory }
    if (existingColumns.includes("updated_at")) updatePayload.updated_at = new Date().toISOString()

    let updateResult = await serviceClient.from("pets").update(updatePayload).eq(idField, petRow[idField]).select("*").limit(1)
    if (updateResult.error) {
      updatePayload[inventoryField] = JSON.stringify(nextInventory)
      updateResult = await serviceClient.from("pets").update(updatePayload).eq(idField, petRow[idField]).select("*").limit(1)
    }
    if (updateResult.error) {
      return NextResponse.json({ ok: false, error: { message: updateResult.error.message } }, { status: 502 })
    }

    const response = NextResponse.json({
      ok: true,
      data: {
        consumed,
        inventory: nextInventory,
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

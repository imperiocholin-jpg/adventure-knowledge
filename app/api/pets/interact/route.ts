import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { findExistingColumn, findExistingColumns } from "@/lib/data/schema-compat"
import { findShopItem, PET_SHOP_ITEMS, SHOP_ACTION_REQUIREMENTS, type PetInteractAction } from "@/lib/pets/shop"
import {
  applyInteractEffects,
  getRequiredItemNotice,
  normalizeInventory,
  parsePetVitalsFromRecord,
  writeVitalFieldsToPayload,
} from "@/lib/pets/state"

type GenericRecord = Record<string, unknown>

interface InteractPayload {
  action?: PetInteractAction
  itemId?: string
}

const INVENTORY_FIELDS = ["pet_inventory", "inventory", "pet_loadout", "pet_equipment_ids", "equipment_ids"]
const HUNGER_FIELDS = ["hunger", "pet_hunger"]
const SPIRIT_FIELDS = ["spirit", "pet_spirit", "energy"]
const BOND_FIELDS = ["bond", "pet_bond", "happiness", "intimacy"]
const DEAD_FIELDS = ["is_dead", "pet_dead"]
const DEAD_AT_FIELDS = ["dead_at", "pet_dead_at"]

const actionHints: Record<PetInteractAction, string> = {
  feed: "喂食成功，状态已恢复。",
  train: "训练完成，状态已提升。",
  sleep: "休息完成，精神恢复。",
  play: "玩耍完成，亲密增长。",
}

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")

    const body = (await request.json()) as InteractPayload
    const action = body.action
    if (!action || !(action in SHOP_ACTION_REQUIREMENTS)) {
      return NextResponse.json({ ok: false, error: { message: "无效互动类型。" } }, { status: 400 })
    }

    const requiredCategory = SHOP_ACTION_REQUIREMENTS[action]
    const bodyItemId = typeof body.itemId === "string" ? body.itemId.trim() : ""

    const serviceClient = createSupabaseServiceClient()
    const ownerField = await findExistingColumn(serviceClient, "pets", ["user_id", "uid", "owner_id", "auth_user_id"])
    if (!ownerField) {
      return NextResponse.json({ ok: false, error: { message: "pets 表缺少用户归属字段。" } }, { status: 422 })
    }

    const existingColumns = await findExistingColumns(serviceClient, "pets", [
      "id",
      "pet_id",
      ...INVENTORY_FIELDS,
      ...HUNGER_FIELDS,
      ...SPIRIT_FIELDS,
      ...BOND_FIELDS,
      ...DEAD_FIELDS,
      ...DEAD_AT_FIELDS,
      "updated_at",
    ])

    const idField = existingColumns.includes("id") ? "id" : existingColumns.includes("pet_id") ? "pet_id" : null
    const inventoryField = INVENTORY_FIELDS.find((field) => existingColumns.includes(field)) ?? null
    if (!idField || !inventoryField) {
      return NextResponse.json({ ok: false, error: { message: "缺少背包字段，无法执行互动。" } }, { status: 422 })
    }

    const hungerField = HUNGER_FIELDS.find((field) => existingColumns.includes(field)) ?? null
    const spiritField = SPIRIT_FIELDS.find((field) => existingColumns.includes(field)) ?? null
    const bondField = BOND_FIELDS.find((field) => existingColumns.includes(field)) ?? null
    const deadField = DEAD_FIELDS.find((field) => existingColumns.includes(field)) ?? null
    const deadAtField = DEAD_AT_FIELDS.find((field) => existingColumns.includes(field)) ?? null

    const petResult = await serviceClient.from("pets").select("*").eq(ownerField, sessionState.user.id).limit(1).maybeSingle()
    if (petResult.error || !petResult.data) {
      return NextResponse.json({ ok: false, error: { message: petResult.error?.message ?? "未找到宠物记录。" } }, { status: 404 })
    }

    const petRow = petResult.data as GenericRecord
    const inventory = normalizeInventory(petRow[inventoryField])
    const ownedInCategory = PET_SHOP_ITEMS.filter(
      (item) => item.category === requiredCategory && (inventory[item.id] ?? 0) > 0,
    )
    if (ownedInCategory.length === 0) {
      return NextResponse.json({ ok: false, error: { message: getRequiredItemNotice(action) } }, { status: 422 })
    }

    const pickedById = bodyItemId ? findShopItem(bodyItemId) : null
    if (bodyItemId && (!pickedById || pickedById.category !== requiredCategory)) {
      return NextResponse.json({ ok: false, error: { message: "所选道具无效或不属于当前互动类型。" } }, { status: 400 })
    }
    if (bodyItemId && (inventory[bodyItemId] ?? 0) <= 0) {
      return NextResponse.json({ ok: false, error: { message: "仓库中已无该道具。" } }, { status: 422 })
    }

    const pickedItem = pickedById ?? ownedInCategory[0]
    if (!pickedItem || (inventory[pickedItem.id] ?? 0) <= 0) {
      return NextResponse.json({ ok: false, error: { message: getRequiredItemNotice(action) } }, { status: 422 })
    }

    const state = parsePetVitalsFromRecord(petRow)
    if (state.isDead) {
      return NextResponse.json({ ok: false, error: { message: "宠物已离世，无法互动。" } }, { status: 422 })
    }

    const nextInventory = { ...inventory }
    nextInventory[pickedItem.id] = Math.max(0, (nextInventory[pickedItem.id] ?? 0) - 1)
    if (nextInventory[pickedItem.id] <= 0) {
      delete nextInventory[pickedItem.id]
    }
    const nextState = applyInteractEffects(state, pickedItem.effect)

    const updatePayload: GenericRecord = {
      [inventoryField]: nextInventory,
      ...writeVitalFieldsToPayload(nextState, {
        satietyField: hungerField,
        spiritField,
        bondField,
        deadField,
        deadAtField,
      }),
    }
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
        action,
        consumedItemId: pickedItem.id,
        inventory: nextInventory,
        state: nextState,
        hint: actionHints[action],
        pet: updateResult.data?.[0] ?? null,
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

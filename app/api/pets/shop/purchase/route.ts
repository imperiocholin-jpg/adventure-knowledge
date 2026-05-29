import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { findExistingColumn, findExistingColumns } from "@/lib/data/schema-compat"
import { findShopItemById, loadShopItems } from "@/lib/admin/shop-store"
import { normalizeInventory, parsePetVitalsFromRecord } from "@/lib/pets/state"

type GenericRecord = Record<string, unknown>

interface PurchasePayload {
  itemId?: string
  quantity?: number
}

const INVENTORY_FIELDS = ["pet_inventory", "inventory", "pet_loadout", "pet_equipment_ids", "equipment_ids"]

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")

    const shopItems = await loadShopItems()
    const body = (await request.json()) as PurchasePayload
    const item = body.itemId ? findShopItemById(shopItems, body.itemId) : null
    if (!item) {
      return NextResponse.json({ ok: false, error: { message: "无效商品。" } }, { status: 400 })
    }
    const quantity = Number.isFinite(Number(body.quantity)) ? Math.max(1, Math.floor(Number(body.quantity))) : 1
    const totalCost = item.price * quantity

    const serviceClient = createSupabaseServiceClient()

    const ownerField = await findExistingColumn(serviceClient, "pets", ["user_id", "uid", "owner_id", "auth_user_id"])
    const userIdField = await findExistingColumn(serviceClient, "users", ["id", "user_id", "uid", "auth_user_id"])
    if (!ownerField || !userIdField) {
      return NextResponse.json({ ok: false, error: { message: "缺少用户映射字段，无法购买。" } }, { status: 422 })
    }

    const pointsField =
      (await findExistingColumn(serviceClient, "users", ["points", "score", "coins", "gold", "coin_balance"])) ?? null
    if (!pointsField) {
      return NextResponse.json({ ok: false, error: { message: "users 表缺少积分字段，无法购买。" } }, { status: 422 })
    }

    const petColumns = await findExistingColumns(serviceClient, "pets", ["id", "pet_id", ...INVENTORY_FIELDS, "updated_at"])
    const petIdField = petColumns.includes("id") ? "id" : petColumns.includes("pet_id") ? "pet_id" : null
    const inventoryField = INVENTORY_FIELDS.find((field) => petColumns.includes(field)) ?? null
    if (!petIdField || !inventoryField) {
      return NextResponse.json({ ok: false, error: { message: "pets 表缺少背包字段，无法购买。" } }, { status: 422 })
    }

    const [userResult, petResult] = await Promise.all([
      serviceClient.from("users").select("*").eq(userIdField, sessionState.user.id).limit(1).maybeSingle(),
      serviceClient.from("pets").select("*").eq(ownerField, sessionState.user.id).limit(1).maybeSingle(),
    ])

    if (userResult.error || !userResult.data) {
      return NextResponse.json({ ok: false, error: { message: userResult.error?.message ?? "未找到用户记录。" } }, { status: 404 })
    }
    if (petResult.error || !petResult.data) {
      return NextResponse.json({ ok: false, error: { message: petResult.error?.message ?? "未找到宠物记录。" } }, { status: 404 })
    }

    const userRow = userResult.data as GenericRecord
    const petRow = petResult.data as GenericRecord
    const vitals = parsePetVitalsFromRecord(petRow)
    if (vitals.isDead) {
      return NextResponse.json({ ok: false, error: { message: "宠物已离世，无法购买道具。" } }, { status: 422 })
    }

    const currentPointsRaw = Number(userRow[pointsField] ?? 0)
    const currentPoints = Number.isFinite(currentPointsRaw) ? Math.max(0, Math.floor(currentPointsRaw)) : 0
    if (currentPoints < totalCost) {
      return NextResponse.json({ ok: false, error: { message: "积分不足，无法购买。" } }, { status: 422 })
    }

    const inventory = normalizeInventory(petRow[inventoryField])
    const nextInventory = {
      ...inventory,
      [item.id]: (inventory[item.id] ?? 0) + quantity,
    }

    const userUpdate = await serviceClient
      .from("users")
      .update({ [pointsField]: currentPoints - totalCost })
      .eq(userIdField, sessionState.user.id)
      .select("*")
      .limit(1)
    if (userUpdate.error) {
      return NextResponse.json({ ok: false, error: { message: userUpdate.error.message } }, { status: 502 })
    }

    const petPayload: GenericRecord = { [inventoryField]: nextInventory }
    if (petColumns.includes("updated_at")) petPayload.updated_at = new Date().toISOString()
    let petUpdate = await serviceClient.from("pets").update(petPayload).eq(petIdField, petRow[petIdField]).select("*").limit(1)
    if (petUpdate.error) {
      petPayload[inventoryField] = JSON.stringify(nextInventory)
      petUpdate = await serviceClient.from("pets").update(petPayload).eq(petIdField, petRow[petIdField]).select("*").limit(1)
    }
    if (petUpdate.error) {
      return NextResponse.json({ ok: false, error: { message: petUpdate.error.message } }, { status: 502 })
    }

    const response = NextResponse.json({
      ok: true,
      data: {
        purchased: { itemId: item.id, quantity, totalCost },
        points: currentPoints - totalCost,
        inventory: nextInventory,
        pet: petUpdate.data?.[0] ?? null,
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

import { NextRequest, NextResponse } from "next/server"

import { writeAdminAuditLog } from "@/lib/admin/audit-log"
import { findShopItemById, loadShopItems, saveShopItems } from "@/lib/admin/shop-store"
import { setAuthCookies } from "@/lib/auth/server"
import { requireAdminApi } from "@/lib/auth/require-admin"
import type { PetShopCategory, PetShopItem } from "@/lib/pets/shop"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const CATEGORY_LABEL: Record<PetShopCategory, string> = {
  food: "食物",
  training: "训练",
  rest: "休息",
  toy: "玩具",
  equipment: "装备",
}

function normalizeEffect(raw: PetShopItem["effect"] | undefined) {
  const effect: PetShopItem["effect"] = {}
  if (typeof raw?.satiety === "number" && Number.isFinite(raw.satiety)) effect.satiety = Math.max(0, Math.floor(raw.satiety))
  if (typeof raw?.spirit === "number" && Number.isFinite(raw.spirit)) effect.spirit = Math.max(0, Math.floor(raw.spirit))
  if (typeof raw?.bond === "number" && Number.isFinite(raw.bond)) effect.bond = Math.max(0, Math.floor(raw.bond))
  return effect
}

function normalizeShopItem(raw: Partial<PetShopItem> & { id: string }): PetShopItem {
  const category = raw.category
  if (!category || !(category in CATEGORY_LABEL)) {
    throw new Error("无效分类")
  }
  const price = Number(raw.price)
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("价格无效")
  }
  const name = typeof raw.name === "string" ? raw.name.trim() : ""
  if (!name) throw new Error("名称不能为空")

  return {
    id: raw.id.trim(),
    name,
    category,
    price: Math.floor(price),
    icon: typeof raw.icon === "string" && raw.icon.trim() ? raw.icon.trim() : "📦",
    description: typeof raw.description === "string" ? raw.description.trim() : "",
    battleHint: typeof raw.battleHint === "string" ? raw.battleHint.trim() : undefined,
    effect: normalizeEffect(raw.effect),
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const url = new URL(request.url)
    const category = url.searchParams.get("category") as PetShopCategory | null

    let items = await loadShopItems()
    if (category && category in CATEGORY_LABEL) {
      items = items.filter((item) => item.category === category)
    }

    const response = NextResponse.json({
      ok: true,
      data: {
        items,
        categories: Object.entries(CATEGORY_LABEL).map(([id, label]) => ({ id, label })),
        source: "data/admin/shop-items.json",
      },
    })
    if (admin.sessionState.refreshedSession) setAuthCookies(response, admin.sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown error" } },
      { status: 503 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const body = (await request.json()) as Partial<PetShopItem>
    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ ok: false, error: { message: "缺少物品 id" } }, { status: 400 })
    }

    const items = await loadShopItems()
    if (findShopItemById(items, body.id.trim())) {
      return NextResponse.json({ ok: false, error: { message: "物品 id 已存在" } }, { status: 409 })
    }

    const item = normalizeShopItem({ ...body, id: body.id.trim() })
    const nextItems = [...items, item]
    await saveShopItems(nextItems)

    await writeAdminAuditLog(admin.serviceClient, {
      adminUserId: admin.adminUserId,
      action: "create_shop_item",
      targetType: "shop_item",
      targetId: item.id,
      payload: item as unknown as Record<string, unknown>,
    })

    const response = NextResponse.json({ ok: true, data: { item, items: nextItems } })
    if (admin.sessionState.refreshedSession) setAuthCookies(response, admin.sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown error" } },
      { status: 400 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const body = (await request.json()) as Partial<PetShopItem> & { id?: string }
    if (!body.id) {
      return NextResponse.json({ ok: false, error: { message: "缺少物品 id" } }, { status: 400 })
    }

    const items = await loadShopItems()
    const index = items.findIndex((item) => item.id === body.id)
    if (index < 0) {
      return NextResponse.json({ ok: false, error: { message: "物品不存在" } }, { status: 404 })
    }

    const merged = normalizeShopItem({ ...items[index], ...body, id: items[index].id })
    const nextItems = [...items]
    nextItems[index] = merged
    await saveShopItems(nextItems)

    await writeAdminAuditLog(admin.serviceClient, {
      adminUserId: admin.adminUserId,
      action: "patch_shop_item",
      targetType: "shop_item",
      targetId: merged.id,
      payload: body as Record<string, unknown>,
    })

    const response = NextResponse.json({ ok: true, data: { item: merged, items: nextItems } })
    if (admin.sessionState.refreshedSession) setAuthCookies(response, admin.sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown error" } },
      { status: 400 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ ok: false, error: { message: "缺少物品 id" } }, { status: 400 })
    }

    const items = await loadShopItems()
    const nextItems = items.filter((item) => item.id !== id)
    if (nextItems.length === items.length) {
      return NextResponse.json({ ok: false, error: { message: "物品不存在" } }, { status: 404 })
    }

    await saveShopItems(nextItems)

    await writeAdminAuditLog(admin.serviceClient, {
      adminUserId: admin.adminUserId,
      action: "delete_shop_item",
      targetType: "shop_item",
      targetId: id,
      payload: {},
    })

    const response = NextResponse.json({ ok: true, data: { items: nextItems } })
    if (admin.sessionState.refreshedSession) setAuthCookies(response, admin.sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown error" } },
      { status: 503 },
    )
  }
}

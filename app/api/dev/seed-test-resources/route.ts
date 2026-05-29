import { NextResponse } from "next/server"

import { createSupabaseServiceClient } from "@/lib/auth/server"

export const dynamic = "force-dynamic"

const TEST_COINS = 5000
const ITEM_QUANTITY = 5

const SEED_INVENTORY: Record<string, number> = {
  "food-basic": ITEM_QUANTITY,
  "food-fresh-pack": ITEM_QUANTITY,
  "food-fruit-cup": ITEM_QUANTITY,
  "food-energy-stick": ITEM_QUANTITY,
  "food-nutri-bowl": ITEM_QUANTITY,
  "train-rope": ITEM_QUANTITY,
  "train-cone": ITEM_QUANTITY,
  "train-whistle": ITEM_QUANTITY,
  "train-target": ITEM_QUANTITY,
  "train-balance-pad": ITEM_QUANTITY,
  "rest-pillow": ITEM_QUANTITY,
  "rest-blanket": ITEM_QUANTITY,
  "rest-mat": ITEM_QUANTITY,
  "rest-cushion": ITEM_QUANTITY,
  "rest-eye-mask": ITEM_QUANTITY,
  "toy-ball": ITEM_QUANTITY,
  "toy-feather": ITEM_QUANTITY,
  "toy-plush": ITEM_QUANTITY,
  "toy-frisbee": ITEM_QUANTITY,
  "toy-rattle": ITEM_QUANTITY,
  "equip-collar": ITEM_QUANTITY,
  "equip-tag": ITEM_QUANTITY,
  "equip-bell": ITEM_QUANTITY,
  "equip-bandana": ITEM_QUANTITY,
  "equip-badge": ITEM_QUANTITY,
  "equip-charm": ITEM_QUANTITY,
}

async function columnExists(supabase: ReturnType<typeof createSupabaseServiceClient>, table: string, column: string) {
  const probe = await supabase.from(table).select(column).limit(1)
  return !probe.error || probe.error.code !== "42703"
}

export async function POST() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_SEED !== "1") {
    return NextResponse.json({ ok: false, error: { message: "开发种子接口未启用。" } }, { status: 403 })
  }

  try {
    const supabase = createSupabaseServiceClient()
    const hasInventory = await columnExists(supabase, "pets", "pet_inventory")
    const hasHunger = await columnExists(supabase, "pets", "hunger")
    const hasPetExp = await columnExists(supabase, "pets", "pet_exp")

    if (!hasInventory) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message:
              "缺少 pets.pet_inventory 字段。请先在 Supabase SQL Editor 执行 supabase/migrations/20260527160000_add_pet_shop_fields.sql",
          },
        },
        { status: 422 },
      )
    }

    const usersResult = await supabase.from("users").select("id, nickname, coins")
    if (usersResult.error) throw usersResult.error

    const petsResult = await supabase.from("pets").select("id, user_id, pet_name")
    if (petsResult.error) throw petsResult.error

    const seeded = []
    for (const user of usersResult.data ?? []) {
      const userUpdate = await supabase.from("users").update({ coins: TEST_COINS }).eq("id", user.id).select("id, nickname, coins")
      if (userUpdate.error) throw userUpdate.error

      const pet = (petsResult.data ?? []).find((row) => row.user_id === user.id)
      if (!pet) {
        seeded.push({ user: user.nickname, coins: TEST_COINS, pet: null })
        continue
      }

      const petPayload: Record<string, unknown> = {
        pet_inventory: SEED_INVENTORY,
        intimacy: 100,
        energy: 100,
        mood: 1,
        is_dead: false,
        dead_at: null,
      }
      if (hasHunger) petPayload.hunger = 100
      if (hasPetExp) petPayload.pet_exp = 25

      const petUpdate = await supabase.from("pets").update(petPayload).eq("id", pet.id).select("*").limit(1)
      if (petUpdate.error) throw petUpdate.error

      seeded.push({
        user: user.nickname,
        userId: user.id,
        coins: TEST_COINS,
        pet: pet.pet_name,
        inventoryItems: Object.keys(SEED_INVENTORY).length,
      })
    }

    return NextResponse.json({
      ok: true,
      data: {
        coins: TEST_COINS,
        perItem: ITEM_QUANTITY,
        users: seeded,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown server error" } },
      { status: 503 },
    )
  }
}

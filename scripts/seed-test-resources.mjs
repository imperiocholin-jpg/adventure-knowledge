import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"
import pg from "pg"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

const TEST_COINS = 5000
const ITEM_QUANTITY = 5

/** 每类给 5 个，方便测试互动与对战道具 */
const SEED_INVENTORY = {
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

function readEnv() {
  const envPath = path.join(ROOT, ".env.local")
  const raw = fs.readFileSync(envPath, "utf8")
  const entries = raw
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=")
      return idx > 0 ? [line.slice(0, idx).trim(), line.slice(idx + 1).trim()] : null
    })
    .filter(Boolean)
  return Object.fromEntries(entries)
}

function resolveDatabaseUrl(env) {
  if (env.DATABASE_URL) return env.DATABASE_URL
  const password = env.SUPABASE_DB_PASSWORD || env.DATABASE_PASSWORD
  if (!password) return null
  const ref = env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  if (!ref) return null
  const encoded = encodeURIComponent(password)
  return `postgresql://postgres.${ref}:${encoded}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
}

async function runMigrationIfPossible(env) {
  const databaseUrl = resolveDatabaseUrl(env)
  if (!databaseUrl) {
    console.log("跳过 SQL 迁移：未配置 DATABASE_URL 或 SUPABASE_DB_PASSWORD")
    return false
  }

  const migrationPath = path.join(ROOT, "supabase/migrations/20260527160000_add_pet_shop_fields.sql")
  const sql = fs.readFileSync(migrationPath, "utf8")
  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    await client.query(sql)
    console.log("已执行数据库迁移：宠物商城字段")
    return true
  } finally {
    await client.end()
  }
}

async function columnExists(supabase, table, column) {
  const probe = await supabase.from(table).select(column).limit(1)
  return !probe.error || probe.error.code !== "42703"
}

async function seedResources(env) {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const hasInventory = await columnExists(supabase, "pets", "pet_inventory")
  const hasHunger = await columnExists(supabase, "pets", "hunger")
  const hasPetExp = await columnExists(supabase, "pets", "pet_exp")

  if (!hasInventory) {
    throw new Error(
      "pets.pet_inventory 字段不存在。请在 Supabase SQL Editor 执行 supabase/migrations/20260527160000_add_pet_shop_fields.sql，或配置 SUPABASE_DB_PASSWORD 后重跑本脚本。",
    )
  }

  const usersResult = await supabase.from("users").select("id, nickname, coins")
  if (usersResult.error) throw usersResult.error

  const petsResult = await supabase.from("pets").select("id, user_id, pet_name")
  if (petsResult.error) throw petsResult.error

  const report = []

  for (const user of usersResult.data ?? []) {
    const userUpdate = await supabase.from("users").update({ coins: TEST_COINS }).eq("id", user.id).select("id, nickname, coins")
    if (userUpdate.error) throw userUpdate.error

    const pet = (petsResult.data ?? []).find((row) => row.user_id === user.id)
    if (!pet) {
      report.push({ user: user.nickname, coins: TEST_COINS, pet: "无宠物记录" })
      continue
    }

    const petPayload = {
      pet_inventory: SEED_INVENTORY,
      intimacy: 100,
      energy: 100,
      mood: 1,
      is_dead: false,
      dead_at: null,
    }
    if (hasHunger) petPayload.hunger = 100
    if (hasPetExp) petPayload.pet_exp = 25

    const petUpdate = await supabase
      .from("pets")
      .update(petPayload)
      .eq("id", pet.id)
      .select("id, pet_name, pet_inventory, hunger, intimacy, energy, pet_exp")

    if (petUpdate.error) throw petUpdate.error

    report.push({
      user: user.nickname,
      userId: user.id,
      coins: TEST_COINS,
      pet: pet.pet_name,
      inventoryItems: Object.keys(SEED_INVENTORY).length,
      sample: petUpdate.data?.[0],
    })
  }

  return report
}

async function main() {
  const env = readEnv()
  await runMigrationIfPossible(env)
  const report = await seedResources(env)
  console.log(JSON.stringify({ ok: true, coins: TEST_COINS, perItem: ITEM_QUANTITY, users: report }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

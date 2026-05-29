/**
 * 按方案 A 根据 pet_exp 重算 pet_level / life_stage
 *
 * 用法（在 v0-app 目录）：
 *   pnpm pets:recalc-levels
 *
 * 需要环境变量：NEXT_PUBLIC_SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY（自动读取 .env.local）
 */

import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { createClient } from "@supabase/supabase-js"

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local")
  if (!existsSync(path)) return
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvLocal()

const PET_EXP_BASE = 80
const PET_EXP_STEP = 8
const PET_LEVEL_CAP = 50

function levelFromTotalExp(totalExp) {
  const exp = Math.max(0, Math.floor(Number(totalExp) || 0))
  let level = 1
  let cum = 0
  while (level < PET_LEVEL_CAP) {
    const need = PET_EXP_BASE + (level - 1) * PET_EXP_STEP
    if (exp < cum + need) return level
    cum += need
    level += 1
  }
  return PET_LEVEL_CAP
}

function lifeStageFromLevel(level) {
  if (level >= 26) return "壮年"
  if (level >= 11) return "成年"
  return "幼崽"
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(url, key)
const { data: pets, error } = await supabase.from("pets").select("*")

if (error) {
  console.error("读取 pets 失败:", error.message)
  process.exit(1)
}

let updated = 0
for (const row of pets ?? []) {
  const id = row.id ?? row.pet_id
  if (!id) continue

  const expField = "pet_exp" in row ? "pet_exp" : "exp" in row ? "exp" : null
  const levelField = "pet_level" in row ? "pet_level" : "level" in row ? "level" : null
  if (!expField || !levelField) continue

  const totalExp = Math.max(0, Math.floor(Number(row[expField]) || 0))
  const nextLevel = levelFromTotalExp(totalExp)
  const nextStage = lifeStageFromLevel(nextLevel)

  const payload = {
    [levelField]: nextLevel,
    ...(row.life_stage !== undefined || row.pet_life_stage !== undefined
      ? { life_stage: nextStage }
      : {}),
  }

  const idField = row.id !== undefined ? "id" : "pet_id"
  const { error: updateError } = await supabase.from("pets").update(payload).eq(idField, id)
  if (updateError) {
    console.warn(`跳过 ${id}:`, updateError.message)
    continue
  }
  updated += 1
  console.log(`宠物 ${id}: exp=${totalExp} → Lv.${nextLevel} (${nextStage})`)
}

console.log(`完成，共更新 ${updated} 条宠物记录。`)

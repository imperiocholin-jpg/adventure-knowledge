/**
 * 批量创建厦门小学马甲账号（10 个）
 * 用法：node scripts/seed-xiamen-sock-users.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

function readEnv() {
  const raw = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8")
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

const PRESETS = [
  { nickname: "小珊珊", school: "厦门市实验小学", grade: "三年级2班", age: 9, avatar: "girl-01" },
  { nickname: "陈子轩", school: "厦门滨北小学", grade: "四年级1班", age: 10, avatar: "boy-02" },
  { nickname: "林雨桐", school: "厦门梧村小学", grade: "五年级2班", age: 11, avatar: "girl-03" },
  { nickname: "王浩然", school: "厦门园南小学", grade: "二年级3班", age: 8, avatar: "boy-04" },
  { nickname: "张梓涵", school: "厦门槟榔小学", grade: "六年级1班", age: 12, avatar: "girl-05" },
  { nickname: "刘思远", school: "厦门松柏小学", grade: "一年级1班", age: 7, avatar: "boy-01" },
  { nickname: "黄嘉怡", school: "厦门湖滨小学", grade: "四年级4班", age: 10, avatar: "girl-02" },
  { nickname: "吴俊杰", school: "厦门文安小学", grade: "三年级5班", age: 9, avatar: "boy-03" },
  { nickname: "郑欣妍", school: "厦门鹭江小学", grade: "五年级6班", age: 11, avatar: "girl-04" },
  { nickname: "许博文", school: "厦门大同小学", grade: "六年级3班", age: 12, avatar: "boy-05" },
]

const PASSWORD = "Test123456"

async function resolveOwnerField(supabase) {
  for (const col of ["id", "user_id", "uid", "auth_user_id"]) {
    const probe = await supabase.from("users").select("*").eq(col, "00000000-0000-0000-0000-000000000000").limit(1)
    if (!probe.error || probe.error.code !== "42703") return col
  }
  return "id"
}

async function bootstrapUser(supabase, userId, email, nickname) {
  const ownerField = await resolveOwnerField(supabase)
  const existing = await supabase.from("users").select("*").eq(ownerField, userId).limit(1)
  if (existing.data?.length) return

  const payload = { [ownerField]: userId, nickname, username: nickname, email, coins: 0, level: 1 }
  await supabase.from("users").insert(payload)

  const petOwner = await (async () => {
    for (const col of ["user_id", "uid", "owner_id", "auth_user_id"]) {
      const probe = await supabase.from("pets").select("id").eq(col, userId).limit(1)
      if (!probe.error || probe.error.code !== "42703") return col
    }
    return "user_id"
  })()

  const petCheck = await supabase.from("pets").select("id").eq(petOwner, userId).limit(1)
  if (!petCheck.data?.length) {
    await supabase.from("pets").insert({
      [petOwner]: userId,
      name: "毛毛",
      emoji: "🐕",
      hunger: 80,
      spirit: 80,
      bond: 80,
      pet_level: 1,
      pet_exp: 0,
    })
  }
}

async function applyProfile(supabase, userId, preset, email) {
  const ownerField = await resolveOwnerField(supabase)
  await supabase
    .from("users")
    .update({
      nickname: preset.nickname,
      username: preset.nickname,
      email,
      school_name: preset.school,
      grade_class: preset.grade,
      age: preset.age,
      avatar_id: preset.avatar,
      profile_setup_completed: true,
    })
    .eq(ownerField, userId)
}

async function main() {
  const env = readEnv()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) {
    console.error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  const supabase = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const stamp = Date.now().toString(36)
  const created = []
  const failed = []

  for (let i = 0; i < PRESETS.length; i++) {
    const preset = PRESETS[i]
    const email = `xm.sock${String(i + 1).padStart(2, "0")}.${stamp}@adventure.test`

    try {
      const result = await supabase.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { created_by_admin: true, account_type: "sock" },
      })

      if (result.error || !result.data.user) {
        throw new Error(result.error?.message ?? "createUser failed")
      }

      const userId = result.data.user.id
      await bootstrapUser(supabase, userId, email, preset.nickname)
      await applyProfile(supabase, userId, preset, email)

      created.push({ email, nickname: preset.nickname, school: preset.school, userId })
      console.log(`✓ ${preset.nickname} <${email}>`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failed.push({ email, error: message })
      console.error(`✗ ${email}: ${message}`)
    }
  }

  console.log("\n--- 完成 ---")
  console.log(`成功: ${created.length}，失败: ${failed.length}`)
  console.log(`统一密码: ${PASSWORD}`)
  if (created.length > 0) {
    console.log("\n账号列表:")
    for (const row of created) {
      console.log(`  ${row.nickname} | ${row.school} | ${row.email}`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

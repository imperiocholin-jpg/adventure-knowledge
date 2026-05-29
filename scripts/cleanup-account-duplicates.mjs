/**
 * 清理指定邮箱的重复用户/宠物数据
 * 用法：node scripts/cleanup-account-duplicates.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

const TARGET_EMAIL = "391106116@qq.com"
const KEEP_NICKNAME = "陈钽"
const KEEP_PET_NAME = "璟瑞"

function readEnv() {
  const raw = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8")
  return Object.fromEntries(
    raw
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const idx = line.indexOf("=")
        return idx > 0 ? [line.slice(0, idx).trim(), line.slice(idx + 1).trim()] : null
      })
      .filter(Boolean),
  )
}

function readPetName(row) {
  return (typeof row.pet_name === "string" && row.pet_name.trim()) ||
    (typeof row.name === "string" && row.name.trim()) ||
    ""
}

function readNickname(row) {
  return (typeof row.nickname === "string" && row.nickname.trim()) ||
    (typeof row.username === "string" && row.username.trim()) ||
    (typeof row.name === "string" && row.name.trim()) ||
    ""
}

async function listAllAuthUsers(supabase) {
  const users = []
  let page = 1
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    users.push(...data.users)
    if (data.users.length < 200) break
    page += 1
  }
  return users
}

async function deleteUserCompletely(supabase, userId) {
  const tables = [
    "reading_records",
    "daily_tasks",
    "user_treasures",
    "pets",
    "user_auth_identities",
    "users",
  ]
  for (const table of tables) {
    const probe = await supabase.from(table).select("id").limit(1)
    if (probe.error) continue
    if (table === "users") {
      await supabase.from(table).delete().eq("id", userId)
    } else {
      await supabase.from(table).delete().eq("user_id", userId)
    }
  }
  return supabase.auth.admin.deleteUser(userId)
}

async function main() {
  const env = readEnv()
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const authUsers = await listAllAuthUsers(supabase)
  const targetAuth = authUsers.filter((u) => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase())

  console.log(`目标邮箱 Auth 账号数：${targetAuth.length}`)
  for (const u of targetAuth) console.log("  -", u.id, u.email)

  const { data: allUsers, error: usersError } = await supabase.from("users").select("*")
  if (usersError) throw usersError

  const duplicateUserRows = (allUsers ?? []).filter((row) => {
    const nickname = readNickname(row)
    const rowEmail = typeof row.email === "string" ? row.email.toLowerCase() : ""
    const id = row.id || row.user_id
    const isTargetAuth = targetAuth.some((u) => u.id === id)
    return (
      nickname === "111" ||
      rowEmail === TARGET_EMAIL.toLowerCase() ||
      isTargetAuth
    )
  })

  console.log(`\n匹配到的 public.users 行数：${duplicateUserRows.length}`)
  for (const row of duplicateUserRows) {
    console.log("  -", row.id, readNickname(row), row.email)
  }

  const targetUserIds = new Set([
    ...targetAuth.map((u) => u.id),
    ...duplicateUserRows.map((row) => row.id || row.user_id).filter(Boolean),
  ])

  // 删除昵称 111 的独立账号（非主账号）
  const primaryId = targetAuth[0]?.id
  for (const row of duplicateUserRows) {
    const id = row.id || row.user_id
    const nickname = readNickname(row)
    if (!id) continue

    if (nickname === "111" && id !== primaryId) {
      console.log(`\n删除重复用户账号：${id} (${nickname})`)
      const authDelete = await deleteUserCompletely(supabase, id)
      if (authDelete.error) console.error("  删除失败:", authDelete.error.message)
      else console.log("  已删除用户及关联数据")
      targetUserIds.delete(id)
    }
  }

  if (!primaryId) {
    console.error("未找到目标邮箱对应 Auth 用户，停止。")
    process.exit(1)
  }

  // 统一主账号昵称
  const primaryUser = duplicateUserRows.find((row) => (row.id || row.user_id) === primaryId)
  const currentNickname = primaryUser ? readNickname(primaryUser) : ""
  if (currentNickname && currentNickname !== KEEP_NICKNAME && ["111", "391106116"].includes(currentNickname)) {
    const { error } = await supabase
      .from("users")
      .update({ nickname: KEEP_NICKNAME, updated_at: new Date().toISOString() })
      .eq("id", primaryId)
    if (error) console.error("更新昵称失败:", error.message)
    else console.log(`\n已将昵称「${currentNickname}」更新为「${KEEP_NICKNAME}」`)
  }

  // 清理主账号宠物：只保留璟瑞
  const { data: pets, error: petsError } = await supabase.from("pets").select("*").eq("user_id", primaryId)
  if (petsError) throw petsError

  console.log(`\n主账号宠物数：${pets?.length ?? 0}`)
  const keepPet = (pets ?? []).find((pet) => readPetName(pet) === KEEP_PET_NAME)
  const deletePetIds = (pets ?? [])
    .filter((pet) => {
      const name = readPetName(pet)
      if (keepPet && pet.id === keepPet.id) return false
      return name === "毛毛" || name !== KEEP_PET_NAME || !name
    })
    .map((pet) => pet.id)

  if (deletePetIds.length > 0) {
    console.log("删除宠物 ID:", deletePetIds.join(", "))
    const { error } = await supabase.from("pets").delete().in("id", deletePetIds)
    if (error) console.error("删除宠物失败:", error.message)
    else console.log(`已删除 ${deletePetIds.length} 条重复/占位宠物`)
  } else {
    console.log("未发现需删除的重复宠物")
  }

  // 最终状态
  const { data: finalUser } = await supabase.from("users").select("*").eq("id", primaryId).maybeSingle()
  const { data: finalPets } = await supabase.from("pets").select("*").eq("user_id", primaryId)
  console.log("\n=== 清理后 ===")
  console.log("用户:", readNickname(finalUser ?? {}), finalUser?.id)
  console.log(
    "宠物:",
    (finalPets ?? []).map((pet) => ({ id: pet.id, name: readPetName(pet) })),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

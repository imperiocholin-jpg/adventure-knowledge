import type { User } from "@supabase/supabase-js"

import { createSupabaseServiceClient } from "@/lib/auth/server"
import { findExistingColumn, findExistingColumns } from "@/lib/data/schema-compat"
import { getDailyTaskTemplatesForSeed } from "@/lib/economy/daily-task-templates"
import { DEFAULT_USER_AVATAR_ID } from "@/lib/user/avatar-catalog"

type GenericRecord = Record<string, unknown>

function usernameFromEmail(email?: string | null) {
  if (!email) return "小冒险家"
  const left = email.split("@")[0]?.trim()
  return left || "小冒险家"
}

async function insertWithFallback(
  table: "users" | "pets" | "daily_tasks",
  payloads: GenericRecord[],
) {
  const supabase = createSupabaseServiceClient()
  let lastError: unknown = null
  for (const payload of payloads) {
    const result = await supabase.from(table).insert(payload).select("*").limit(1)
    if (!result.error) return { data: result.data?.[0] ?? null, error: null }
    lastError = result.error
  }
  return { data: null, error: lastError }
}

export async function ensureUserBootstrap(user: User) {
  const supabase = createSupabaseServiceClient()
  const uid = user.id
  const email = user.email ?? null
  const username = usernameFromEmail(email)

  const userOwnerField = await findExistingColumn(supabase, "users", [
    "user_id",
    "id",
    "uid",
    "auth_user_id",
  ])
  if (!userOwnerField) {
    return {
      ok: false as const,
      error: new Error("users table missing ownership field (user_id/id/uid/auth_user_id)."),
    }
  }

  const userWritableColumns = await findExistingColumns(supabase, "users", [
    "nickname",
    "username",
    "email",
    "exp",
    "experience",
    "level",
    "coins",
    "avatar_id",
    "created_at",
    "daily_streak",
    "last_active_date",
  ])

  const userResult = await supabase.from("users").select("*").eq(userOwnerField, uid).limit(1)
  if (userResult.error) return { ok: false as const, error: userResult.error }

  const userRow = userResult.data?.[0] ?? null
  if (!userRow) {
    const userPayload: GenericRecord = {
      [userOwnerField]: uid,
    }
    if (userWritableColumns.includes("nickname")) userPayload.nickname = username
    if (userWritableColumns.includes("username")) userPayload.username = username
    if (userWritableColumns.includes("email")) userPayload.email = email
    if (userWritableColumns.includes("exp")) userPayload.exp = 0
    if (userWritableColumns.includes("experience")) userPayload.experience = 0
    if (userWritableColumns.includes("level")) userPayload.level = 1
    if (userWritableColumns.includes("coins")) userPayload.coins = 0
    if (userWritableColumns.includes("avatar_id")) userPayload.avatar_id = DEFAULT_USER_AVATAR_ID
    if (userWritableColumns.includes("created_at")) userPayload.created_at = new Date().toISOString()
    if (userWritableColumns.includes("daily_streak")) userPayload.daily_streak = 0
    if (userWritableColumns.includes("last_active_date")) userPayload.last_active_date = null

    const createUserResult = await insertWithFallback("users", [
      userPayload,
      { [userOwnerField]: uid },
    ])
    if (createUserResult.error) return { ok: false as const, error: createUserResult.error }
  }

  const petsOwnerField = await findExistingColumn(supabase, "pets", [
    "user_id",
    "uid",
    "owner_id",
    "auth_user_id",
  ])
  const petResult = petsOwnerField
    ? await supabase.from("pets").select("*").eq(petsOwnerField, uid).limit(1)
    : await supabase.from("pets").select("*").limit(1)
  if (petResult.error) return { ok: false as const, error: petResult.error }
  if (!petResult.data || petResult.data.length === 0) {
    const petWritableColumns = await findExistingColumns(supabase, "pets", [
      "name",
      "emoji",
      "mood",
      "rarity",
      "pet_level",
      "pet_exp",
      "happiness",
      "energy",
      "hunger",
      "pet_hunger",
      "spirit",
      "pet_spirit",
      "bond",
      "pet_bond",
      "created_at",
    ])
    const petPayload: GenericRecord = {}
    if (petsOwnerField) petPayload[petsOwnerField] = uid
    if (petWritableColumns.includes("name")) petPayload.name = "毛毛"
    if (petWritableColumns.includes("emoji")) petPayload.emoji = "🐕"
    if (petWritableColumns.includes("mood")) petPayload.mood = 1
    if (petWritableColumns.includes("rarity")) petPayload.rarity = "epic"
    if (petWritableColumns.includes("pet_level")) petPayload.pet_level = 1
    if (petWritableColumns.includes("pet_exp")) petPayload.pet_exp = 0
    if (petWritableColumns.includes("happiness")) petPayload.happiness = 80
    if (petWritableColumns.includes("energy")) petPayload.energy = 80
    if (petWritableColumns.includes("hunger")) petPayload.hunger = 80
    if (petWritableColumns.includes("pet_hunger")) petPayload.pet_hunger = 80
    if (petWritableColumns.includes("spirit")) petPayload.spirit = 80
    if (petWritableColumns.includes("pet_spirit")) petPayload.pet_spirit = 80
    if (petWritableColumns.includes("bond")) petPayload.bond = 80
    if (petWritableColumns.includes("pet_bond")) petPayload.pet_bond = 80
    if (petWritableColumns.includes("created_at")) petPayload.created_at = new Date().toISOString()

    const createPetResult = await insertWithFallback("pets", [
      petPayload,
      petsOwnerField ? { [petsOwnerField]: uid } : {},
    ])
    if (createPetResult.error) return { ok: false as const, error: createPetResult.error }
  }

  const taskOwnerField = await findExistingColumn(supabase, "daily_tasks", [
    "user_id",
    "uid",
    "owner_id",
    "auth_user_id",
  ])
  const taskResult = taskOwnerField
    ? await supabase.from("daily_tasks").select("*").eq(taskOwnerField, uid).limit(1)
    : await supabase.from("daily_tasks").select("*").limit(1)
  if (taskResult.error) return { ok: false as const, error: taskResult.error }
  if (taskOwnerField && (!taskResult.data || taskResult.data.length === 0)) {
    const today = new Date().toISOString()
    const taskWritableColumns = await findExistingColumns(supabase, "daily_tasks", [
      "title",
      "description",
      "task_type",
      "xp_reward",
      "coin_reward",
      "pet_reward",
      "progress",
      "max_progress",
      "status",
      "claimed",
      "completed",
      "created_at",
    ])
    for (const template of getDailyTaskTemplatesForSeed()) {
      const taskPayload: GenericRecord = {
        [taskOwnerField]: uid,
        task_type: template.task_type,
        title: template.title,
        description: template.description,
        xp_reward: template.xp_reward,
        coin_reward: template.coin_reward,
        pet_reward: template.pet_reward,
        progress: 0,
        max_progress: template.max_progress,
        status: "incomplete",
        claimed: false,
        completed: false,
        created_at: today,
      }
      for (const key of Object.keys(taskPayload)) {
        if (!taskWritableColumns.includes(key)) delete taskPayload[key]
      }
      taskPayload[taskOwnerField] = uid

      const createTaskResult = await insertWithFallback("daily_tasks", [
        taskPayload,
        { [taskOwnerField]: uid, title: template.title },
      ])
      if (createTaskResult.error) return { ok: false as const, error: createTaskResult.error }
    }
  }

  return { ok: true as const }
}

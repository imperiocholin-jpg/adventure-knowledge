import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  createSupabaseUserClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { findExistingColumn } from "@/lib/data/schema-compat"
import { levelFromTotalExp, resolveLifeStageFromLevel } from "@/lib/pets/level-progress"
import { syncUserTreasuresAfterActivity } from "@/lib/treasures/server"
import { recordUserDailyActivity } from "@/lib/user/daily-streak-server"
import {
  emitDailyEngagementNotifications,
  emitTaskRewardNotification,
} from "@/lib/notifications/emitters"

type GenericRecord = Record<string, unknown>
type TaskStatus = "incomplete" | "claimable" | "claimed"

const USER_EXP_STEP = 100

interface ClaimTaskPayload {
  missionId?: string
  petId?: string
}

function getNumericValue(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function toIdString(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : null
}

function getStringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function resolveFieldName(record: GenericRecord, candidates: string[]) {
  return candidates.find((field) => field in record)
}

function toNormalizedTaskStatus(value: unknown): TaskStatus | null {
  if (typeof value !== "string") return null
  const lower = value.toLowerCase()
  if (["incomplete", "pending", "todo", "not_started"].includes(lower)) return "incomplete"
  if (["claimable", "completed", "ready_to_claim"].includes(lower)) return "claimable"
  if (["claimed", "done"].includes(lower)) return "claimed"
  return null
}

function calculateLevel(totalExp: number, expStep: number) {
  return Math.max(1, Math.floor(totalExp / expStep) + 1)
}

function resolveTaskProgress(taskRow: GenericRecord) {
  const progressField =
    resolveFieldName(taskRow, ["progress", "current_progress", "completed_count", "done_count"]) ??
    "progress"
  const maxField =
    resolveFieldName(taskRow, ["max_progress", "target", "target_count", "goal"]) ?? "max_progress"
  const statusField = resolveFieldName(taskRow, ["status", "state"])
  const claimedField = resolveFieldName(taskRow, ["claimed", "is_claimed"])
  const completedField = resolveFieldName(taskRow, ["completed", "is_completed"])

  const progress = Math.max(0, getNumericValue(taskRow[progressField], 0))
  const maxProgress = Math.max(1, getNumericValue(taskRow[maxField], 1))
  const claimed = Boolean(claimedField ? taskRow[claimedField] : false)
  const normalizedStatus = toNormalizedTaskStatus(statusField ? taskRow[statusField] : null)

  const status: TaskStatus =
    claimed
      ? "claimed"
      : normalizedStatus
        ? normalizedStatus
        : progress >= maxProgress
          ? "claimable"
          : "incomplete"

  return {
    progressField,
    statusField,
    claimedField,
    completedField,
    progress,
    maxProgress,
    status,
  }
}

async function getRowByIdOrFirst(
  supabase: any,
  table: "users" | "pets",
  idFieldCandidates: string[],
  idValue?: string,
) {
  if (idValue) {
    for (const field of idFieldCandidates) {
      const byIdResult = await supabase.from(table).select("*").eq(field, idValue).limit(1)
      if (!byIdResult.error && byIdResult.data && byIdResult.data.length > 0) {
        return { row: byIdResult.data[0] as GenericRecord, idField: field, error: null }
      }
    }
  }

  const firstResult = await supabase.from(table).select("*").limit(1)
  if (firstResult.error) {
    return { row: null, idField: null as string | null, error: firstResult.error }
  }
  if (!firstResult.data || firstResult.data.length === 0) {
    return { row: null, idField: null as string | null, error: null }
  }

  const row = firstResult.data[0] as GenericRecord
  const idField = resolveFieldName(row, idFieldCandidates) ?? null
  return { row, idField, error: null }
}

export async function POST(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")
    const supabase = createSupabaseUserClient(sessionState.accessToken)
    const serviceClient = createSupabaseServiceClient()

    const body = (await request.json()) as ClaimTaskPayload
    if (!body.missionId) {
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          action: "claim-task-reward",
          error: { message: "missionId is required." },
        },
        { status: 400 },
      )
    }

    const taskOwnerField = await findExistingColumn(serviceClient, "daily_tasks", [
      "user_id",
      "uid",
      "owner_id",
      "auth_user_id",
    ])
    if (!taskOwnerField) {
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          action: "claim-task-reward",
          error: { message: "daily_tasks table missing ownership field." },
        },
        { status: 422 },
      )
    }

    const taskResult = await supabase
      .from("daily_tasks")
      .select("*")
      .eq(taskOwnerField, sessionState.user.id)
      .limit(200)

    if (taskResult.error) {
      console.error(taskResult.error)
      return NextResponse.json(
        {
          ok: false,
          source: "supabase",
          action: "resolve-task",
          error: {
            message: taskResult.error.message,
            code: taskResult.error.code ?? null,
            details: taskResult.error.details ?? null,
            hint: taskResult.error.hint ?? null,
          },
        },
        { status: 502 },
      )
    }

    const taskRow =
      ((taskResult.data ?? []) as GenericRecord[]).find((row) => {
        const idField = resolveFieldName(row, ["id", "task_id"])
        if (!idField) return false
        return toIdString(row[idField]) === body.missionId
      }) ?? null
    if (!taskRow) {
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          action: "resolve-task",
          error: { message: "Task not found." },
        },
        { status: 404 },
      )
    }

    const taskUserField = resolveFieldName(taskRow, ["user_id", "uid"])
    if (taskUserField) {
      const taskUserId = toIdString(taskRow[taskUserField])
      if (taskUserId && taskUserId !== sessionState.user.id) {
        return NextResponse.json(
          {
            ok: false,
            source: "server",
            action: "authorize-task",
            error: { message: "Task does not belong to current user." },
          },
          { status: 403 },
        )
      }
    }

    const taskProgress = resolveTaskProgress(taskRow)
    if (!taskProgress.statusField && !taskProgress.claimedField) {
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          action: "claim-task-reward",
          error: {
            message:
              "Task table missing status/claimed fields required for idempotent reward claiming.",
          },
        },
        { status: 422 },
      )
    }

    if (taskProgress.status === "claimed") {
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          action: "claim-task-reward",
          error: { message: "Task reward already claimed." },
        },
        { status: 409 },
      )
    }
    if (taskProgress.status !== "claimable") {
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          action: "claim-task-reward",
          error: { message: "Task is not claimable yet." },
        },
        { status: 422 },
      )
    }

    const xpReward = getNumericValue(
      taskRow[resolveFieldName(taskRow, ["xp_reward", "experience_reward", "reward_exp"]) ?? ""],
      0,
    )
    const coinReward = getNumericValue(
      taskRow[resolveFieldName(taskRow, ["coin_reward", "coins_reward", "gold_reward"]) ?? ""],
      0,
    )
    const petReward = getNumericValue(
      taskRow[resolveFieldName(taskRow, ["pet_reward", "pet_exp_reward", "reward_pet_exp"]) ?? ""],
      0,
    )

    const userResult = await getRowByIdOrFirst(supabase, "users", ["id", "user_id"], sessionState.user.id)
    if (userResult.error || !userResult.row || !userResult.idField) {
      if (userResult.error) console.error(userResult.error)
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          action: "resolve-user",
          error: { message: userResult.error?.message ?? "No user row available." },
        },
        { status: 404 },
      )
    }

    const petResult = await getRowByIdOrFirst(supabase, "pets", ["id", "pet_id"], body.petId)
    if (petResult.error || !petResult.row || !petResult.idField) {
      if (petResult.error) console.error(petResult.error)
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          action: "resolve-pet",
          error: { message: petResult.error?.message ?? "No pet row available." },
        },
        { status: 404 },
      )
    }

    const userId = toIdString(userResult.row[userResult.idField])
    const petId = toIdString(petResult.row[petResult.idField])
    const taskIdField = resolveFieldName(taskRow, ["id", "task_id"])
    const taskId = taskIdField ? toIdString(taskRow[taskIdField]) : null
    const petUserField = resolveFieldName(petResult.row, ["user_id", "uid"])
    if (petUserField && toIdString(petResult.row[petUserField]) !== sessionState.user.id) {
      return NextResponse.json(
        {
          ok: false,
          source: "auth",
          action: "authorize-pet",
          error: { message: "Pet does not belong to current user." },
        },
        { status: 403 },
      )
    }

    if (!userId || userId !== sessionState.user.id || !petId || !taskId || !taskIdField) {
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          action: "resolve-ids",
          error: { message: "Failed to resolve ids for task reward claim." },
        },
        { status: 400 },
      )
    }

    const userExpField = resolveFieldName(userResult.row, ["experience", "exp", "user_exp"])
    const userLevelField = resolveFieldName(userResult.row, ["level", "user_level"])
    const userCoinsField = resolveFieldName(userResult.row, ["coins", "gold", "coin_balance"])
    const petExpField = resolveFieldName(petResult.row, ["pet_exp", "experience", "exp"])
    const petLevelField = resolveFieldName(petResult.row, ["pet_level", "level"])
    const petHappinessField = resolveFieldName(petResult.row, ["happiness", "affection_level", "mood_score"])

    if (!userExpField || !userLevelField || !petExpField || !petLevelField) {
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          action: "resolve-fields",
          error: { message: "Missing required fields in users/pets table for reward claim." },
        },
        { status: 422 },
      )
    }

    const nextUserExp = getNumericValue(userResult.row[userExpField]) + xpReward
    const nextUserLevel = calculateLevel(nextUserExp, USER_EXP_STEP)
    const nextPetExp = getNumericValue(petResult.row[petExpField]) + petReward
    const nextPetLevel = levelFromTotalExp(nextPetExp)
    const nextLifeStage = resolveLifeStageFromLevel(nextPetLevel)

    const userUpdatePayload: GenericRecord = {
      [userExpField]: nextUserExp,
      [userLevelField]: nextUserLevel,
    }
    if (userCoinsField) {
      userUpdatePayload[userCoinsField] = getNumericValue(userResult.row[userCoinsField]) + coinReward
    }
    if ("updated_at" in userResult.row) {
      userUpdatePayload.updated_at = new Date().toISOString()
    }

    const petUpdatePayload: GenericRecord = {
      [petExpField]: nextPetExp,
      [petLevelField]: nextPetLevel,
    }
    if ("life_stage" in petResult.row) petUpdatePayload.life_stage = nextLifeStage
    if ("pet_life_stage" in petResult.row) petUpdatePayload.pet_life_stage = nextLifeStage
    if (petHappinessField) {
      petUpdatePayload[petHappinessField] = getNumericValue(petResult.row[petHappinessField]) + 1
    }
    if ("updated_at" in petResult.row) {
      petUpdatePayload.updated_at = new Date().toISOString()
    }

    const taskUpdatePayload: GenericRecord = {
      [taskProgress.progressField]: taskProgress.maxProgress,
    }
    if (taskProgress.statusField) taskUpdatePayload[taskProgress.statusField] = "claimed"
    if (taskProgress.claimedField) taskUpdatePayload[taskProgress.claimedField] = true
    if (taskProgress.completedField) taskUpdatePayload[taskProgress.completedField] = true
    if ("claimed_at" in taskRow) taskUpdatePayload.claimed_at = new Date().toISOString()
    if ("updated_at" in taskRow) taskUpdatePayload.updated_at = new Date().toISOString()

    let taskUpdateQuery = supabase.from("daily_tasks").update(taskUpdatePayload).eq(taskIdField, taskId)
    if (taskProgress.statusField) {
      taskUpdateQuery = taskUpdateQuery.eq(taskProgress.statusField, "claimable")
    }
    if (taskProgress.claimedField) {
      taskUpdateQuery = taskUpdateQuery.eq(taskProgress.claimedField, false)
    }

    const taskUpdateResult = await taskUpdateQuery.select("*").limit(1)
    if (taskUpdateResult.error) {
      console.error(taskUpdateResult.error)
      return NextResponse.json(
        {
          ok: false,
          source: "supabase",
          action: "claim-task-reward",
          error: {
            message:
              taskUpdateResult.error?.message ??
              "Failed to update task rewards",
          },
        },
        { status: 502 },
      )
    }
    if (!taskUpdateResult.data || taskUpdateResult.data.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          action: "claim-task-reward",
          error: { message: "Task reward already claimed or no longer claimable." },
        },
        { status: 409 },
      )
    }

    const [userUpdateResult, petUpdateResult] = await Promise.all([
      supabase.from("users").update(userUpdatePayload).eq(userResult.idField, userId).select("*").limit(1),
      supabase.from("pets").update(petUpdatePayload).eq(petResult.idField, petId).select("*").limit(1),
    ])

    if (userUpdateResult.error || petUpdateResult.error) {
      if (userUpdateResult.error) console.error(userUpdateResult.error)
      if (petUpdateResult.error) console.error(petUpdateResult.error)
      return NextResponse.json(
        {
          ok: false,
          source: "supabase",
          action: "claim-task-reward",
          error: {
            message:
              userUpdateResult.error?.message ??
              petUpdateResult.error?.message ??
              "Failed to apply task rewards",
          },
        },
        { status: 502 },
      )
    }

    const streakResult = await recordUserDailyActivity(serviceClient, userId)
    if (!streakResult.ok && streakResult.error) {
      console.error(streakResult.error)
    }

    const treasureResult = await syncUserTreasuresAfterActivity({
      supabase,
      serviceClient,
      userId,
    })

    const taskTitle = getStringValue(
      taskRow[resolveFieldName(taskRow, ["title", "name"]) ?? ""],
      "每日任务",
    )
    await emitTaskRewardNotification(serviceClient, userId, {
      taskTitle,
      taskId: taskId ?? undefined,
      coins: coinReward,
      xp: xpReward,
    })
    await emitDailyEngagementNotifications(serviceClient, userId, {
      streak: streakResult.dailyStreak,
      streakApplied: streakResult.applied,
    })

    const response = NextResponse.json({
      ok: true,
      data: {
        task: taskUpdateResult.data?.[0] ?? null,
        user: userUpdateResult.data?.[0] ?? null,
        pet: petUpdateResult.data?.[0] ?? null,
        rewards: {
          xp: xpReward,
          coins: coinReward,
          pet: petReward,
        },
        dailyStreak: streakResult.dailyStreak,
        streakReason: streakResult.reason,
        newlyUnlockedTreasures: treasureResult.newlyUnlocked,
      },
    })
    if (sessionState.refreshedSession) {
      setAuthCookies(response, sessionState.refreshedSession)
    }
    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      {
        ok: false,
        source: "server",
        action: "claim-task-reward",
        error: {
          message: error instanceof Error ? error.message : "Unknown server error",
        },
      },
      { status: 503 },
    )
  }
}

import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  createSupabaseUserClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { CHALLENGE_REWARD_POLICY, DIRECT_CHALLENGE_DAILY_LIMIT } from "@/lib/adventure/config"
import {
  countTodayDirectChallenges,
  getChallengeLimitSummary,
  normalizeEntryMode,
} from "@/lib/adventure/server-challenge"
import { fetchUserAdventureProgress } from "@/lib/adventure/server-progress"
import { findExistingColumn } from "@/lib/data/schema-compat"
import { resolveReadingRewardGrant } from "@/lib/economy/reward-policy"
import { levelFromTotalExp, resolveLifeStageFromLevel } from "@/lib/pets/level-progress"
import { syncUserTreasuresAfterActivity } from "@/lib/treasures/server"
import { recordUserDailyActivity } from "@/lib/user/daily-streak-server"
import {
  emitDailyEngagementNotifications,
  emitReadingRewardNotification,
  emitRegionProgressReminders,
  emitRegionUnlockNotifications,
  resolveBookTitleFromRow,
} from "@/lib/notifications/emitters"

const USER_EXP_STEP = 100

type GenericRecord = Record<string, unknown>

interface CompleteReadingPayload {
  petId?: string
  bookId?: string
  experienceGain?: number
  petExpGain?: number
  readingProgress?: number
  entryMode?: "post_read" | "direct"
  regionId?: string
  challengeChapterId?: string
}

type TaskStatus = "incomplete" | "claimable" | "claimed"

function getNumericValue(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function resolveFieldName(record: GenericRecord, candidates: string[]) {
  return candidates.find((field) => field in record)
}

function calculateLevel(totalExp: number, expStep: number) {
  return Math.max(1, Math.floor(totalExp / expStep) + 1)
}

function toIdString(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : null
}

function toNormalizedTaskStatus(value: unknown): TaskStatus | null {
  if (typeof value !== "string") return null
  const lower = value.toLowerCase()
  if (["incomplete", "pending", "todo", "not_started"].includes(lower)) return "incomplete"
  if (["claimable", "completed", "ready_to_claim"].includes(lower)) return "claimable"
  if (["claimed", "done"].includes(lower)) return "claimed"
  return null
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
    maxField,
    statusField,
    claimedField,
    completedField,
    progress,
    maxProgress,
    status,
  }
}

function isReadingTask(taskRow: GenericRecord) {
  const content = [
    taskRow[resolveFieldName(taskRow, ["task_type", "type", "category"]) ?? ""],
    taskRow[resolveFieldName(taskRow, ["title", "name"]) ?? ""],
    taskRow[resolveFieldName(taskRow, ["description", "task_description"]) ?? ""],
  ]
    .map((item) => (typeof item === "string" ? item.toLowerCase() : ""))
    .join(" ")

  return ["read", "book", "reading", "阅读", "章节", "书"].some((keyword) => content.includes(keyword))
}

function buildTaskUpdatePayload(
  taskRow: GenericRecord,
  taskProgress: ReturnType<typeof resolveTaskProgress>,
  nextProgress: number,
  nextStatus: TaskStatus,
) {
  const payload: GenericRecord = {
    [taskProgress.progressField]: nextProgress,
  }

  if (taskProgress.statusField) {
    payload[taskProgress.statusField] = nextStatus
  }
  if (taskProgress.claimedField) {
    payload[taskProgress.claimedField] = nextStatus === "claimed"
  }
  if (taskProgress.completedField) {
    payload[taskProgress.completedField] = nextStatus !== "incomplete"
  }
  if ("updated_at" in taskRow) {
    payload.updated_at = new Date().toISOString()
  }
  return payload
}

async function advanceReadingTaskProgress(supabase: any, userId: string) {
  const serviceClient = createSupabaseServiceClient()
  const ownerField = await findExistingColumn(serviceClient, "daily_tasks", [
    "user_id",
    "uid",
    "owner_id",
    "auth_user_id",
  ])
  if (!ownerField) return { data: [], error: null }

  const tasksQuery = await supabase.from("daily_tasks").select("*").eq(ownerField, userId).limit(200)
  if (tasksQuery.error) return { data: null, error: tasksQuery.error }

  const tasks = (tasksQuery.data ?? []) as GenericRecord[]
  const readingTasks = tasks.filter(isReadingTask)
  const updatedTasks: GenericRecord[] = []

  for (const task of readingTasks) {
    const idField = resolveFieldName(task, ["id", "task_id"])
    const taskId = idField ? toIdString(task[idField]) : null
    if (!idField || !taskId) continue

    const progressMeta = resolveTaskProgress(task)
    if (!progressMeta.statusField && !progressMeta.claimedField && !progressMeta.completedField) {
      updatedTasks.push(task)
      continue
    }
    if (progressMeta.status === "claimed") {
      updatedTasks.push(task)
      continue
    }

    const nextProgress = Math.min(progressMeta.maxProgress, progressMeta.progress + 1)
    const nextStatus: TaskStatus = nextProgress >= progressMeta.maxProgress ? "claimable" : "incomplete"
    const payload = buildTaskUpdatePayload(task, progressMeta, nextProgress, nextStatus)

    const updateResult = await supabase
      .from("daily_tasks")
      .update(payload)
      .eq(idField, taskId)
      .select("*")
      .limit(1)

    if (updateResult.error) {
      return { data: null, error: updateResult.error }
    }
    updatedTasks.push((updateResult.data?.[0] as GenericRecord) ?? task)
  }

  return { data: updatedTasks, error: null }
}

async function getRowByIdOrFirst(
  supabase: any,
  table: "users" | "pets" | "books",
  idFieldCandidates: string[],
  idValue?: string,
  ownerUserId?: string,
  ownerField?: string | null,
) {
  if (idValue) {
    for (const field of idFieldCandidates) {
      const byIdResult = await supabase.from(table).select("*").eq(field, idValue).limit(1)
      if (!byIdResult.error && byIdResult.data && byIdResult.data.length > 0) {
        return { row: byIdResult.data[0] as GenericRecord, idField: field, error: null }
      }
    }
  }

  let firstQuery = supabase.from(table).select("*").limit(1)
  if (ownerUserId && table !== "books" && ownerField) {
    firstQuery = firstQuery.eq(ownerField, ownerUserId)
  }
  const firstResult = await firstQuery
  if (firstResult.error) {
    return { row: null, idField: null, error: firstResult.error }
  }
  if (!firstResult.data || firstResult.data.length === 0) {
    return { row: null, idField: null, error: null }
  }

  const row = firstResult.data[0] as GenericRecord
  const idField = resolveFieldName(row, idFieldCandidates) ?? null
  return { row, idField, error: null }
}

async function insertReadingRecord(params: {
  supabase: any
  userId: string
  petId: string
  bookId: string
  experienceGain: number
  petExpGain: number
  readingProgress: number
  entryMode: "post_read" | "direct"
  starsGain: number
  regionId?: string
  challengeChapterId?: string
}) {
  const attempts: GenericRecord[] = [
    {
      user_id: params.userId,
      pet_id: params.petId,
      book_id: params.bookId,
      entry_mode: params.entryMode,
      challenge_mode: params.entryMode,
      region_id: params.regionId ?? null,
      challenge_chapter_id: params.challengeChapterId ?? null,
      stars_gain: params.starsGain,
      experience_gain: params.experienceGain,
      pet_exp_gain: params.petExpGain,
      reading_progress: params.readingProgress,
      created_at: new Date().toISOString(),
    },
    {
      user_id: params.userId,
      pet_id: params.petId,
      book_id: params.bookId,
      entry_mode: params.entryMode,
      challenge_mode: params.entryMode,
      region_id: params.regionId ?? null,
      challenge_chapter_id: params.challengeChapterId ?? null,
      stars: params.starsGain,
      experience: params.experienceGain,
      pet_exp: params.petExpGain,
      progress: params.readingProgress,
      created_at: new Date().toISOString(),
    },
    {
      user_id: params.userId,
      book_id: params.bookId,
      region_id: params.regionId ?? null,
      progress: params.readingProgress,
      completed: params.readingProgress >= 100,
      created_at: new Date().toISOString(),
    },
    {
      user_id: params.userId,
      book_id: params.bookId,
      region_id: params.regionId ?? null,
      progress: params.readingProgress,
      completed: params.readingProgress >= 100,
    },
  ]

  let lastError: unknown = null
  for (const payload of attempts) {
    const result = await params.supabase.from("reading_records").insert(payload).select("*").limit(1)
    if (!result.error) {
      return { data: result.data?.[0] ?? null, error: null }
    }
    lastError = result.error
  }

  return { data: null, error: lastError }
}

async function hasRecentReadingRecord(params: {
  supabase: any
  userId: string
  bookId: string
}) {
  const result = await params.supabase
    .from("reading_records")
    .select("*")
    .eq("user_id", params.userId)
    .eq("book_id", params.bookId)
    .order("created_at", { ascending: false })
    .limit(1)

  if (result.error || !result.data || result.data.length === 0) return false
  const latest = result.data[0] as GenericRecord
  const createdAtRaw = latest[resolveFieldName(latest, ["created_at"]) ?? ""]
  if (typeof createdAtRaw !== "string") return false

  const createdTime = Date.parse(createdAtRaw)
  if (!Number.isFinite(createdTime)) return false

  return Date.now() - createdTime < 15_000
}

export async function POST(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")
    const supabase = createSupabaseUserClient(sessionState.accessToken)
    const serviceClient = createSupabaseServiceClient()

    const body = (await request.json()) as CompleteReadingPayload
    const entryMode = normalizeEntryMode(body.entryMode)
    const readingGrant = resolveReadingRewardGrant(entryMode)
    const experienceGain = getNumericValue(
      body.experienceGain,
      CHALLENGE_REWARD_POLICY[entryMode].experienceGain,
    )
    const petExpGain = getNumericValue(body.petExpGain, readingGrant.petExp)
    const ownerCoinsGain = readingGrant.ownerCoins
    const starsGain = CHALLENGE_REWARD_POLICY[entryMode].stars
    const regionId = typeof body.regionId === "string" && body.regionId ? body.regionId : undefined
    const challengeChapterId =
      typeof body.challengeChapterId === "string" && body.challengeChapterId ? body.challengeChapterId : undefined
    const readingProgress = Math.min(100, Math.max(1, getNumericValue(body.readingProgress, 100)))

    const userOwnerField = await findExistingColumn(serviceClient, "users", [
      "user_id",
      "id",
      "uid",
      "auth_user_id",
    ])
    const petOwnerField = await findExistingColumn(serviceClient, "pets", [
      "user_id",
      "uid",
      "owner_id",
      "auth_user_id",
    ])

    const userResult = await getRowByIdOrFirst(
      supabase,
      "users",
      ["id", "user_id"],
      sessionState.user.id,
      sessionState.user.id,
      userOwnerField,
    )
    if (userResult.error) {
      console.error(userResult.error)
      return NextResponse.json(
        {
          ok: false,
          source: "supabase",
          action: "resolve-user",
          error: { message: userResult.error.message },
        },
        { status: 502 },
      )
    }
    if (!userResult.row || !userResult.idField) {
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          action: "resolve-user",
          error: { message: "No user row available for reading completion." },
        },
        { status: 404 },
      )
    }

    const petResult = await getRowByIdOrFirst(
      supabase,
      "pets",
      ["id", "pet_id"],
      body.petId,
      sessionState.user.id,
      petOwnerField,
    )
    if (petResult.error) {
      console.error(petResult.error)
      return NextResponse.json(
        {
          ok: false,
          source: "supabase",
          action: "resolve-pet",
          error: { message: petResult.error.message },
        },
        { status: 502 },
      )
    }
    if (!petResult.row || !petResult.idField) {
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          action: "resolve-pet",
          error: { message: "No pet row available for reading completion." },
        },
        { status: 404 },
      )
    }

    const bookResult = await getRowByIdOrFirst(supabase, "books", ["id", "book_id"], body.bookId)
    if (bookResult.error) {
      console.error(bookResult.error)
      return NextResponse.json(
        {
          ok: false,
          source: "supabase",
          action: "resolve-book",
          error: { message: bookResult.error.message },
        },
        { status: 502 },
      )
    }
    if (!bookResult.row) {
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          action: "resolve-book",
          error: { message: "No book row available for reading completion." },
        },
        { status: 404 },
      )
    }

    const userId = toIdString(userResult.row[userResult.idField])
    const petId = toIdString(petResult.row[petResult.idField])
    const bookId = toIdString(
      bookResult.row[resolveFieldName(bookResult.row, ["id", "book_id"]) ?? "id"],
    )

    if (!userId || userId !== sessionState.user.id || !petId || !bookId) {
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          action: "resolve-ids",
          error: { message: "Failed to resolve user/pet/book ids for reading completion." },
        },
        { status: 400 },
      )
    }

    const progressBeforeResult = await fetchUserAdventureProgress({
      supabase,
      serviceClient,
      userId,
    })

    if (entryMode === "direct") {
      const directChallengeCountResult = await countTodayDirectChallenges({
        supabase,
        serviceClient,
        userId,
      })
      if (directChallengeCountResult.error) {
        console.error(directChallengeCountResult.error)
        return NextResponse.json(
          {
            ok: false,
            source: "supabase",
            action: "count-direct-challenges",
            error: {
              message: directChallengeCountResult.error.message,
            },
          },
          { status: 502 },
        )
      }
      if (directChallengeCountResult.count >= DIRECT_CHALLENGE_DAILY_LIMIT) {
        return NextResponse.json(
          {
            ok: false,
            source: "server",
            action: "direct-challenge-limit",
            error: {
              message: `今日直接挑战次数已达上限（${DIRECT_CHALLENGE_DAILY_LIMIT}次）`,
            },
            data: {
              directChallenge: getChallengeLimitSummary(directChallengeCountResult.count),
            },
          },
          { status: 429 },
        )
      }
    }

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

    const userExpField = resolveFieldName(userResult.row, ["experience", "exp", "user_exp"])
    const isDuplicate = await hasRecentReadingRecord({
      supabase,
      userId,
      bookId,
    })
    if (isDuplicate) {
      const streakOnDuplicate = await recordUserDailyActivity(serviceClient, userId)
      const treasureOnDuplicate = await syncUserTreasuresAfterActivity({
        supabase,
        serviceClient,
        userId,
      })
      const response = NextResponse.json({
        ok: true,
        idempotent: true,
        data: {
          message: "Reading completion already processed recently.",
          dailyStreak: streakOnDuplicate.dailyStreak,
          newlyUnlockedTreasures: treasureOnDuplicate.newlyUnlocked,
        },
      })
      if (sessionState.refreshedSession) {
        setAuthCookies(response, sessionState.refreshedSession)
      }
      return response
    }

    const userLevelField = resolveFieldName(userResult.row, ["level", "user_level"])
    const petExpField = resolveFieldName(petResult.row, ["pet_exp", "experience", "exp"])
    const petLevelField = resolveFieldName(petResult.row, ["pet_level", "level"])

    if (!userExpField || !userLevelField || !petLevelField) {
      return NextResponse.json(
        {
          ok: false,
          source: "server",
          action: "resolve-fields",
          error: {
            message:
              "Missing required experience/level fields in users or pets table.",
          },
        },
        { status: 422 },
      )
    }

    const nextUserExp = getNumericValue(userResult.row[userExpField]) + experienceGain
    const nextUserLevel = calculateLevel(nextUserExp, USER_EXP_STEP)
    const nextPetExp = petExpField ? getNumericValue(petResult.row[petExpField]) + petExpGain : null
    const nextPetLevel =
      nextPetExp !== null ? levelFromTotalExp(nextPetExp) : getNumericValue(petResult.row[petLevelField], 1)
    const nextLifeStage = resolveLifeStageFromLevel(nextPetLevel)

    const userCoinsField = resolveFieldName(userResult.row, ["coins", "gold", "coin_balance"])
    const userUpdatePayload: GenericRecord = {
      [userExpField]: nextUserExp,
      [userLevelField]: nextUserLevel,
    }
    if (userCoinsField && ownerCoinsGain > 0) {
      userUpdatePayload[userCoinsField] = getNumericValue(userResult.row[userCoinsField]) + ownerCoinsGain
    }
    if ("updated_at" in userResult.row) {
      userUpdatePayload.updated_at = new Date().toISOString()
    }

    const petUpdatePayload: GenericRecord = {
      [petLevelField]: nextPetLevel,
    }
    if (petExpField && nextPetExp !== null) {
      petUpdatePayload[petExpField] = nextPetExp
    }
    if ("life_stage" in petResult.row) petUpdatePayload.life_stage = nextLifeStage
    if ("pet_life_stage" in petResult.row) petUpdatePayload.pet_life_stage = nextLifeStage
    if ("updated_at" in petResult.row) {
      petUpdatePayload.updated_at = new Date().toISOString()
    }

    const userUpdateResult = await supabase
      .from("users")
      .update(userUpdatePayload)
      .eq(userResult.idField, userId)
      .select("*")
      .limit(1)

    if (userUpdateResult.error) {
      console.error(userUpdateResult.error)
      return NextResponse.json(
        {
          ok: false,
          source: "supabase",
          action: "update-user",
          error: {
            message: userUpdateResult.error.message,
            code: userUpdateResult.error.code ?? null,
            details: userUpdateResult.error.details ?? null,
            hint: userUpdateResult.error.hint ?? null,
          },
        },
        { status: 502 },
      )
    }

    const petUpdateResult = await supabase
      .from("pets")
      .update(petUpdatePayload)
      .eq(petResult.idField, petId)
      .select("*")
      .limit(1)

    if (petUpdateResult.error) {
      console.error(petUpdateResult.error)
      return NextResponse.json(
        {
          ok: false,
          source: "supabase",
          action: "update-pet",
          error: {
            message: petUpdateResult.error.message,
            code: petUpdateResult.error.code ?? null,
            details: petUpdateResult.error.details ?? null,
            hint: petUpdateResult.error.hint ?? null,
          },
        },
        { status: 502 },
      )
    }

    const readingRecordResult = await insertReadingRecord({
      supabase,
      userId,
      petId,
      bookId,
      experienceGain,
      petExpGain,
      readingProgress,
      entryMode,
      starsGain,
      regionId,
      challengeChapterId,
    })

    if (readingRecordResult.error) {
      console.error(readingRecordResult.error)
      return NextResponse.json(
        {
          ok: false,
          source: "supabase",
          action: "insert-reading-record",
          error: {
            message:
              readingRecordResult.error instanceof Error
                ? readingRecordResult.error.message
                : "Failed to insert reading record",
          },
        },
        { status: 502 },
      )
    }

    const taskProgressResult = await advanceReadingTaskProgress(supabase, userId)
    if (taskProgressResult.error) {
      console.error(taskProgressResult.error)
      return NextResponse.json(
        {
          ok: false,
          source: "supabase",
          action: "advance-daily-tasks",
          error: {
            message: taskProgressResult.error.message,
            code: taskProgressResult.error.code ?? null,
            details: taskProgressResult.error.details ?? null,
            hint: taskProgressResult.error.hint ?? null,
          },
        },
        { status: 502 },
      )
    }

    const latestDirectChallengeCountResult = await countTodayDirectChallenges({
      supabase,
      serviceClient,
      userId,
    })
    if (latestDirectChallengeCountResult.error) {
      console.error(latestDirectChallengeCountResult.error)
    }

    const adventureProgressResult = await fetchUserAdventureProgress({
      supabase,
      serviceClient,
      userId,
    })
    if (adventureProgressResult.error) {
      console.error(adventureProgressResult.error)
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

    const bookTitle = resolveBookTitleFromRow(bookResult.row)
    await emitReadingRewardNotification(serviceClient, userId, { bookTitle, starsGain })
    await emitRegionUnlockNotifications(
      serviceClient,
      userId,
      progressBeforeResult.data,
      adventureProgressResult.data,
    )
    await emitRegionProgressReminders(serviceClient, userId, adventureProgressResult.data)
    await emitDailyEngagementNotifications(serviceClient, userId, {
      streak: streakResult.dailyStreak,
      streakApplied: streakResult.applied,
    })

    const response = NextResponse.json({
      ok: true,
      data: {
        entryMode,
        reward: {
          experienceGain,
          petExpGain,
          starsGain,
        },
        directChallenge: getChallengeLimitSummary(latestDirectChallengeCountResult.count),
        adventureProgress: adventureProgressResult.data,
        readingRecord: readingRecordResult.data,
        user: userUpdateResult.data?.[0] ?? null,
        pet: petUpdateResult.data?.[0] ?? null,
        tasks: taskProgressResult.data ?? [],
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
        action: "complete-reading",
        error: {
          message: error instanceof Error ? error.message : "Unknown server error",
        },
      },
      { status: 503 },
    )
  }
}

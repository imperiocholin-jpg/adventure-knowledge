import { buildAdventureProgressFromRows } from "@/lib/adventure/server-progress"
import { sortPetsWithPrimaryFirst } from "@/lib/pets/resolve-primary-pet"
import { fetchAuthEmailsByUserIds } from "@/lib/admin/auth-emails"
import { fetchAdminUserSocialStats } from "@/lib/admin/user-social"
import {
  getNumber,
  getString,
  resolveUsersOwnerField,
  resolvePetsOwnerField,
  resolveReadingOwnerField,
  resolveTasksOwnerField,
  summarizePetRow,
  summarizeUserRow,
} from "@/lib/admin/record-fields"

type GenericRecord = Record<string, unknown>

function summarizeReadingRow(row: GenericRecord) {
  return {
    id: getString(row, ["id"]),
    bookId: getString(row, ["book_id", "bookId"]),
    regionId: getString(row, ["region_id", "region"]),
    stars: getNumber(row, ["stars_gain", "stars"]),
    experienceGain: getNumber(row, ["experience_gain", "experience", "exp"]),
    petExpGain: getNumber(row, ["pet_exp_gain", "pet_exp"]),
    entryMode: getString(row, ["entry_mode", "mode"]),
    createdAt: getString(row, ["created_at"]) || null,
  }
}

function summarizeTaskRow(row: GenericRecord) {
  const progress = getNumber(row, ["progress", "current_progress"])
  const maxProgress = getNumber(row, ["max_progress", "target_progress"], 1)
  const claimed = Boolean(row.claimed ?? row.is_claimed)
  return {
    id: getString(row, ["id", "task_id"]),
    title: getString(row, ["title", "name"], "每日任务"),
    taskType: getString(row, ["task_type", "type"]),
    progress,
    maxProgress,
    claimed,
    status: getString(row, ["status"]),
  }
}

export async function fetchAdminUserDetail(serviceClient: any, userId: string) {
  const ownerField = await resolveUsersOwnerField(serviceClient)
  if (!ownerField) {
    return { ok: false as const, error: "users 表缺少归属字段" }
  }

  const userResult = await serviceClient.from("users").select("*").eq(ownerField, userId).limit(1).maybeSingle()
  if (userResult.error) {
    return { ok: false as const, error: userResult.error.message }
  }
  if (!userResult.data) {
    return { ok: false as const, error: "用户不存在", notFound: true }
  }

  const userRow = userResult.data as GenericRecord
  const petOwnerField = await resolvePetsOwnerField(serviceClient)
  const readingOwnerField = await resolveReadingOwnerField(serviceClient)
  const tasksOwnerField = await resolveTasksOwnerField(serviceClient)

  const [petsResult, readingResult, tasksResult, treasuresResult] = await Promise.all([
    petOwnerField
      ? serviceClient.from("pets").select("*").eq(petOwnerField, userId).limit(5)
      : Promise.resolve({ data: [], error: null }),
    readingOwnerField
      ? serviceClient
          .from("reading_records")
          .select("*")
          .eq(readingOwnerField, userId)
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [], error: null }),
    tasksOwnerField
      ? serviceClient.from("daily_tasks").select("*").eq(tasksOwnerField, userId).limit(20)
      : Promise.resolve({ data: [], error: null }),
    serviceClient.from("user_treasures").select("*").eq("user_id", userId).limit(50),
  ])

  const readingRows = (readingResult.data ?? []) as GenericRecord[]
  const adventureProgress = buildAdventureProgressFromRows(readingRows)

  let treasures: GenericRecord[] = []
  if (!treasuresResult.error && Array.isArray(treasuresResult.data)) {
    treasures = treasuresResult.data as GenericRecord[]
    const defIds = treasures.map((t) => t.treasure_id).filter(Boolean)
    if (defIds.length > 0) {
      const defsResult = await serviceClient.from("treasure_definitions").select("*").in("id", defIds)
      const defsById = new Map<string, GenericRecord>()
      for (const def of (defsResult.data ?? []) as GenericRecord[]) {
        if (typeof def.id === "string") defsById.set(def.id, def)
      }
      treasures = treasures.map((t) => ({
        ...t,
        definition: defsById.get(String(t.treasure_id)) ?? null,
      }))
    }
  }

  const authEmails = await fetchAuthEmailsByUserIds(serviceClient, [userId])
  const email = getString(userRow, ["email"]) || authEmails.get(userId) || ""
  const social = await fetchAdminUserSocialStats(serviceClient, userId)

  return {
    ok: true as const,
    data: {
      user: {
        ...summarizeUserRow(userRow, email),
        followingCount: social.followingCount,
        followerCount: social.followerCount,
      },
      rawUser: userRow,
      pets: sortPetsWithPrimaryFirst((petsResult.data ?? []) as GenericRecord[]).map(summarizePetRow),
      readingRecords: readingRows.map(summarizeReadingRow),
      dailyTasks: ((tasksResult.data ?? []) as GenericRecord[]).map(summarizeTaskRow),
      adventureProgress: {
        totalStars: adventureProgress.totalStars,
        worldProgress: adventureProgress.worldProgress,
      },
      treasures: treasures.map((t) => ({
        treasureId: String(t.treasure_id ?? ""),
        unlockedAt: typeof t.unlocked_at === "string" ? t.unlocked_at : null,
        name: typeof (t.definition as GenericRecord | undefined)?.name === "string"
          ? (t.definition as GenericRecord).name
          : String(t.treasure_id ?? ""),
      })),
    },
  }
}

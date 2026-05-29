import { findExistingColumn } from "@/lib/data/schema-compat"

type GenericRecord = Record<string, unknown>

export async function fetchUserReadingRows(params: {
  supabase: any
  serviceClient: any
  userId: string
  limit?: number
}) {
  const ownerField = await findExistingColumn(params.serviceClient, "reading_records", [
    "user_id",
    "uid",
    "owner_id",
    "auth_user_id",
  ])
  if (!ownerField) return [] as GenericRecord[]

  const result = await params.supabase
    .from("reading_records")
    .select("*")
    .eq(ownerField, params.userId)
    .order("created_at", { ascending: false })
    .limit(params.limit ?? 1000)

  if (result.error) return [] as GenericRecord[]
  return (result.data ?? []) as GenericRecord[]
}

function resolveFieldName(record: GenericRecord, candidates: string[]) {
  return candidates.find((field) => field in record)
}

export async function insertBossVictoryRecord(params: {
  supabase: any
  userId: string
  petId: string
  regionId: string
  challengeChapterId: string
  starsGain: number
  experienceGain: number
  petExpGain: number
}) {
  const attempts: GenericRecord[] = [
    {
      user_id: params.userId,
      pet_id: params.petId,
      book_id: params.challengeChapterId,
      entry_mode: "boss",
      challenge_mode: "boss",
      region_id: params.regionId,
      challenge_chapter_id: params.challengeChapterId,
      stars_gain: params.starsGain,
      experience_gain: params.experienceGain,
      pet_exp_gain: params.petExpGain,
      reading_progress: 100,
      created_at: new Date().toISOString(),
    },
    {
      user_id: params.userId,
      pet_id: params.petId,
      book_id: params.challengeChapterId,
      entry_mode: "boss",
      challenge_mode: "boss",
      region_id: params.regionId,
      challenge_chapter_id: params.challengeChapterId,
      stars: params.starsGain,
      experience: params.experienceGain,
      pet_exp: params.petExpGain,
      progress: 100,
      completed: true,
      created_at: new Date().toISOString(),
    },
    {
      user_id: params.userId,
      book_id: params.challengeChapterId,
      region_id: params.regionId,
      progress: 100,
      completed: true,
      created_at: new Date().toISOString(),
    },
  ]

  let lastError: unknown = null
  for (const payload of attempts) {
    const result = await params.supabase.from("reading_records").insert(payload)
    if (!result.error) return { error: null }
    lastError = result.error
    const message = String(result.error?.message ?? "")
    if (!message.includes("column") && !message.includes("schema cache")) {
      return { error: result.error }
    }
  }

  return { error: lastError }
}

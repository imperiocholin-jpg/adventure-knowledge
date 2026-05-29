import { AVATAR_IDS } from "@/lib/user/avatar-ids.generated"

export type UserAvatarGender = "boy" | "girl"

export interface UserAvatarOption {
  id: string
  gender: UserAvatarGender
  label: string
  src: string
}

export const DEFAULT_USER_AVATAR_ID = "boy-01"

const AVATAR_ID_PATTERN = /^(boy|girl)-(\d{2})$/i

/** 性别仅由文件名前缀决定：boy-*.png → 男生，girl-*.png → 女生 */
export function parseAvatarId(id: string): { gender: UserAvatarGender; index: number } | null {
  const match = id.match(AVATAR_ID_PATTERN)
  if (!match) return null
  const gender = match[1].toLowerCase() as UserAvatarGender
  const index = Number(match[2])
  if (!Number.isFinite(index) || index < 1) return null
  return { gender, index }
}

export function getAvatarGenderFromId(id: string): UserAvatarGender {
  return parseAvatarId(id)?.gender ?? "boy"
}

export function isValidUserAvatarId(value: unknown): value is string {
  return typeof value === "string" && parseAvatarId(value) !== null && AVATAR_IDS.includes(value as (typeof AVATAR_IDS)[number])
}

function buildAvatarOption(id: string): UserAvatarOption | null {
  const parsed = parseAvatarId(id)
  if (!parsed) return null
  const prefix = parsed.gender === "boy" ? "男生" : "女生"
  return {
    id,
    gender: parsed.gender,
    label: `${prefix} ${parsed.index}`,
    src: `/image/avatars/${id}.png`,
  }
}

export const USER_AVATAR_CATALOG: UserAvatarOption[] = AVATAR_IDS.map((id) => buildAvatarOption(id)).filter(
  (item): item is UserAvatarOption => item !== null,
)

const AVATAR_BY_ID = new Map(USER_AVATAR_CATALOG.map((item) => [item.id, item]))

export function resolveUserAvatarSrc(avatarId: string | null | undefined): string {
  if (avatarId && AVATAR_BY_ID.has(avatarId)) {
    return AVATAR_BY_ID.get(avatarId)!.src
  }
  return AVATAR_BY_ID.get(DEFAULT_USER_AVATAR_ID)!.src
}

export function getUserAvatarOption(avatarId: string | null | undefined): UserAvatarOption {
  if (avatarId && AVATAR_BY_ID.has(avatarId)) {
    return AVATAR_BY_ID.get(avatarId)!
  }
  return AVATAR_BY_ID.get(DEFAULT_USER_AVATAR_ID)!
}

export const USER_AVATARS_BY_GENDER = {
  boy: USER_AVATAR_CATALOG.filter((item) => item.id.startsWith("boy-")),
  girl: USER_AVATAR_CATALOG.filter((item) => item.id.startsWith("girl-")),
} as const

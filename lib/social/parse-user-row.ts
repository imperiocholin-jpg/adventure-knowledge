import {
  DEFAULT_USER_AVATAR_ID,
  isValidUserAvatarId,
  resolveUserAvatarSrc,
} from "@/lib/user/avatar-catalog"

type GenericRecord = Record<string, unknown>

export function resolveUserIdField(row: GenericRecord) {
  if ("id" in row) return "id"
  if ("user_id" in row) return "user_id"
  if ("uid" in row) return "uid"
  return null
}

export function readUserId(row: GenericRecord) {
  const field = resolveUserIdField(row)
  if (!field) return null
  const value = row[field]
  if (typeof value === "string" && value) return value
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return null
}

export function readUsername(row: GenericRecord) {
  for (const key of ["nickname", "username", "name"]) {
    const value = row[key]
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 20)
  }
  return "小冒险家"
}

export function readAvatarId(row: GenericRecord) {
  const raw = row.avatar_id ?? row.user_avatar_id ?? row.avatarId
  if (isValidUserAvatarId(raw)) return raw
  return DEFAULT_USER_AVATAR_ID
}

export function readBattleWins(row: GenericRecord) {
  const raw = row.battle_wins ?? row.battleWins ?? row.battle_score ?? row.battleScore
  const n = Number(raw)
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
}

export function resolveBattleWinsOrderColumn() {
  return "battle_wins"
}

export function toSocialUserCard(
  row: GenericRecord,
  options: { rank: number; isSelf?: boolean; isFollowing?: boolean },
) {
  const userId = readUserId(row)
  if (!userId) return null
  const avatarId = readAvatarId(row)
  return {
    userId,
    username: readUsername(row),
    avatarId,
    avatarSrc: resolveUserAvatarSrc(avatarId),
    score: readBattleWins(row),
    rank: options.rank,
    isSelf: options.isSelf,
    isFollowing: options.isFollowing,
  }
}

export function todayUtcDateString() {
  return new Date().toISOString().slice(0, 10)
}

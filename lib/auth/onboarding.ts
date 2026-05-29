type GenericRecord = Record<string, unknown>

function resolveField(row: GenericRecord, candidates: string[]) {
  return candidates.find((field) => field in row)
}

function readNonEmptyString(row: GenericRecord, field: string | undefined) {
  if (!field) return null
  const value = row[field]
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/** 根据实际字段推断资料是否已填完整（不依赖 profile_setup_completed 标记） */
export function inferUserProfileSetupCompleted(userRow: GenericRecord) {
  const nameField = resolveField(userRow, ["nickname", "username", "name"])
  const avatarField = resolveField(userRow, ["avatar_id", "user_avatar_id", "avatarId"])
  const schoolField = resolveField(userRow, ["school_name", "schoolName"])
  const gradeField = resolveField(userRow, ["grade_class", "gradeClass"])

  const name = readNonEmptyString(userRow, nameField)
  const avatar = readNonEmptyString(userRow, avatarField)
  const school = readNonEmptyString(userRow, schoolField)
  const grade = readNonEmptyString(userRow, gradeField)

  const hasName = Boolean(name && name.length >= 2)
  const hasAvatar = Boolean(avatar)
  const hasSchoolProfile = Boolean(school && school.length >= 2 && grade && grade.length >= 2)

  return hasName && (hasAvatar || hasSchoolProfile)
}

export function isUserProfileSetupCompleted(userRow: GenericRecord | null | undefined) {
  if (!userRow) return false

  const flagField = resolveField(userRow, ["profile_setup_completed", "user_profile_setup_completed"])
  if (flagField && userRow[flagField] === true) return true

  return inferUserProfileSetupCompleted(userRow)
}

/** 根据实际字段推断宠物是否已完成领养（不依赖 pet_setup_completed 标记） */
export function inferPetProfileCompleted(row: GenericRecord) {
  const setupField = resolveField(row, ["pet_setup_completed", "setup_completed"])
  if (setupField && row[setupField] === true) return true

  const speciesField = resolveField(row, ["species", "pet_species"])
  const breedField = resolveField(row, ["breed", "pet_breed"])
  const nameField = resolveField(row, ["name", "pet_name"])
  const species = readNonEmptyString(row, speciesField)
  const breed = readNonEmptyString(row, breedField)
  const name = readNonEmptyString(row, nameField)

  if (species && breed) return true
  if (breed) return true
  if (name && name !== "毛毛") return true

  // 库中尚无 species/breed 列时：有使用痕迹的宠物视为已完成领养
  const schemaHasSpecies = Boolean(speciesField)
  const schemaHasBreed = Boolean(breedField)
  if (!schemaHasSpecies && !schemaHasBreed) {
    const exp = Number(row.pet_exp ?? row.exp ?? 0)
    const level = Number(row.pet_level ?? row.level ?? 1)
    const createdAt = typeof row.created_at === "string" ? Date.parse(row.created_at) : NaN
    const updatedAt = typeof row.updated_at === "string" ? Date.parse(row.updated_at) : NaN
    const wasUpdatedAfterCreate =
      Number.isFinite(createdAt) && Number.isFinite(updatedAt) && updatedAt - createdAt > 60_000

    if (exp > 0 || level > 1 || wasUpdatedAfterCreate) return true
  }

  return false
}

export function isPetProfileCompleted(row: GenericRecord | null | undefined) {
  if (!row) return false
  return inferPetProfileCompleted(row)
}

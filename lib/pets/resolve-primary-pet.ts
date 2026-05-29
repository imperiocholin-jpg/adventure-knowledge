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

/** 数值越高越应作为「主宠物」展示与写入 */
export function scorePetRow(row: GenericRecord) {
  let score = 0

  const setupField = resolveField(row, ["pet_setup_completed", "setup_completed"])
  if (setupField && row[setupField] === true) score += 1_000

  const species = readNonEmptyString(row, resolveField(row, ["species", "pet_species"]))
  const breed = readNonEmptyString(row, resolveField(row, ["breed", "pet_breed"]))
  if (species) score += 300
  if (breed) score += 300

  const name = readNonEmptyString(row, resolveField(row, ["name", "pet_name"]))
  if (name && name !== "毛毛") score += 200

  const exp = Number(row.pet_exp ?? row.exp ?? 0)
  const level = Number(row.pet_level ?? row.level ?? 1)
  if (Number.isFinite(exp) && exp > 0) score += 100
  if (Number.isFinite(level) && level > 1) score += 50

  const createdAt = typeof row.created_at === "string" ? Date.parse(row.created_at) : NaN
  const updatedAt = typeof row.updated_at === "string" ? Date.parse(row.updated_at) : NaN
  if (Number.isFinite(createdAt) && Number.isFinite(updatedAt) && updatedAt - createdAt > 60_000) {
    score += 40
  }

  if (Number.isFinite(updatedAt)) score += updatedAt / 1_000_000_000_000

  return score
}

export function resolvePrimaryPetRow(rows: GenericRecord[] | null | undefined) {
  if (!rows?.length) return null
  return rows.reduce((best, row) => (scorePetRow(row) > scorePetRow(best) ? row : best))
}

export function sortPetsWithPrimaryFirst(rows: GenericRecord[]) {
  return [...rows].sort((a, b) => scorePetRow(b) - scorePetRow(a))
}

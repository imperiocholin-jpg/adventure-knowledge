export function normalizeSchoolName(value: unknown) {
  if (typeof value !== "string") return null
  const trimmed = value.trim().slice(0, 60)
  return trimmed.length >= 2 ? trimmed : null
}

export function normalizeGradeClass(value: unknown) {
  if (typeof value !== "string") return null
  const trimmed = value.trim().slice(0, 30)
  return trimmed.length >= 2 ? trimmed : null
}

export function normalizeAge(value: unknown) {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN
  if (!Number.isFinite(n)) return null
  const age = Math.floor(n)
  if (age < 5 || age > 18) return null
  return age
}

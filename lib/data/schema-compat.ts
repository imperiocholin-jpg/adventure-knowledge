type GenericRecord = Record<string, unknown>

const columnExistenceCache = new Map<string, boolean>()

function cacheKey(table: string, column: string) {
  return `${table}::${column}`
}

export async function isColumnExisting(supabase: any, table: string, column: string) {
  const key = cacheKey(table, column)
  if (columnExistenceCache.has(key)) {
    return columnExistenceCache.get(key) ?? false
  }

  const probe = await supabase.from(table).select("*").eq(column, "__probe__").limit(1)
  const exists = !probe.error || probe.error.code !== "42703"
  columnExistenceCache.set(key, exists)
  return exists
}

export async function findExistingColumn(
  supabase: any,
  table: string,
  candidates: string[],
) {
  for (const candidate of candidates) {
    if (await isColumnExisting(supabase, table, candidate)) {
      return candidate
    }
  }
  return null
}

export async function findExistingColumns(
  supabase: any,
  table: string,
  candidates: string[],
) {
  const existing: string[] = []
  for (const candidate of candidates) {
    if (await isColumnExisting(supabase, table, candidate)) existing.push(candidate)
  }
  return existing
}

export function getStringValue(row: GenericRecord, field: string | null, fallback = "") {
  if (!field) return fallback
  const value = row[field]
  if (typeof value === "string" && value.trim()) return value
  if (typeof value === "number") return String(value)
  return fallback
}

export function getNumberValue(row: GenericRecord, field: string | null, fallback = 0) {
  if (!field) return fallback
  const value = row[field]
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

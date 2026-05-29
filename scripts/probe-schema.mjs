import fs from "node:fs"
import { createClient } from "@supabase/supabase-js"

function readEnv() {
  const raw = fs.readFileSync(".env.local", "utf8")
  const entries = raw
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf("=")
      return idx > 0 ? [line.slice(0, idx), line.slice(idx + 1)] : null
    })
    .filter(Boolean)
  return Object.fromEntries(entries)
}

async function fieldExists(supabase, table, field) {
  const result = await supabase.from(table).select("*").eq(field, "__probe__").limit(1)
  if (!result.error) return { exists: true, code: null, message: null }
  if (result.error.code === "42703") return { exists: false, code: result.error.code, message: result.error.message }
  // Non-42703 generally means field exists but value/type invalid (e.g. uuid cast).
  return { exists: true, code: result.error.code ?? null, message: result.error.message ?? null }
}

async function inspectTable(supabase, table, candidates) {
  const fields = {}
  for (const field of candidates) {
    fields[field] = await fieldExists(supabase, table, field)
  }

  const rows = await supabase.from(table).select("*").limit(5)
  const sampleKeys = rows.data?.[0] ? Object.keys(rows.data[0]) : []

  const existing = Object.entries(fields)
    .filter(([, status]) => status.exists)
    .map(([name]) => name)

  return {
    table,
    readError: rows.error?.message ?? null,
    sampleCount: rows.data?.length ?? 0,
    sampleKeys,
    existingCandidateFields: existing,
    fieldChecks: fields,
  }
}

async function main() {
  const env = readEnv()
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const commonCandidates = [
    "id",
    "user_id",
    "uid",
    "auth_user_id",
    "owner_id",
    "task_id",
    "pet_id",
    "book_id",
    "experience",
    "exp",
    "user_exp",
    "pet_exp",
    "level",
    "pet_level",
    "status",
    "progress",
    "max_progress",
    "claimed",
    "completed",
    "coin_reward",
    "coins",
    "created_at",
    "updated_at",
  ]

  const tables = ["users", "pets", "daily_tasks", "reading_records"]
  const report = []
  for (const table of tables) {
    report.push(await inspectTable(supabase, table, commonCandidates))
  }
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

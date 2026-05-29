import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

function readEnv() {
  const envPath = path.join(ROOT, ".env.local")
  const raw = fs.readFileSync(envPath, "utf8")
  return Object.fromEntries(
    raw
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const idx = line.indexOf("=")
        return idx > 0 ? [line.slice(0, idx).trim(), line.slice(idx + 1).trim()] : null
      })
      .filter(Boolean),
  )
}

const env = readEnv()
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function listAllAuthUsers() {
  const users = []
  let page = 1
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    users.push(...data.users)
    if (data.users.length < 200) break
    page += 1
  }
  return users
}

function pickName(row) {
  return row?.nickname || row?.username || row?.name || row?.display_name || ""
}

async function main() {
  const authUsers = await listAllAuthUsers()
  const { data: allUsers } = await supabase.from("users").select("*")
  const userById = new Map((allUsers ?? []).map((r) => [r.id || r.user_id, r]))

  console.log("=== All auth users ===")
  for (const u of authUsers) {
    const row = userById.get(u.id)
    console.log({
      authId: u.id,
      email: u.email,
      publicName: pickName(row) || "(no public.users row)",
      hasPublicRow: Boolean(row),
      created_at: u.created_at,
    })
  }

  const adminId = "f0f5d4ce-d3eb-4ea1-a183-3b3fba56bb6f"
  const { data: adminPets } = await supabase.from("pets").select("*").eq("user_id", adminId)
  console.log("\n=== Admin pets count:", adminPets?.length ?? 0)
  for (const p of adminPets ?? []) console.log(p.id, p.name, p.created_at)
}

main().catch(console.error)

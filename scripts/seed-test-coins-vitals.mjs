import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const TEST_COINS = 5000

function readEnv() {
  const raw = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8")
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

async function main() {
  const env = readEnv()
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const users = await supabase.from("users").select("id, nickname, coins")
  const pets = await supabase.from("pets").select("id, user_id, pet_name, intimacy, energy")
  if (users.error) throw users.error
  if (pets.error) throw pets.error

  const report = []
  for (const user of users.data ?? []) {
    await supabase.from("users").update({ coins: TEST_COINS }).eq("id", user.id)
    const pet = (pets.data ?? []).find((row) => row.user_id === user.id)
    if (pet) {
      await supabase
        .from("pets")
        .update({ intimacy: 100, energy: 100, mood: 1 })
        .eq("id", pet.id)
    }
    report.push({ user: user.nickname, coins: TEST_COINS, pet: pet?.pet_name ?? null })
  }

  console.log(JSON.stringify({ ok: true, note: "已发放积分与亲密/精神（不含背包物品）", users: report }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

/**
 * 创建 user_follows 表（关注/粉丝）
 * 用法：在 .env.local 配置 DATABASE_URL 或 SUPABASE_DB_PASSWORD 后执行
 *   node scripts/apply-social-migration.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

function readEnv() {
  const raw = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8")
  const entries = raw
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=")
      return idx > 0 ? [line.slice(0, idx).trim(), line.slice(idx + 1).trim()] : null
    })
    .filter(Boolean)
  return Object.fromEntries(entries)
}

function resolveDatabaseUrl(env) {
  if (env.DATABASE_URL) return env.DATABASE_URL
  const password = env.SUPABASE_DB_PASSWORD || env.DATABASE_PASSWORD
  if (!password) return null
  const ref = env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  if (!ref) return null
  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
}

async function main() {
  const env = readEnv()
  const databaseUrl = resolveDatabaseUrl(env)
  if (!databaseUrl) {
    console.error("请在 .env.local 配置 DATABASE_URL 或 SUPABASE_DB_PASSWORD 后重试")
    console.error("或手动在 Supabase SQL Editor 执行：supabase/scripts/apply-social-migration.sql")
    process.exit(1)
  }

  const sqlPath = path.join(ROOT, "supabase/scripts/apply-social-migration.sql")
  const sql = fs.readFileSync(sqlPath, "utf8")
  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    await client.query(sql)
    console.log("✓ 已执行 apply-social-migration.sql（user_follows + battle_wins）")
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

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

function randomEmail(prefix) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 10000)}@qq.com`
}

async function createUserByAdmin(url, serviceRole, email, password) {
  const response = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
    }),
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`createUserByAdmin failed (${response.status}): ${detail}`)
  }
}

async function signIn(url, anon, email, password) {
  const client = createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
  const result = await client.auth.signInWithPassword({ email, password })
  if (result.error || !result.data.session || !result.data.user) {
    throw new Error(result.error?.message ?? "signInWithPassword failed")
  }
  return {
    userId: result.data.user.id,
    accessToken: result.data.session.access_token,
  }
}

function createUserClient(url, anon, accessToken) {
  return createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

async function main() {
  const env = readEnv()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY
  const password = "Passw0rd!123"

  const emailA = randomEmail("rlsa")
  const emailB = randomEmail("rlsb")

  await createUserByAdmin(url, serviceRole, emailA, password)
  await createUserByAdmin(url, serviceRole, emailB, password)

  const authA = await signIn(url, anon, emailA, password)
  const authB = await signIn(url, anon, emailB, password)

  const clientA = createUserClient(url, anon, authA.accessToken)
  const clientB = createUserClient(url, anon, authB.accessToken)

  const aAllUsers = await clientA.from("users").select("*")
  const bAllUsers = await clientB.from("users").select("*")
  const aReadB = await clientA.from("users").select("*").eq("id", authB.userId)
  const bReadA = await clientB.from("users").select("*").eq("id", authA.userId)
  const aUpdateB = await clientA.from("users").update({ coins: 999 }).eq("id", authB.userId).select("*")

  console.log(
    JSON.stringify(
      {
        userAId: authA.userId,
        userBId: authB.userId,
        aAllUsersCount: aAllUsers.data?.length ?? null,
        bAllUsersCount: bAllUsers.data?.length ?? null,
        aReadBOtherCount: aReadB.data?.length ?? null,
        bReadAOtherCount: bReadA.data?.length ?? null,
        aUpdateBCount: aUpdateB.data?.length ?? null,
        aAllUsersError: aAllUsers.error?.message ?? null,
        bAllUsersError: bAllUsers.error?.message ?? null,
        aReadBError: aReadB.error?.message ?? null,
        bReadAError: bReadA.error?.message ?? null,
        aUpdateBError: aUpdateB.error?.message ?? null,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

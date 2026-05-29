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

function cookieFromSession(session) {
  return `sb-access-token=${session.access_token}; sb-refresh-token=${session.refresh_token}`
}

async function requestJson(path, { method = "GET", cookie, body } = {}) {
  const response = await fetch(`http://localhost:3000${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      cookie: cookie ?? "",
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }
  return { status: response.status, payload }
}

function makeEmail(prefix) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 10000)}@qq.com`
}

async function main() {
  const env = readEnv()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anon || !serviceRole) {
    throw new Error("Missing required Supabase env keys in .env.local")
  }

  const authClient = createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  const password = "Passw0rd!123"
  const emailA = makeEmail("a")
  const emailB = makeEmail("b")

  const createAdminUser = async (email) => {
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
    if (!response.ok && response.status !== 422) {
      const body = await response.text()
      throw new Error(`admin create user failed (${response.status}): ${body}`)
    }
  }

  await createAdminUser(emailA)
  await createAdminUser(emailB)

  const signupA = await authClient.auth.signInWithPassword({ email: emailA, password })
  const signupB = await authClient.auth.signInWithPassword({ email: emailB, password })
  if (!signupA.data.session || !signupB.data.session) {
    console.log(
      JSON.stringify(
        {
          error: "Sign in did not return session for test users.",
          signupA: signupA.error?.message ?? null,
          signupB: signupB.error?.message ?? null,
        },
        null,
        2,
      ),
    )
    process.exit(2)
  }

  const cookieA = cookieFromSession(signupA.data.session)
  const cookieB = cookieFromSession(signupB.data.session)

  const result = {}

  result.authSessionA = (await requestJson("/api/auth/session", { cookie: cookieA })).status
  result.authSessionB = (await requestJson("/api/auth/session", { cookie: cookieB })).status

  const apiUsersA = await requestJson("/api/users", { cookie: cookieA })
  const apiUsersB = await requestJson("/api/users", { cookie: cookieB })
  result.apiUsersA = apiUsersA.status
  result.apiUsersB = apiUsersB.status

  const userAId = apiUsersA.payload?.data?.[0]?.user_id ?? apiUsersA.payload?.data?.[0]?.id ?? null
  const userBId = apiUsersB.payload?.data?.[0]?.user_id ?? apiUsersB.payload?.data?.[0]?.id ?? null
  result.userIds = { userAId, userBId, different: userAId && userBId ? userAId !== userBId : null }

  const apiTasksA = await requestJson("/api/tasks", { cookie: cookieA })
  const apiTasksB = await requestJson("/api/tasks", { cookie: cookieB })
  result.apiTasksA = apiTasksA.status
  result.apiTasksB = apiTasksB.status

  const taskAId = apiTasksA.payload?.data?.[0]?.id ?? apiTasksA.payload?.data?.[0]?.task_id ?? null
  result.taskAId = taskAId

  const crossClaim = await requestJson("/api/tasks/claim", {
    method: "POST",
    cookie: cookieB,
    body: { missionId: taskAId },
  })
  result.crossClaimStatus = crossClaim.status

  const completeA = await requestJson("/api/reading/complete", {
    method: "POST",
    cookie: cookieA,
    body: { readingProgress: 100, experienceGain: 20, petExpGain: 12 },
  })
  result.readingCompleteA = completeA.status

  const afterTasksA = await requestJson("/api/tasks", { cookie: cookieA })
  const claimableTask = (afterTasksA.payload?.data ?? []).find((task) => {
    const status = String(task?.status ?? "").toLowerCase()
    return ["claimable", "completed", "ready_to_claim"].includes(status) || task?.progress >= task?.max_progress
  })

  if (claimableTask) {
    const missionId = claimableTask.id ?? claimableTask.task_id
    const claimOnce = await requestJson("/api/tasks/claim", {
      method: "POST",
      cookie: cookieA,
      body: { missionId },
    })
    const claimTwice = await requestJson("/api/tasks/claim", {
      method: "POST",
      cookie: cookieA,
      body: { missionId },
    })
    result.claimOnceStatus = claimOnce.status
    result.claimTwiceStatus = claimTwice.status
  } else {
    result.claimOnceStatus = "NO_CLAIMABLE_TASK"
    result.claimTwiceStatus = "NO_CLAIMABLE_TASK"
  }

  const userClientA = createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${signupA.data.session.access_token}`,
      },
    },
  })

  const ownRead = await userClientA.from("users").select("*").eq("user_id", userAId)
  const otherRead = await userClientA.from("users").select("*").eq("user_id", userBId)
  const otherUpdate = await userClientA
    .from("users")
    .update({ level: 999 })
    .eq("user_id", userBId)
    .select("*")

  result.rlsOwnReadCount = ownRead.data ? ownRead.data.length : null
  result.rlsOtherReadCount = otherRead.data ? otherRead.data.length : null
  result.rlsOtherReadError = otherRead.error?.message ?? null
  result.rlsOtherUpdateCount = otherUpdate.data ? otherUpdate.data.length : null
  result.rlsOtherUpdateError = otherUpdate.error?.message ?? null

  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

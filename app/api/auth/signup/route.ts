import { NextRequest, NextResponse } from "next/server"

import { finishAuthSession } from "@/lib/auth/finish-auth-session"
import { createSupabaseAuthClient, createSupabaseServiceClient } from "@/lib/auth/server"

interface AuthPayload {
  email?: string
  password?: string
}

function isAlreadyRegistered(message?: string) {
  if (!message) return false
  const lower = message.toLowerCase()
  return lower.includes("already registered") || lower.includes("already exists")
}

function isEmailRateLimited(message?: string) {
  if (!message) return false
  return message.toLowerCase().includes("email rate limit exceeded")
}

async function tryAutoConfirmByEmail(email: string) {
  try {
    const serviceClient = createSupabaseServiceClient()
    const listResult = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 200 })
    if (listResult.error) return false
    const target = (listResult.data.users ?? []).find((item) => item.email?.toLowerCase() === email.toLowerCase())
    if (!target) return false
    if (target.email_confirmed_at) return true
    const confirmResult = await serviceClient.auth.admin.updateUserById(target.id, {
      email_confirm: true,
    })
    return !confirmResult.error
  } catch {
    return false
  }
}

async function signInAndBootstrap(email: string, password: string) {
  const authClient = createSupabaseAuthClient()
  const loginResult = await authClient.auth.signInWithPassword({ email, password })
  if (loginResult.error || !loginResult.data.user || !loginResult.data.session) {
    return {
      ok: false as const,
      status: 401,
      message: loginResult.error?.message ?? "登录失败，请检查邮箱和密码。",
      response: null as NextResponse | null,
    }
  }

  const finished = await finishAuthSession(loginResult.data.user, loginResult.data.session, {
    provider: "email",
  })
  if (!finished.ok) {
    console.error(finished.error)
    return {
      ok: false as const,
      status: 502,
      message: "登录成功，但初始化用户数据失败。",
      response: finished.response,
    }
  }

  return {
    ok: true as const,
    status: 200,
    message: "",
    response: finished.response,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AuthPayload
    const email = body.email?.trim()
    const password = body.password?.trim()

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: { message: "Email and password are required." } },
        { status: 400 },
      )
    }

    const authClient = createSupabaseAuthClient()
    const signupResult = await authClient.auth.signUp({ email, password })

    if (signupResult.error) {
      console.error(signupResult.error)
      const maybeExistsOrRateLimit =
        isAlreadyRegistered(signupResult.error.message) || isEmailRateLimited(signupResult.error.message)
      if (maybeExistsOrRateLimit) {
        // Product validation phase: if account exists / signup is rate-limited, try direct login.
        await tryAutoConfirmByEmail(email)
        const loginFallback = await signInAndBootstrap(email, password)
        if (loginFallback.ok && loginFallback.response) {
          return loginFallback.response
        }
        if (isEmailRateLimited(signupResult.error.message)) {
          return NextResponse.json(
            {
              ok: false,
              error: {
                message:
                  "当前注册过于频繁。若你刚刚注册过，请直接点“去登录”使用同一邮箱密码登录。",
              },
            },
            { status: 429 },
          )
        }
      }
      return NextResponse.json(
        { ok: false, error: { message: signupResult.error.message } },
        { status: 400 },
      )
    }

    const user = signupResult.data.user
    const session = signupResult.data.session
    if (!user || !session) {
      // Signup succeeded but no session: usually email confirmation is enabled.
      // Try auto-confirm + direct login for testing experience.
      await tryAutoConfirmByEmail(email)
      const loginFallback = await signInAndBootstrap(email, password)
      if (loginFallback.ok && loginFallback.response) {
        return loginFallback.response
      }
      return NextResponse.json(
        {
          ok: false,
          error: {
            message:
              "注册成功但未自动登录。请检查 Supabase 邮箱确认设置，或直接点击“去登录”。",
          },
        },
        { status: 401 },
      )
    }

    const finished = await finishAuthSession(user, session, { provider: "email" })
    if (!finished.ok) {
      console.error(finished.error)
      return finished.response
    }
    return finished.response
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown server error" } },
      { status: 503 },
    )
  }
}

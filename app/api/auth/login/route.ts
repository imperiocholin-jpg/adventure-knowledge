import { NextRequest, NextResponse } from "next/server"

import { finishAuthSession } from "@/lib/auth/finish-auth-session"
import { createSupabaseAuthClient, createSupabaseServiceClient } from "@/lib/auth/server"

interface AuthPayload {
  email?: string
  password?: string
}

function isEmailNotConfirmed(message?: string) {
  if (!message) return false
  return message.toLowerCase().includes("email not confirmed")
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
    let loginResult = await authClient.auth.signInWithPassword({ email, password })

    if (loginResult.error && isEmailNotConfirmed(loginResult.error.message)) {
      // Product validation phase: auto-confirm then retry login to unblock体验.
      await tryAutoConfirmByEmail(email)
      loginResult = await authClient.auth.signInWithPassword({ email, password })
    }

    if (loginResult.error || !loginResult.data.user || !loginResult.data.session) {
      if (loginResult.error) console.error(loginResult.error)
      const message =
        loginResult.error?.message === "Email not confirmed"
          ? "邮箱尚未确认。请稍后重试，或返回注册页重新操作。"
          : loginResult.error?.message ?? "Invalid credentials."
      return NextResponse.json(
        { ok: false, error: { message } },
        { status: 401 },
      )
    }

    const finished = await finishAuthSession(loginResult.data.user, loginResult.data.session, {
      provider: "email",
    })
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

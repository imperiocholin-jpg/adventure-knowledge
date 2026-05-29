import { NextResponse } from "next/server"
import type { Session, User } from "@supabase/supabase-js"

import { ensureUserBootstrap } from "@/lib/auth/bootstrap"
import { setAuthCookies } from "@/lib/auth/server"
import { syncOnboardingCompletionFlags } from "@/lib/auth/sync-onboarding-status"
import type { AuthProvider, AuthSessionPayload } from "@/lib/auth/types"

interface FinishAuthSessionOptions {
  provider?: AuthProvider
  /** 为 true 时在 JSON 中附带 token（微信小程序 / 原生 App） */
  exposeTokensInBody?: boolean
}

export async function finishAuthSession(
  user: User,
  session: Session,
  options: FinishAuthSessionOptions = {},
) {
  const provider = options.provider ?? "email"
  const bootstrap = await ensureUserBootstrap(user)
  if (!bootstrap.ok) {
    return {
      ok: false as const,
      error: bootstrap.error,
      response: NextResponse.json(
        { ok: false, error: { message: "用户数据初始化失败。" } },
        { status: 502 },
      ),
    }
  }

  await syncOnboardingCompletionFlags(user.id)

  const payload: AuthSessionPayload = {
    provider,
    user: {
      id: user.id,
      email: user.email ?? null,
    },
  }

  if (options.exposeTokensInBody) {
    payload.session = {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at,
    }
  }

  const response = NextResponse.json({ ok: true, data: payload })
  setAuthCookies(response, session)

  return { ok: true as const, response }
}

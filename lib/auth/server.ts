import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { createClient, type Session, type User } from "@supabase/supabase-js"

const ACCESS_TOKEN_COOKIE = "sb-access-token"
const REFRESH_TOKEN_COOKIE = "sb-refresh-token"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export function createSupabaseAuthClient() {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL")
  const anon = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  return createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

export function createSupabaseUserClient(accessToken: string) {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL")
  const anon = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
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

export function createSupabaseServiceClient() {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceRole = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")
  return createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function applyCookiePair(response: NextResponse, session: Session) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  })
  response.cookies.set(REFRESH_TOKEN_COOKIE, session.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  })
}

export function setAuthCookies(response: NextResponse, session: Session) {
  applyCookiePair(response, session)
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}

function getTokensFromRequest(request: NextRequest) {
  const authorization = request.headers.get("authorization")
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    const bearer = authorization.slice(7).trim()
    if (bearer) {
      return { accessToken: bearer, refreshToken: null }
    }
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? null
  return { accessToken, refreshToken }
}

export async function getRequestSessionUser(request: NextRequest) {
  const { accessToken, refreshToken } = getTokensFromRequest(request)
  if (!accessToken && !refreshToken) {
    return {
      user: null as User | null,
      accessToken: null as string | null,
      refreshedSession: null as Session | null,
    }
  }

  const authClient = createSupabaseAuthClient()

  if (accessToken) {
    const { data, error } = await authClient.auth.getUser(accessToken)
    if (!error && data.user) {
      return {
        user: data.user,
        accessToken,
        refreshedSession: null as Session | null,
      }
    }
  }

  if (refreshToken) {
    const refreshResult = await authClient.auth.refreshSession({ refresh_token: refreshToken })
    if (!refreshResult.error && refreshResult.data.session) {
      const nextSession = refreshResult.data.session
      const { data: userData } = await authClient.auth.getUser(nextSession.access_token)
      if (userData.user) {
        return {
          user: userData.user,
          accessToken: nextSession.access_token,
          refreshedSession: nextSession,
        }
      }
    }
  }

  return {
    user: null as User | null,
    accessToken: null as string | null,
    refreshedSession: null as Session | null,
  }
}

export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json(
    {
      ok: false,
      source: "auth",
      error: { message },
    },
    { status: 401 },
  )
}

export async function getServerCookieSessionTokens() {
  const store = await cookies()
  return {
    accessToken: store.get(ACCESS_TOKEN_COOKIE)?.value ?? null,
    refreshToken: store.get(REFRESH_TOKEN_COOKIE)?.value ?? null,
  }
}

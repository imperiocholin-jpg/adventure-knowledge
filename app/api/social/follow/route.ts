import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"

interface FollowPayload {
  userId?: string
}

export const dynamic = "force-dynamic"

async function assertUserFollowsReady(supabase: ReturnType<typeof createSupabaseServiceClient>) {
  const probe = await supabase.from("user_follows").select("id").limit(1)
  if (!probe.error) return null

  const code = probe.error.code ?? ""
  const message = probe.error.message ?? ""
  if (code === "PGRST205" || code === "42P01" || message.includes("user_follows")) {
    return "关注功能尚未初始化。请在 Supabase SQL Editor 执行 supabase/scripts/apply-social-migration.sql"
  }
  return message || "关注服务不可用"
}

export async function POST(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user) return unauthorizedResponse("User is not authenticated.")

    const body = (await request.json()) as FollowPayload
    const targetId = typeof body.userId === "string" ? body.userId.trim() : ""
    if (!targetId) {
      return NextResponse.json({ ok: false, error: { message: "请指定要关注的用户。" } }, { status: 400 })
    }
    if (targetId === sessionState.user.id) {
      return NextResponse.json({ ok: false, error: { message: "不能关注自己。" } }, { status: 400 })
    }

    const supabase = createSupabaseServiceClient()
    const tableError = await assertUserFollowsReady(supabase)
    if (tableError) {
      return NextResponse.json({ ok: false, error: { message: tableError } }, { status: 503 })
    }

    const { error } = await supabase.from("user_follows").insert({
      follower_id: sessionState.user.id,
      following_id: targetId,
    })

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, data: { alreadyFollowing: true } })
      }
      return NextResponse.json({ ok: false, error: { message: error.message } }, { status: 502 })
    }

    const response = NextResponse.json({ ok: true, data: { following: true } })
    if (sessionState.refreshedSession) setAuthCookies(response, sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown server error" } },
      { status: 503 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user) return unauthorizedResponse("User is not authenticated.")

    const targetId = request.nextUrl.searchParams.get("userId")?.trim() ?? ""
    if (!targetId) {
      return NextResponse.json({ ok: false, error: { message: "请指定要取消关注的用户。" } }, { status: 400 })
    }

    const supabase = createSupabaseServiceClient()
    const tableError = await assertUserFollowsReady(supabase)
    if (tableError) {
      return NextResponse.json({ ok: false, error: { message: tableError } }, { status: 503 })
    }

    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", sessionState.user.id)
      .eq("following_id", targetId)

    if (error) {
      return NextResponse.json({ ok: false, error: { message: error.message } }, { status: 502 })
    }

    const response = NextResponse.json({ ok: true, data: { following: false } })
    if (sessionState.refreshedSession) setAuthCookies(response, sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown server error" } },
      { status: 503 },
    )
  }
}

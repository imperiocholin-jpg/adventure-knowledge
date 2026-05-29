import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import {
  listUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  toAppNotification,
} from "@/lib/notifications/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user) return unauthorizedResponse("User is not authenticated.")

    const serviceClient = createSupabaseServiceClient()
    const result = await listUserNotifications(serviceClient, sessionState.user.id)
    const items = result.items.map(toAppNotification)

    const response = NextResponse.json({
      ok: true,
      data: {
        items,
        unreadCount: result.unreadCount,
      },
    })
    if (sessionState.refreshedSession) setAuthCookies(response, sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown server error" } },
      { status: 503 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user) return unauthorizedResponse("User is not authenticated.")

    const body = (await request.json().catch(() => ({}))) as { id?: string; all?: boolean }
    const serviceClient = createSupabaseServiceClient()

    if (body.all) {
      await markAllNotificationsRead(serviceClient, sessionState.user.id)
    } else if (typeof body.id === "string" && body.id) {
      await markNotificationRead(serviceClient, sessionState.user.id, body.id)
    } else {
      return NextResponse.json({ ok: false, error: { message: "请提供 id 或 all: true。" } }, { status: 400 })
    }

    const result = await listUserNotifications(serviceClient, sessionState.user.id)
    const response = NextResponse.json({
      ok: true,
      data: {
        items: result.items.map(toAppNotification),
        unreadCount: result.unreadCount,
      },
    })
    if (sessionState.refreshedSession) setAuthCookies(response, sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown server error" } },
      { status: 503 },
    )
  }
}

import { NextRequest, NextResponse } from "next/server"

import { writeAdminAuditLog } from "@/lib/admin/audit-log"
import { createSockUsersBatch } from "@/lib/admin/user-lifecycle"
import { buildXiamenSockPresets } from "@/lib/admin/xiamen-sock-presets"
import { setAuthCookies } from "@/lib/auth/server"
import { requireAdminApi } from "@/lib/auth/require-admin"

export const dynamic = "force-dynamic"

interface BatchBody {
  count?: number
  password?: string
  preset?: "xiamen"
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const body = (await request.json().catch(() => ({}))) as BatchBody
    const count = Math.min(20, Math.max(1, Number(body.count ?? 10) || 10))
    const password = typeof body.password === "string" && body.password.length >= 6 ? body.password : "Test123456"

    const presets =
      body.preset === "xiamen" || body.preset === undefined
        ? buildXiamenSockPresets(count, password)
        : buildXiamenSockPresets(count, password)

    const result = await createSockUsersBatch(admin.serviceClient, presets)

    await writeAdminAuditLog(admin.serviceClient, {
      adminUserId: admin.adminUserId,
      action: "batch_create_users",
      targetType: "user",
      targetId: "batch",
      payload: { count, created: result.created.length, failed: result.failed.length },
    })

    const response = NextResponse.json({
      ok: true,
      data: {
        created: result.created,
        failed: result.failed,
        password,
      },
    })
    if (admin.sessionState.refreshedSession) {
      setAuthCookies(response, admin.sessionState.refreshedSession)
    }
    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown error" } },
      { status: 503 },
    )
  }
}

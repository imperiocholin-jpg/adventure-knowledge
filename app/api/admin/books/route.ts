import { NextRequest, NextResponse } from "next/server"

import { listAdminLocalBooks } from "@/lib/admin/local-books-admin"
import { setAuthCookies } from "@/lib/auth/server"
import { requireAdminApi } from "@/lib/auth/require-admin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1)
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? "30") || 30))

    const result = await listAdminLocalBooks({
      filters: {
        title: url.searchParams.get("title") ?? url.searchParams.get("q") ?? "",
        grade: url.searchParams.get("grade") ?? "",
        regionId: url.searchParams.get("regionId") ?? "",
        chapterCount: url.searchParams.get("chapterCount") ?? "",
        status: url.searchParams.get("status") ?? "",
      },
      page,
      pageSize,
    })

    const response = NextResponse.json({
      ok: true,
      data: {
        items: result.items,
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        source: "data/local-book-manifest.json",
      },
    })
    if (admin.sessionState.refreshedSession) setAuthCookies(response, admin.sessionState.refreshedSession)
    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown error" } },
      { status: 503 },
    )
  }
}

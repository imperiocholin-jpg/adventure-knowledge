import { NextRequest, NextResponse } from "next/server"

import { getNumber, getString } from "@/lib/admin/record-fields"
import { setAuthCookies } from "@/lib/auth/server"
import { requireAdminApi } from "@/lib/auth/require-admin"

type GenericRecord = Record<string, unknown>

const STATUS_OPTIONS = new Set(["draft", "approved", "needs_rewrite", "rejected", "published"])

function asStringArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item))
  if (typeof value === "string" && value.trim()) return value.split("|").map((item) => item.trim()).filter(Boolean)
  return []
}

function summarizeQuestion(row: GenericRecord) {
  return {
    id: getString(row, ["id"]),
    bookId: getString(row, ["book_id"]),
    chapterId: getString(row, ["chapter_id"]),
    regionId: getString(row, ["region_id"]) || null,
    questionType: getString(row, ["question_type"]),
    prompt: getString(row, ["prompt"]),
    options: asStringArray(row.options),
    answerIndex: row.answer_index === null || row.answer_index === undefined ? null : getNumber(row, ["answer_index"], 0),
    answerText: getString(row, ["answer_text"]),
    answerRubric: asStringArray(row.answer_rubric),
    successResponse: getString(row, ["success_response"]),
    retryResponse: getString(row, ["retry_response"]),
    sourceLabel: getString(row, ["source_label"]),
    sourceExcerpt: getString(row, ["source_excerpt"]),
    difficulty: getNumber(row, ["difficulty"], 1),
    status: getString(row, ["status"], "draft"),
    reviewer: getString(row, ["reviewer"]) || null,
    reviewNotes: getString(row, ["review_notes"]),
    createdAt: getString(row, ["created_at"]) || null,
    updatedAt: getString(row, ["updated_at"]) || null,
  }
}

function normalizeUpdatePayload(body: GenericRecord, reviewer: string | null) {
  const payload: GenericRecord = {}

  if (typeof body.prompt === "string") payload.prompt = body.prompt.trim()
  if (Array.isArray(body.options)) payload.options = body.options.map((item) => String(item).trim()).filter(Boolean)
  if (body.answerIndex === null) payload.answer_index = null
  if (body.answerIndex !== undefined && body.answerIndex !== null) {
    const answerIndex = Number(body.answerIndex)
    if (Number.isFinite(answerIndex)) payload.answer_index = Math.floor(answerIndex)
  }
  if (typeof body.answerText === "string") payload.answer_text = body.answerText.trim()
  if (Array.isArray(body.answerRubric)) payload.answer_rubric = body.answerRubric.map((item) => String(item).trim()).filter(Boolean)
  if (typeof body.successResponse === "string") payload.success_response = body.successResponse.trim()
  if (typeof body.retryResponse === "string") payload.retry_response = body.retryResponse.trim()
  if (typeof body.sourceExcerpt === "string") payload.source_excerpt = body.sourceExcerpt.trim()
  if (typeof body.reviewNotes === "string") payload.review_notes = body.reviewNotes.trim()
  if (typeof body.status === "string") {
    if (!STATUS_OPTIONS.has(body.status)) throw new Error("Invalid question status.")
    payload.status = body.status
  }
  const difficulty = Number(body.difficulty)
  if (Number.isFinite(difficulty)) payload.difficulty = Math.max(1, Math.min(5, Math.floor(difficulty)))

  if ("status" in payload || "review_notes" in payload) payload.reviewer = reviewer
  payload.updated_at = new Date().toISOString()
  return payload
}

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const url = new URL(request.url)
    const status = url.searchParams.get("status") ?? "draft"
    const q = (url.searchParams.get("q") ?? "").trim()
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1)
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? "30") || 30))
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = admin.serviceClient
      .from("challenge_questions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: true })

    if (status !== "all") query = query.eq("status", status)
    if (q) {
      query = query.or(
        `prompt.ilike.%${q}%,source_label.ilike.%${q}%,book_id.ilike.%${q}%,chapter_id.ilike.%${q}%`,
      )
    }

    const result = await query.range(from, to)
    if (result.error) {
      return NextResponse.json({ ok: false, error: { message: result.error.message } }, { status: 502 })
    }

    const response = NextResponse.json({
      ok: true,
      data: {
        items: ((result.data ?? []) as GenericRecord[]).map(summarizeQuestion),
        page,
        pageSize,
        total: result.count ?? result.data?.length ?? 0,
      },
    })
    if (admin.sessionState.refreshedSession) setAuthCookies(response, admin.sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown error" } },
      { status: 503 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const body = (await request.json()) as GenericRecord
    const id = typeof body.id === "string" ? body.id : ""
    if (!id) return NextResponse.json({ ok: false, error: { message: "Missing question id." } }, { status: 400 })

    const payload = normalizeUpdatePayload(body, admin.sessionState.user?.email ?? admin.adminUserId)
    const result = await admin.serviceClient
      .from("challenge_questions")
      .update(payload)
      .eq("id", id)
      .select("*")
      .limit(1)

    if (result.error) {
      return NextResponse.json({ ok: false, error: { message: result.error.message } }, { status: 502 })
    }
    const row = result.data?.[0]
    if (!row) return NextResponse.json({ ok: false, error: { message: "Question not found." } }, { status: 404 })

    const response = NextResponse.json({ ok: true, data: { item: summarizeQuestion(row as GenericRecord) } })
    if (admin.sessionState.refreshedSession) setAuthCookies(response, admin.sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown error" } },
      { status: 400 },
    )
  }
}

import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  createSupabaseUserClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { findExistingColumn, findExistingColumns } from "@/lib/data/schema-compat"
import { getDefaultEquippedIds, parseEquippedIds } from "@/lib/pets/equipment"

type GenericRecord = Record<string, unknown>

interface SaveEquipmentPayload {
  equippedIds?: unknown
}

const EQUIPMENT_FIELD_CANDIDATES = [
  "pet_equipment_ids",
  "equipment_ids",
  "pet_loadout",
  "loadout",
]

function extractStoredIds(raw: unknown) {
  if (Array.isArray(raw)) return parseEquippedIds(raw)
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown
      return parseEquippedIds(parsed)
    } catch {
      return parseEquippedIds(raw.split(",").map((item) => item.trim()).filter(Boolean))
    }
  }
  return getDefaultEquippedIds()
}

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")

    const supabase = createSupabaseUserClient(sessionState.accessToken)
    const serviceClient = createSupabaseServiceClient()

    const ownerField = await findExistingColumn(serviceClient, "pets", [
      "user_id",
      "uid",
      "owner_id",
      "auth_user_id",
    ])
    if (!ownerField) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: "pets 表缺少用户归属字段。" },
        },
        { status: 422 },
      )
    }

    const equipmentField = await findExistingColumn(serviceClient, "pets", EQUIPMENT_FIELD_CANDIDATES)
    if (!equipmentField) {
      const response = NextResponse.json({
        ok: true,
        data: {
          equippedIds: getDefaultEquippedIds(),
          canPersist: false,
          hasStoredData: false,
          field: null,
        },
      })
      if (sessionState.refreshedSession) setAuthCookies(response, sessionState.refreshedSession)
      return response
    }

    const petResult = await supabase.from("pets").select("*").eq(ownerField, sessionState.user.id).limit(1).maybeSingle()
    if (petResult.error || !petResult.data) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: petResult.error?.message ?? "未找到宠物记录。" },
        },
        { status: 404 },
      )
    }

    const row = petResult.data as GenericRecord
    const raw = row[equipmentField]
    const hasStoredData = raw !== null && raw !== undefined && String(raw).trim() !== ""
    const equippedIds = hasStoredData ? extractStoredIds(raw) : getDefaultEquippedIds()

    const response = NextResponse.json({
      ok: true,
      data: {
        equippedIds,
        canPersist: true,
        hasStoredData,
        field: equipmentField,
      },
    })
    if (sessionState.refreshedSession) setAuthCookies(response, sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: { message: error instanceof Error ? error.message : "Unknown server error" },
      },
      { status: 503 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")

    const body = (await request.json()) as SaveEquipmentPayload
    const equippedIds = parseEquippedIds(body.equippedIds)

    const supabase = createSupabaseUserClient(sessionState.accessToken)
    const serviceClient = createSupabaseServiceClient()

    const ownerField = await findExistingColumn(serviceClient, "pets", [
      "user_id",
      "uid",
      "owner_id",
      "auth_user_id",
    ])
    if (!ownerField) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: "pets 表缺少用户归属字段。" },
        },
        { status: 422 },
      )
    }

    const existingColumns = await findExistingColumns(serviceClient, "pets", [
      "id",
      "pet_id",
      ...EQUIPMENT_FIELD_CANDIDATES,
      "updated_at",
    ])
    const idField = existingColumns.includes("id") ? "id" : existingColumns.includes("pet_id") ? "pet_id" : null
    const equipmentField = EQUIPMENT_FIELD_CANDIDATES.find((field) => existingColumns.includes(field)) ?? null
    if (!idField || !equipmentField) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: "pets 表缺少装备字段，无法保存装备配置。" },
        },
        { status: 422 },
      )
    }

    const petResult = await supabase.from("pets").select("*").eq(ownerField, sessionState.user.id).limit(1).maybeSingle()
    if (petResult.error || !petResult.data) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: petResult.error?.message ?? "未找到宠物记录。" },
        },
        { status: 404 },
      )
    }

    const row = petResult.data as GenericRecord
    const updatePayload: GenericRecord = {
      [equipmentField]: equippedIds,
    }
    if (existingColumns.includes("updated_at")) updatePayload.updated_at = new Date().toISOString()

    let updateResult = await supabase.from("pets").update(updatePayload).eq(idField, row[idField]).select("*").limit(1)
    if (updateResult.error) {
      // 兼容 text 字段：回退为 JSON 字符串存储
      updatePayload[equipmentField] = JSON.stringify(equippedIds)
      updateResult = await supabase.from("pets").update(updatePayload).eq(idField, row[idField]).select("*").limit(1)
    }

    if (updateResult.error) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: updateResult.error.message },
        },
        { status: 502 },
      )
    }

    const response = NextResponse.json({
      ok: true,
      data: {
        equippedIds,
        pet: updateResult.data?.[0] ?? null,
      },
    })
    if (sessionState.refreshedSession) setAuthCookies(response, sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: { message: error instanceof Error ? error.message : "Unknown server error" },
      },
      { status: 503 },
    )
  }
}

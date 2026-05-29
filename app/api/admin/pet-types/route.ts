import { NextRequest, NextResponse } from "next/server"

import { writeAdminAuditLog } from "@/lib/admin/audit-log"
import { scanAllPetTypeAssets } from "@/lib/admin/pet-type-assets"
import {
  addCustomPetType,
  disableBuiltinPetType,
  listAdminPetTypes,
  removeCustomPetType,
  restoreBuiltinPetType,
  type CustomPetTypeRecord,
} from "@/lib/admin/pet-type-store"
import { setAuthCookies } from "@/lib/auth/server"
import { requireAdminApi } from "@/lib/auth/require-admin"
import type { PetSpecies } from "@/lib/pets/catalog"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const SPECIES_SET = new Set<PetSpecies>(["dog", "cat", "rabbit", "hamster", "bird", "pig", "turtle", "lizard"])

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const types = await listAdminPetTypes()
    const assets = await scanAllPetTypeAssets(types)

    const response = NextResponse.json({
      ok: true,
      data: {
        types,
        assets,
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

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const body = (await request.json()) as Partial<CustomPetTypeRecord>
    const id = typeof body.id === "string" ? body.id.trim() : ""
    const label = typeof body.label === "string" ? body.label.trim() : ""
    const breed = typeof body.breed === "string" ? body.breed.trim() : ""
    const species = body.species

    if (!id || !/^[a-zA-Z][a-zA-Z0-9_-]{1,31}$/.test(id)) {
      return NextResponse.json({ ok: false, error: { message: "ID 需为 2-32 位字母数字（字母开头）" } }, { status: 400 })
    }
    if (!label || !breed) {
      return NextResponse.json({ ok: false, error: { message: "请填写名称与品种" } }, { status: 400 })
    }
    if (!species || !SPECIES_SET.has(species)) {
      return NextResponse.json({ ok: false, error: { message: "无效物种" } }, { status: 400 })
    }

    const record: CustomPetTypeRecord = {
      id,
      label,
      breed,
      species,
      emoji: typeof body.emoji === "string" && body.emoji.trim() ? body.emoji.trim() : "🐾",
      imagePrefix: typeof body.imagePrefix === "string" ? body.imagePrefix.trim() : undefined,
      videoDir: typeof body.videoDir === "string" ? body.videoDir.trim() : undefined,
      videoPrefix: typeof body.videoPrefix === "string" ? body.videoPrefix.trim() : undefined,
    }

    await addCustomPetType(record)

    await writeAdminAuditLog(admin.serviceClient, {
      adminUserId: admin.adminUserId,
      action: "create_pet_type",
      targetType: "pet_type",
      targetId: id,
      payload: record as unknown as Record<string, unknown>,
    })

    const response = NextResponse.json({ ok: true, data: { item: record } })
    if (admin.sessionState.refreshedSession) setAuthCookies(response, admin.sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown error" } },
      { status: 400 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    const source = url.searchParams.get("source")
    if (!id) {
      return NextResponse.json({ ok: false, error: { message: "缺少宠物类型 id" } }, { status: 400 })
    }

    if (source === "custom") {
      await removeCustomPetType(id)
    } else {
      await disableBuiltinPetType(id)
    }

    await writeAdminAuditLog(admin.serviceClient, {
      adminUserId: admin.adminUserId,
      action: "delete_pet_type",
      targetType: "pet_type",
      targetId: id,
      payload: { source: source ?? "builtin" },
    })

    const response = NextResponse.json({ ok: true, data: { id } })
    if (admin.sessionState.refreshedSession) setAuthCookies(response, admin.sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown error" } },
      { status: 400 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request)
    if (!admin.ok) return admin.response

    const body = (await request.json()) as { id?: string; action?: "restore" }
    if (!body.id) {
      return NextResponse.json({ ok: false, error: { message: "缺少宠物类型 id" } }, { status: 400 })
    }
    if (body.action !== "restore") {
      return NextResponse.json({ ok: false, error: { message: "不支持的操作" } }, { status: 400 })
    }

    await restoreBuiltinPetType(body.id)

    const response = NextResponse.json({ ok: true, data: { id: body.id } })
    if (admin.sessionState.refreshedSession) setAuthCookies(response, admin.sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown error" } },
      { status: 400 },
    )
  }
}

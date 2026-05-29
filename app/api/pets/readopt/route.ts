import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { findExistingColumn, findExistingColumns } from "@/lib/data/schema-compat"
import { PET_BREEDS, PET_SPECIES_EMOJI, type PetSpecies } from "@/lib/pets/catalog"
import { DEFAULT_PET_VITAL, normalizeInventory, normalizePetState, writeVitalFieldsToPayload } from "@/lib/pets/state"

type GenericRecord = Record<string, unknown>

interface ReadoptPayload {
  petName?: string
  species?: PetSpecies
  breed?: string
}

function isValidSpecies(value: unknown): value is PetSpecies {
  return typeof value === "string" && value in PET_SPECIES_EMOJI
}

function normalizeName(value: unknown) {
  if (typeof value !== "string") return "毛毛"
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, 12) : "毛毛"
}

function normalizeBreed(species: PetSpecies, value: unknown) {
  const candidates = PET_BREEDS[species]
  if (typeof value === "string" && candidates.includes(value)) return value
  return candidates[0]
}

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")

    const body = (await request.json()) as ReadoptPayload
    if (!isValidSpecies(body.species)) {
      return NextResponse.json({ ok: false, error: { message: "请选择宠物类型。" } }, { status: 400 })
    }

    const petName = normalizeName(body.petName)
    const species = body.species
    const breed = normalizeBreed(species, body.breed)
    const emoji = PET_SPECIES_EMOJI[species]

    const serviceClient = createSupabaseServiceClient()
    const ownerField = await findExistingColumn(serviceClient, "pets", [
      "user_id",
      "uid",
      "owner_id",
      "auth_user_id",
    ])
    if (!ownerField) {
      return NextResponse.json({ ok: false, error: { message: "pets 表缺少用户归属字段。" } }, { status: 422 })
    }

    const columns = await findExistingColumns(serviceClient, "pets", [
      "id",
      "pet_id",
      "name",
      "pet_name",
      "emoji",
      "pet_emoji",
      "species",
      "pet_species",
      "breed",
      "pet_breed",
      "hunger",
      "pet_hunger",
      "spirit",
      "pet_spirit",
      "energy",
      "bond",
      "pet_bond",
      "happiness",
      "intimacy",
      "is_dead",
      "pet_dead",
      "dead_at",
      "pet_dead_at",
      "pet_inventory",
      "inventory",
      "pet_level",
      "level",
      "pet_exp",
      "exp",
      "life_stage",
      "last_daily_decay_date",
      "updated_at",
    ])

    const petResult = await serviceClient
      .from("pets")
      .select("*")
      .eq(ownerField, sessionState.user.id)
      .limit(1)
      .maybeSingle()

    if (petResult.error || !petResult.data) {
      return NextResponse.json(
        { ok: false, error: { message: petResult.error?.message ?? "未找到宠物记录。" } },
        { status: 404 },
      )
    }

    const petRow = petResult.data as GenericRecord
    const idField = columns.includes("id") ? "id" : columns.includes("pet_id") ? "pet_id" : null
    if (!idField) {
      return NextResponse.json({ ok: false, error: { message: "pets 表缺少主键字段。" } }, { status: 422 })
    }

    const freshState = normalizePetState({
      satiety: DEFAULT_PET_VITAL,
      spirit: DEFAULT_PET_VITAL,
      bond: DEFAULT_PET_VITAL,
      isDead: false,
      deadAt: null,
    })

    const inventoryField =
      ["pet_inventory", "inventory", "pet_loadout"].find((f) => columns.includes(f)) ?? null

    const payload: GenericRecord = {
      ...writeVitalFieldsToPayload(freshState, {
        satietyField: columns.includes("hunger") ? "hunger" : columns.includes("pet_hunger") ? "pet_hunger" : null,
        spiritField: columns.includes("spirit")
          ? "spirit"
          : columns.includes("pet_spirit")
            ? "pet_spirit"
            : columns.includes("energy")
              ? "energy"
              : null,
        bondField: columns.includes("bond")
          ? "bond"
          : columns.includes("pet_bond")
            ? "pet_bond"
            : columns.includes("happiness")
              ? "happiness"
              : null,
        deadField: columns.includes("is_dead") ? "is_dead" : columns.includes("pet_dead") ? "pet_dead" : null,
        deadAtField: columns.includes("dead_at") ? "dead_at" : columns.includes("pet_dead_at") ? "pet_dead_at" : null,
      }),
    }

    if (columns.includes("name")) payload.name = petName
    if (columns.includes("pet_name")) payload.pet_name = petName
    if (columns.includes("emoji")) payload.emoji = emoji
    if (columns.includes("pet_emoji")) payload.pet_emoji = emoji
    if (columns.includes("species")) payload.species = species
    if (columns.includes("pet_species")) payload.pet_species = species
    if (columns.includes("breed")) payload.breed = breed
    if (columns.includes("pet_breed")) payload.pet_breed = breed
    if (columns.includes("pet_level")) payload.pet_level = 1
    if (columns.includes("level")) payload.level = 1
    if (columns.includes("pet_exp")) payload.pet_exp = 0
    if (columns.includes("exp")) payload.exp = 0
    if (columns.includes("life_stage")) payload.life_stage = "幼崽"
    if (inventoryField) payload[inventoryField] = {}
    if (columns.includes("last_daily_decay_date")) {
      payload.last_daily_decay_date = new Date().toISOString().slice(0, 10)
    }
    if (columns.includes("updated_at")) payload.updated_at = new Date().toISOString()

    const updateResult = await serviceClient
      .from("pets")
      .update(payload)
      .eq(idField, petRow[idField])
      .select("*")
      .limit(1)

    if (updateResult.error) {
      return NextResponse.json({ ok: false, error: { message: updateResult.error.message } }, { status: 502 })
    }

    const response = NextResponse.json({
      ok: true,
      data: {
        pet: updateResult.data?.[0] ?? null,
        state: freshState,
        inventory: normalizeInventory({}),
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

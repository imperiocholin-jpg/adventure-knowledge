import { NextRequest, NextResponse } from "next/server"

import {
  createSupabaseServiceClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { findExistingColumn, findExistingColumns } from "@/lib/data/schema-compat"
import { fetchPrimaryPetRow } from "@/lib/pets/fetch-primary-pet"
import { sortPetsWithPrimaryFirst } from "@/lib/pets/resolve-primary-pet"
import { PET_BREEDS, PET_SPECIES_EMOJI, type PetSpecies } from "@/lib/pets/catalog"
import { levelFromTotalExp } from "@/lib/pets/level-progress"
import { normalizeInventory, parsePetVitalsFromRecord } from "@/lib/pets/state"

function readPetTotalExp(record: Record<string, unknown>) {
  const raw = record.pet_exp ?? record.exp ?? record.experience ?? 0
  const n = Number(raw)
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
}

type GenericRecord = Record<string, unknown>

interface PatchPetPayload {
  petName?: string
  species?: PetSpecies
  breed?: string
}

function isValidSpecies(value: unknown): value is PetSpecies {
  return typeof value === "string" && value in PET_SPECIES_EMOJI
}

function normalizeName(value: unknown) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, 12)
}

function normalizeBreed(species: PetSpecies, value: unknown) {
  const candidates = PET_BREEDS[species]
  if (typeof value === "string" && candidates.includes(value)) return value
  return null
}

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")

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
          source: "server",
          table: "pets",
          error: { message: "pets table missing ownership field." },
          data: [],
        },
        { status: 422 },
      )
    }

    const { data, error } = await serviceClient.from("pets").select("*").eq(ownerField, sessionState.user.id)

    if (error) {
      console.error(error)
      return NextResponse.json(
        {
          ok: false,
          source: "supabase",
          table: "pets",
          error: {
            message: error.message,
            code: error.code ?? null,
            details: error.details ?? null,
            hint: error.hint ?? null,
          },
          data: [],
        },
        { status: 502 },
      )
    }

    const rawRows = (data ?? []) as Record<string, unknown>[]
    const sortedRows = sortPetsWithPrimaryFirst(rawRows)
    const firstPet = sortedRows[0]
    const totalExp = firstPet ? readPetTotalExp(firstPet) : 0
    const summary = firstPet
      ? {
          state: parsePetVitalsFromRecord(firstPet),
          petExp: totalExp,
          level: levelFromTotalExp(totalExp),
          inventory: normalizeInventory(
            firstPet.pet_inventory ??
              firstPet.inventory ??
              firstPet.pet_loadout ??
              firstPet.pet_equipment_ids ??
              firstPet.equipment_ids,
          ),
        }
      : null

    const response = NextResponse.json({ ok: true, data: sortedRows, summary })
    if (sessionState.refreshedSession) {
      setAuthCookies(response, sessionState.refreshedSession)
    }
    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      {
        ok: false,
        source: "server",
        table: "pets",
        error: {
          message: error instanceof Error ? error.message : "Unknown server error",
        },
        data: [],
      },
      { status: 503 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")

    const body = (await request.json()) as PatchPetPayload
    const petName = normalizeName(body.petName)
    const species = isValidSpecies(body.species) ? body.species : null
    const breed = species ? normalizeBreed(species, body.breed) : null

    if (!petName && !species && !breed) {
      return NextResponse.json({ ok: false, error: { message: "没有可更新的宠物字段。" } }, { status: 400 })
    }

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

    const existingColumns = await findExistingColumns(serviceClient, "pets", [
      "id",
      "pet_id",
      "name",
      "pet_name",
      "species",
      "pet_species",
      "breed",
      "pet_breed",
      "emoji",
      "pet_emoji",
      "updated_at",
    ])

    const { row: petRow } = await fetchPrimaryPetRow(serviceClient, sessionState.user.id)

    if (!petRow) {
      return NextResponse.json(
        { ok: false, error: { message: "未找到宠物记录。" } },
        { status: 404 },
      )
    }

    const idField = existingColumns.includes("id") ? "id" : existingColumns.includes("pet_id") ? "pet_id" : null
    if (!idField) {
      return NextResponse.json({ ok: false, error: { message: "pets 表缺少主键字段。" } }, { status: 422 })
    }

    const updatePayload: GenericRecord = {}
    if (petName) {
      if (existingColumns.includes("name")) updatePayload.name = petName
      if (existingColumns.includes("pet_name")) updatePayload.pet_name = petName
    }
    if (species) {
      if (existingColumns.includes("species")) updatePayload.species = species
      if (existingColumns.includes("pet_species")) updatePayload.pet_species = species
      const emoji = PET_SPECIES_EMOJI[species]
      if (existingColumns.includes("emoji")) updatePayload.emoji = emoji
      if (existingColumns.includes("pet_emoji")) updatePayload.pet_emoji = emoji
    }
    if (breed) {
      if (existingColumns.includes("breed")) updatePayload.breed = breed
      if (existingColumns.includes("pet_breed")) updatePayload.pet_breed = breed
    }
    if (existingColumns.includes("updated_at")) updatePayload.updated_at = new Date().toISOString()

    const updateResult = await serviceClient
      .from("pets")
      .update(updatePayload)
      .eq(idField, petRow[idField])
      .select("*")
      .limit(1)

    if (updateResult.error) {
      return NextResponse.json({ ok: false, error: { message: updateResult.error.message } }, { status: 502 })
    }

    const response = NextResponse.json({ ok: true, data: updateResult.data?.[0] ?? null })
    if (sessionState.refreshedSession) setAuthCookies(response, sessionState.refreshedSession)
    return response
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "Unknown server error" } },
      { status: 503 },
    )
  }
}

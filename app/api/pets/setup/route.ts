import { NextRequest, NextResponse } from "next/server"

import { ensureUserBootstrap } from "@/lib/auth/bootstrap"
import {
  createSupabaseServiceClient,
  getRequestSessionUser,
  setAuthCookies,
  unauthorizedResponse,
} from "@/lib/auth/server"
import { findExistingColumn, findExistingColumns } from "@/lib/data/schema-compat"
import { fetchPrimaryPetRow } from "@/lib/pets/fetch-primary-pet"
import { PET_BREEDS, PET_COLORS, PET_SPECIES_EMOJI, type PetSpecies } from "@/lib/pets/catalog"
import { DEFAULT_PET_VITAL } from "@/lib/pets/state"

type GenericRecord = Record<string, unknown>

interface SetupPayload {
  petName?: string
  species?: PetSpecies
  breed?: string
  color?: string
}

function toId(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value)
  return null
}

function isValidSpecies(value: unknown): value is PetSpecies {
  return typeof value === "string" && value in PET_SPECIES_EMOJI
}

function normalizeName(value: unknown) {
  if (typeof value !== "string") return "毛毛"
  const trimmed = value.trim()
  if (!trimmed) return "毛毛"
  return trimmed.slice(0, 12)
}

function normalizeBreed(species: PetSpecies, value: unknown) {
  const candidates = PET_BREEDS[species]
  if (typeof value === "string" && candidates.includes(value)) return value
  return candidates[0]
}

function normalizeColor(value: unknown) {
  if (typeof value !== "string") return PET_COLORS[0].id
  return PET_COLORS.some((item) => item.id === value) ? value : PET_COLORS[0].id
}

export async function POST(request: NextRequest) {
  try {
    const sessionState = await getRequestSessionUser(request)
    if (!sessionState.user || !sessionState.accessToken) return unauthorizedResponse("User is not authenticated.")

    const bootstrap = await ensureUserBootstrap(sessionState.user)
    if (!bootstrap.ok) {
      return NextResponse.json(
        { ok: false, error: { message: "用户初始化失败，无法创建宠物。" } },
        { status: 502 },
      )
    }

    const body = (await request.json()) as SetupPayload
    if (!isValidSpecies(body.species)) {
      return NextResponse.json(
        { ok: false, error: { message: "请选择宠物类型。" } },
        { status: 400 },
      )
    }

    const petName = normalizeName(body.petName)
    const species = body.species
    const breed = normalizeBreed(species, body.breed)
    const color = normalizeColor(body.color)
    const emoji = PET_SPECIES_EMOJI[species]

    const serviceClient = createSupabaseServiceClient()
    const ownerField = await findExistingColumn(serviceClient, "pets", [
      "user_id",
      "uid",
      "owner_id",
      "auth_user_id",
    ])
    if (!ownerField) {
      return NextResponse.json(
        { ok: false, error: { message: "pets 表缺少用户归属字段。" } },
        { status: 422 },
      )
    }

    const existingColumns = await findExistingColumns(serviceClient, "pets", [
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
      "color",
      "pet_color",
      "life_stage",
      "pet_setup_completed",
      "setup_completed",
      "pet_level",
      "pet_exp",
      "happiness",
      "energy",
      "hunger",
      "pet_hunger",
      "spirit",
      "pet_spirit",
      "bond",
      "pet_bond",
      "rarity",
      "mood",
      "created_at",
      "updated_at",
    ])

    const { row: existingPrimaryPet } = await fetchPrimaryPetRow(serviceClient, sessionState.user.id)
    let petRow = existingPrimaryPet as GenericRecord | null

    if (!petRow) {
      // 容错：当 bootstrap 未提前创建宠物记录时，setup 阶段直接补建，避免阻塞注册流程。
      const createPayload: GenericRecord = {
        [ownerField]: sessionState.user.id,
      }
      if (existingColumns.includes("name")) createPayload.name = petName
      if (existingColumns.includes("pet_name")) createPayload.pet_name = petName
      if (existingColumns.includes("emoji")) createPayload.emoji = emoji
      if (existingColumns.includes("pet_emoji")) createPayload.pet_emoji = emoji
      if (existingColumns.includes("species")) createPayload.species = species
      if (existingColumns.includes("pet_species")) createPayload.pet_species = species
      if (existingColumns.includes("breed")) createPayload.breed = breed
      if (existingColumns.includes("pet_breed")) createPayload.pet_breed = breed
      if (existingColumns.includes("color")) createPayload.color = color
      if (existingColumns.includes("pet_color")) createPayload.pet_color = color
      if (existingColumns.includes("life_stage")) createPayload.life_stage = "幼崽"
      if (existingColumns.includes("pet_setup_completed")) createPayload.pet_setup_completed = true
      if (existingColumns.includes("setup_completed")) createPayload.setup_completed = true
      if (existingColumns.includes("pet_level")) createPayload.pet_level = 1
      if (existingColumns.includes("pet_exp")) createPayload.pet_exp = 0
      if (existingColumns.includes("happiness")) createPayload.happiness = DEFAULT_PET_VITAL
      if (existingColumns.includes("energy")) createPayload.energy = DEFAULT_PET_VITAL
      if (existingColumns.includes("hunger")) createPayload.hunger = DEFAULT_PET_VITAL
      if (existingColumns.includes("pet_hunger")) createPayload.pet_hunger = DEFAULT_PET_VITAL
      if (existingColumns.includes("spirit")) createPayload.spirit = DEFAULT_PET_VITAL
      if (existingColumns.includes("pet_spirit")) createPayload.pet_spirit = DEFAULT_PET_VITAL
      if (existingColumns.includes("bond")) createPayload.bond = DEFAULT_PET_VITAL
      if (existingColumns.includes("pet_bond")) createPayload.pet_bond = DEFAULT_PET_VITAL
      if (existingColumns.includes("rarity")) createPayload.rarity = "epic"
      if (existingColumns.includes("mood")) createPayload.mood = 1
      if (existingColumns.includes("created_at")) createPayload.created_at = new Date().toISOString()
      if (existingColumns.includes("updated_at")) createPayload.updated_at = new Date().toISOString()

      const createResult = await serviceClient.from("pets").insert(createPayload).select("*").limit(1)
      if (createResult.error) {
        return NextResponse.json(
          { ok: false, error: { message: createResult.error.message } },
          { status: 502 },
        )
      }
      petRow = (createResult.data?.[0] ?? null) as GenericRecord | null
      if (!petRow) {
        return NextResponse.json(
          { ok: false, error: { message: "宠物记录创建成功但未返回数据，请重试。" } },
          { status: 502 },
        )
      }
    }

    const petIdField = ["id", "pet_id"].find((field) => field in petRow) ?? "id"
    const petId = toId(petRow[petIdField])
    if (!petId) {
      return NextResponse.json(
        { ok: false, error: { message: "宠物记录缺少主键，无法保存。" } },
        { status: 422 },
      )
    }

    const payload: GenericRecord = {}
    if (existingColumns.includes("name")) payload.name = petName
    if (existingColumns.includes("pet_name")) payload.pet_name = petName
    if (existingColumns.includes("emoji")) payload.emoji = emoji
    if (existingColumns.includes("pet_emoji")) payload.pet_emoji = emoji
    if (existingColumns.includes("species")) payload.species = species
    if (existingColumns.includes("pet_species")) payload.pet_species = species
    if (existingColumns.includes("breed")) payload.breed = breed
    if (existingColumns.includes("pet_breed")) payload.pet_breed = breed
    if (existingColumns.includes("color")) payload.color = color
    if (existingColumns.includes("pet_color")) payload.pet_color = color
    if (existingColumns.includes("life_stage")) payload.life_stage = "幼崽"
    if (existingColumns.includes("pet_setup_completed")) payload.pet_setup_completed = true
    if (existingColumns.includes("setup_completed")) payload.setup_completed = true
    if (existingColumns.includes("updated_at")) payload.updated_at = new Date().toISOString()

    const updateResult = await serviceClient.from("pets").update(payload).eq(petIdField, petId).select("*").limit(1)
    if (updateResult.error) {
      return NextResponse.json(
        { ok: false, error: { message: updateResult.error.message } },
        { status: 502 },
      )
    }

    const response = NextResponse.json({
      ok: true,
      data: {
        pet: updateResult.data?.[0] ?? null,
      },
    })
    if (sessionState.refreshedSession) {
      setAuthCookies(response, sessionState.refreshedSession)
    }
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


import { findExistingColumn } from "@/lib/data/schema-compat"
import { PET_SPECIES_LABEL } from "@/lib/pets/catalog"
import { readPetInventoryFromRow } from "@/lib/admin/pet-inventory"
import { resolvePetTypeFromRow } from "@/lib/pets/pet-type-options"
import type { PetTypeId } from "@/lib/pets/pet-profile"

type GenericRecord = Record<string, unknown>

export function resolveField(row: GenericRecord, candidates: string[]) {
  return candidates.find((field) => field in row)
}

export function getString(row: GenericRecord, candidates: string[], fallback = "") {
  const field = resolveField(row, candidates)
  if (!field) return fallback
  const value = row[field]
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return fallback
}

export function getNumber(row: GenericRecord, candidates: string[], fallback = 0) {
  const field = resolveField(row, candidates)
  if (!field) return fallback
  const n = Number(row[field])
  return Number.isFinite(n) ? n : fallback
}

export function getBoolean(row: GenericRecord, candidates: string[], fallback = false) {
  const field = resolveField(row, candidates)
  if (!field) return fallback
  return Boolean(row[field])
}

export async function resolveUsersOwnerField(serviceClient: any) {
  return findExistingColumn(serviceClient, "users", ["id", "user_id", "uid", "auth_user_id"])
}

export async function resolveUsersIdField(serviceClient: any) {
  return findExistingColumn(serviceClient, "users", ["id", "user_id"])
}

export async function resolvePetsOwnerField(serviceClient: any) {
  return findExistingColumn(serviceClient, "pets", ["user_id", "uid", "owner_id", "auth_user_id"])
}

export async function resolvePetsIdField(serviceClient: any) {
  return findExistingColumn(serviceClient, "pets", ["id", "pet_id"])
}

export async function resolveReadingOwnerField(serviceClient: any) {
  return findExistingColumn(serviceClient, "reading_records", [
    "user_id",
    "uid",
    "owner_id",
    "auth_user_id",
  ])
}

export async function resolveTasksOwnerField(serviceClient: any) {
  return findExistingColumn(serviceClient, "daily_tasks", ["user_id", "uid", "owner_id", "auth_user_id"])
}

export function summarizeUserRow(row: GenericRecord, emailOverride?: string | null) {
  const id = getString(row, ["id", "user_id", "uid"])
  const rowEmail = getString(row, ["email"])
  return {
    id,
    email: emailOverride ?? rowEmail,
    nickname: getString(row, ["nickname", "username", "name"], "冒险家"),
    role: getString(row, ["role"], "user"),
    schoolName: getString(row, ["school_name", "school"]) || null,
    gradeClass: getString(row, ["grade_class", "grade", "class_name"]) || null,
    age: (() => {
      const field = resolveField(row, ["age"])
      if (!field || row[field] === null || row[field] === undefined) return null
      const n = Number(row[field])
      return Number.isFinite(n) && n >= 5 && n <= 18 ? Math.floor(n) : null
    })(),
    coins: getNumber(row, ["coins", "gold", "coin_balance"]),
    level: getNumber(row, ["level", "user_level", "adventure_level"], 1),
    experience: getNumber(row, ["experience", "exp", "user_exp"]),
    dailyStreak: getNumber(row, ["daily_streak", "streak", "reading_streak"]),
    lastActiveDate: getString(row, ["last_active_date", "last_streak_date", "last_login_date"]) || null,
    battleWins: getNumber(row, ["battle_wins"]),
    createdAt: getString(row, ["created_at"]) || null,
    profileSetupCompleted: getBoolean(row, ["profile_setup_completed", "user_profile_setup_completed"]),
  }
}

export function summarizePetRow(row: GenericRecord) {
  const species = getString(row, ["species", "pet_species"])
  const breed = getString(row, ["breed", "pet_breed"])
  const petType = resolvePetTypeFromRow(species, breed)
  return {
    id: getString(row, ["id", "pet_id"]),
    name: getString(row, ["name", "pet_name"], "毛毛"),
    species,
    breed,
    petType: petType as PetTypeId,
    speciesLabel: species in PET_SPECIES_LABEL ? PET_SPECIES_LABEL[species as keyof typeof PET_SPECIES_LABEL] : species,
    hunger: getNumber(row, ["hunger"], 80),
    spirit: getNumber(row, ["spirit"], 80),
    bond: getNumber(row, ["bond"], 80),
    petExp: getNumber(row, ["pet_exp", "experience", "exp"]),
    petLevel: getNumber(row, ["pet_level", "level"], 1),
    lifeStage: getString(row, ["life_stage"], "幼崽"),
    isDead: getBoolean(row, ["is_dead"]),
    inventory: readPetInventoryFromRow(row),
    petSetupCompleted: getBoolean(row, ["pet_setup_completed", "setup_completed"]),
  }
}

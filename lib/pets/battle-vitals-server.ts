import type { SupabaseClient } from "@supabase/supabase-js"

import { findExistingColumn, findExistingColumns } from "@/lib/data/schema-compat"
import {
  BATTLE_SATIETY_COST,
  BATTLE_SPIRIT_COST,
  MIN_BOND_FOR_BATTLE,
  MIN_SATIETY_FOR_BATTLE,
  MIN_SPIRIT_FOR_BATTLE,
  normalizePetState,
  parsePetVitalsFromRecord,
  type PetVitalState,
} from "@/lib/pets/state"

export interface PetVitalColumnMap {
  idField: string
  hungerField: string | null
  spiritField: string | null
  bondField: string | null
  deadField: string | null
  deadAtField: string | null
  hasUpdatedAt: boolean
}

export async function resolvePetVitalColumns(serviceClient: SupabaseClient) {
  const ownerField = await findExistingColumn(serviceClient, "pets", ["user_id", "uid", "owner_id", "auth_user_id"])
  if (!ownerField) {
    return { ok: false as const, status: 422, message: "pets 表缺少用户归属字段。" }
  }

  const petColumns = await findExistingColumns(serviceClient, "pets", [
    "id",
    "pet_id",
    "hunger",
    "pet_hunger",
    "spirit",
    "pet_spirit",
    "bond",
    "pet_bond",
    "happiness",
    "intimacy",
    "energy",
    "is_dead",
    "pet_dead",
    "dead_at",
    "pet_dead_at",
    "updated_at",
  ])

  const idField = petColumns.includes("id") ? "id" : petColumns.includes("pet_id") ? "pet_id" : null
  if (!idField) {
    return { ok: false as const, status: 422, message: "pets 表缺少 id 字段。" }
  }

  return {
    ok: true as const,
    ownerField,
    columns: {
      idField,
      hungerField: petColumns.includes("hunger") ? "hunger" : petColumns.includes("pet_hunger") ? "pet_hunger" : null,
      spiritField: petColumns.includes("spirit")
        ? "spirit"
        : petColumns.includes("pet_spirit")
          ? "pet_spirit"
          : petColumns.includes("energy")
            ? "energy"
            : null,
      bondField: petColumns.includes("bond")
        ? "bond"
        : petColumns.includes("pet_bond")
          ? "pet_bond"
          : petColumns.includes("happiness")
            ? "happiness"
            : petColumns.includes("intimacy")
              ? "intimacy"
              : null,
      deadField: petColumns.includes("is_dead") ? "is_dead" : petColumns.includes("pet_dead") ? "pet_dead" : null,
      deadAtField: petColumns.includes("dead_at")
        ? "dead_at"
        : petColumns.includes("pet_dead_at")
          ? "pet_dead_at"
          : null,
      hasUpdatedAt: petColumns.includes("updated_at"),
    } satisfies PetVitalColumnMap,
  }
}

export function assertCanEnterBattle(vitals: PetVitalState) {
  if (vitals.isDead) return { ok: false as const, message: "宠物已离世，无法参与战斗。" }
  if (vitals.satiety < MIN_SATIETY_FOR_BATTLE) {
    return { ok: false as const, message: `饱食度需 ≥ ${MIN_SATIETY_FOR_BATTLE} 才可对战。` }
  }
  if (vitals.spirit < MIN_SPIRIT_FOR_BATTLE) {
    return { ok: false as const, message: `精神值需 ≥ ${MIN_SPIRIT_FOR_BATTLE} 才可对战。` }
  }
  if (vitals.bond < MIN_BOND_FOR_BATTLE) {
    return { ok: false as const, message: `亲密值需 ≥ ${MIN_BOND_FOR_BATTLE} 才可对战。` }
  }
  return { ok: true as const, message: null }
}

export function buildVitalUpdatePayload(columns: PetVitalColumnMap, vitals: PetVitalState): Record<string, unknown> {
  const updatePayload: Record<string, unknown> = {}
  if (columns.hungerField) updatePayload[columns.hungerField] = vitals.satiety
  if (columns.spiritField) updatePayload[columns.spiritField] = vitals.spirit
  if (columns.bondField) updatePayload[columns.bondField] = vitals.bond
  if (columns.deadField) updatePayload[columns.deadField] = vitals.isDead
  if (columns.deadAtField) updatePayload[columns.deadAtField] = vitals.deadAt
  if (columns.hasUpdatedAt) updatePayload.updated_at = new Date().toISOString()
  return updatePayload
}

export function applyBattleVitalDeduction(
  vitals: PetVitalState,
  consumeSatiety = BATTLE_SATIETY_COST,
  consumeSpirit = BATTLE_SPIRIT_COST,
) {
  return normalizePetState({
    satiety: vitals.satiety - consumeSatiety,
    spirit: vitals.spirit - consumeSpirit,
    bond: vitals.bond,
    isDead: vitals.isDead,
    deadAt: vitals.deadAt,
  })
}

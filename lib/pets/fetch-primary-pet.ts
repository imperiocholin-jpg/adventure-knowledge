import { findExistingColumn } from "@/lib/data/schema-compat"
import { resolvePrimaryPetRow } from "@/lib/pets/resolve-primary-pet"

type GenericRecord = Record<string, unknown>

/** 读取用户全部宠物并选出主宠物（避免 limit(1) 误取 bootstrap 占位记录） */
export async function fetchUserPetRows(serviceClient: any, userId: string) {
  const ownerField = await findExistingColumn(serviceClient, "pets", [
    "user_id",
    "uid",
    "owner_id",
    "auth_user_id",
  ])
  if (!ownerField) return { ownerField: null, rows: [] as GenericRecord[] }

  const result = await serviceClient.from("pets").select("*").eq(ownerField, userId).limit(20)
  if (result.error) return { ownerField, rows: [] as GenericRecord[], error: result.error }

  return { ownerField, rows: (result.data ?? []) as GenericRecord[] }
}

export async function fetchPrimaryPetRow(serviceClient: any, userId: string) {
  const { ownerField, rows, error } = await fetchUserPetRows(serviceClient, userId)
  return {
    ownerField,
    row: resolvePrimaryPetRow(rows),
    rows,
    error,
  }
}

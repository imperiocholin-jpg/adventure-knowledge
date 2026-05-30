import { readJsonFile, writeJsonFile } from "@/lib/admin/file-store"
import { PET_BREEDS, PET_SPECIES_EMOJI, PET_SPECIES_LABEL, type PetSpecies } from "@/lib/pets/catalog"
import { PET_TYPE_TO_BREED, PET_TYPE_TO_SPECIES, type PetTypeId } from "@/lib/pets/pet-profile"
import { PET_TYPE_OPTIONS, type PetTypeOption } from "@/lib/pets/pet-type-options"

const PET_TYPES_FILE = "pet-types.json"

export interface CustomPetTypeRecord {
  id: string
  label: string
  species: PetSpecies
  breed: string
  emoji: string
  imagePrefix?: string
  videoDir?: string
  videoPrefix?: string
}

interface PetTypesFile {
  disabledIds: string[]
  customTypes: CustomPetTypeRecord[]
  updatedAt: string
}

export interface AdminPetTypeRecord extends PetTypeOption {
  source: "builtin" | "custom"
  disabled: boolean
  imagePrefix?: string
  videoDir?: string
  videoPrefix?: string
}

const EMPTY_FILE: Omit<PetTypesFile, "updatedAt"> = {
  disabledIds: [],
  customTypes: [],
}

export async function readPetTypesFile() {
  const file = await readJsonFile<PetTypesFile | null>(PET_TYPES_FILE, null)
  if (!file) return { ...EMPTY_FILE, updatedAt: null }
  return {
    disabledIds: Array.isArray(file.disabledIds) ? file.disabledIds : [],
    customTypes: Array.isArray(file.customTypes) ? file.customTypes : [],
    updatedAt: file.updatedAt ?? null,
  }
}

export async function listAdminPetTypes(): Promise<AdminPetTypeRecord[]> {
  const file = await readPetTypesFile()
  const disabledSet = new Set(file.disabledIds)

  const builtin: AdminPetTypeRecord[] = PET_TYPE_OPTIONS.map((option) => ({
    ...option,
    source: "builtin" as const,
    disabled: disabledSet.has(option.id),
  }))

  const custom: AdminPetTypeRecord[] = file.customTypes.map((item) => ({
    id: item.id as PetTypeId,
    label: item.label,
    species: item.species,
    speciesLabel: PET_SPECIES_LABEL[item.species],
    emoji: item.emoji || PET_SPECIES_EMOJI[item.species],
    source: "custom" as const,
    disabled: false,
    imagePrefix: item.imagePrefix,
    videoDir: item.videoDir,
    videoPrefix: item.videoPrefix,
  }))

  return [...builtin, ...custom]
}

export async function addCustomPetType(record: CustomPetTypeRecord) {
  const file = await readPetTypesFile()
  const builtinIds = new Set(Object.keys(PET_TYPE_TO_SPECIES))
  if (builtinIds.has(record.id) || file.customTypes.some((item) => item.id === record.id)) {
    throw new Error("宠物类型 ID 已存在")
  }

  file.customTypes.push(record)
  file.disabledIds = file.disabledIds.filter((id) => id !== record.id)
  await writeJsonFile(PET_TYPES_FILE, {
    ...file,
    updatedAt: new Date().toISOString(),
  } satisfies PetTypesFile)
}

export async function disableBuiltinPetType(id: string) {
  const file = await readPetTypesFile()
  if (!(id in PET_TYPE_TO_SPECIES)) {
    throw new Error("内置宠物类型不存在")
  }
  if (!file.disabledIds.includes(id)) file.disabledIds.push(id)
  await writeJsonFile(PET_TYPES_FILE, {
    ...file,
    updatedAt: new Date().toISOString(),
  } satisfies PetTypesFile)
}

export async function removeCustomPetType(id: string) {
  const file = await readPetTypesFile()
  const nextCustom = file.customTypes.filter((item) => item.id !== id)
  if (nextCustom.length === file.customTypes.length) {
    throw new Error("自定义宠物类型不存在")
  }
  await writeJsonFile(PET_TYPES_FILE, {
    ...file,
    customTypes: nextCustom,
    updatedAt: new Date().toISOString(),
  } satisfies PetTypesFile)
}

export async function restoreBuiltinPetType(id: string) {
  const file = await readPetTypesFile()
  file.disabledIds = file.disabledIds.filter((item) => item !== id)
  await writeJsonFile(PET_TYPES_FILE, {
    ...file,
    updatedAt: new Date().toISOString(),
  } satisfies PetTypesFile)
}

export function resolvePetTypeBreed(id: string) {
  if (id in PET_TYPE_TO_BREED) return PET_TYPE_TO_BREED[id as PetTypeId]
  return null
}

export function resolvePetTypeSpecies(id: string) {
  if (id in PET_TYPE_TO_SPECIES) return PET_TYPE_TO_SPECIES[id as PetTypeId]
  return null
}

export async function getEnabledPetBreedsBySpecies(): Promise<Partial<Record<PetSpecies, string[]>>> {
  const file = await readPetTypesFile()
  const disabledSet = new Set(file.disabledIds)
  const enabledKeys = new Set<string>()

  for (const option of PET_TYPE_OPTIONS) {
    if (!disabledSet.has(option.id)) {
      enabledKeys.add(`${option.species}:${PET_TYPE_TO_BREED[option.id]}`)
    }
  }

  for (const custom of file.customTypes) {
    enabledKeys.add(`${custom.species}:${custom.breed}`)
  }

  const result: Partial<Record<PetSpecies, string[]>> = {}
  for (const species of Object.keys(PET_BREEDS) as PetSpecies[]) {
    const filtered = PET_BREEDS[species].filter((breed) => enabledKeys.has(`${species}:${breed}`))
    if (filtered.length > 0) result[species] = filtered
  }

  return result
}

export async function isPetBreedEnabled(species: PetSpecies, breed: string) {
  const enabled = await getEnabledPetBreedsBySpecies()
  return enabled[species]?.includes(breed) ?? false
}

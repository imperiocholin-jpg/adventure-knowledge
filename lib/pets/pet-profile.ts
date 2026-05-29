import { resolveBattleLifeStage } from "@/lib/battle/rules"
import { inferPetProfileCompleted } from "@/lib/auth/onboarding"
import { PET_BREEDS, PET_SPECIES_EMOJI, resolvePetEmoji, type PetSpecies } from "@/lib/pets/catalog"
import { resolvePetAvatarSrc } from "@/lib/pets/avatar-registry"
import type { LifeStage } from "@/lib/pets/model-manifest"

export const PET_TYPE_TO_SPECIES = {
  tusong: "dog",
  corgi: "dog",
  husky: "dog",
  bulldog: "dog",
  teddy: "dog",
  americanShorthair: "cat",
  lihua: "cat",
  ragdoll: "cat",
  parrot: "bird",
  mapTurtle: "turtle",
  gecko: "lizard",
  hamster: "hamster",
  chinchilla: "hamster",
  dwarfRabbit: "rabbit",
  longhairLop: "rabbit",
  scentedPig: "pig",
} as const satisfies Record<string, PetSpecies>

export const PET_TYPE_TO_BREED = {
  tusong: "土松犬",
  corgi: "柯基",
  husky: "哈士奇",
  bulldog: "斗牛犬",
  teddy: "泰迪",
  americanShorthair: "美短",
  lihua: "狸花",
  ragdoll: "布偶",
  parrot: "鹦鹉",
  mapTurtle: "地图龟",
  gecko: "守宫",
  hamster: "仓鼠",
  chinchilla: "龙猫",
  dwarfRabbit: "荷兰侏儒兔",
  longhairLop: "长毛垂耳兔",
  scentedPig: "小香猪",
} as const satisfies Record<string, string>

export type PetTypeId = keyof typeof PET_TYPE_TO_SPECIES

const TYPE_FALLBACK_BY_SPECIES: Record<PetSpecies, PetTypeId> = {
  dog: "tusong",
  cat: "americanShorthair",
  rabbit: "dwarfRabbit",
  hamster: "hamster",
  bird: "parrot",
  pig: "scentedPig",
  turtle: "mapTurtle",
  lizard: "gecko",
}

const EMOJI_TO_PET_TYPE: Record<string, PetTypeId> = {
  "🐱": "americanShorthair",
  "🐰": "dwarfRabbit",
  "🐹": "hamster",
  "🐦": "parrot",
  "🐷": "scentedPig",
  "🐢": "mapTurtle",
  "🦎": "gecko",
}

export interface PetProfile {
  name: string
  level: number
  species: PetSpecies
  breed: string
  petType: PetTypeId
  emoji: string
  lifeStage: LifeStage
  avatarSrc: string | null
}

export const DEFAULT_PET_PROFILE: PetProfile = buildPetProfile({
  name: "毛毛",
  level: 1,
  species: "dog",
  breed: "土松犬",
  petType: "tusong",
})

function resolveField(record: Record<string, unknown>, candidates: string[]) {
  return candidates.find((field) => field in record)
}

export function resolvePetTypeBySpeciesBreed(species: PetSpecies, breed: string): PetTypeId {
  const entry = Object.entries(PET_TYPE_TO_BREED).find(
    ([typeId, typeBreed]) => PET_TYPE_TO_SPECIES[typeId as PetTypeId] === species && typeBreed === breed,
  )
  if (entry) return entry[0] as PetTypeId
  return TYPE_FALLBACK_BY_SPECIES[species]
}

export function buildPetProfile(input: {
  name?: string
  level?: number
  species?: PetSpecies
  breed?: string
  petType?: string
  emoji?: string
  lifeStage?: LifeStage
}): PetProfile {
  const level = Math.max(1, Math.floor(input.level ?? 1))
  const species = input.species ?? "dog"
  const breed = input.breed?.trim() || PET_TYPE_TO_BREED[TYPE_FALLBACK_BY_SPECIES[species]]
  const petType =
    input.petType && input.petType in PET_TYPE_TO_SPECIES
      ? (input.petType as PetTypeId)
      : resolvePetTypeBySpeciesBreed(species, breed)
  const lifeStage = input.lifeStage ?? resolveBattleLifeStage(level)
  const avatarSrc = resolvePetAvatarSrc({ species, breed, lifeStage })

  return {
    name: input.name?.trim() || "毛毛",
    level,
    species,
    breed,
    petType,
    emoji: input.emoji ?? resolvePetEmoji(species),
    lifeStage,
    avatarSrc,
  }
}

export function readLocalPetProfilePatch(): Partial<PetProfile> | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(PET_PROFILE_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<{ name: string; type: string }>
    const patch: Partial<PetProfile> = {}
    if (typeof parsed.name === "string" && parsed.name.trim()) {
      patch.name = parsed.name.trim().slice(0, 12)
    }
    if (typeof parsed.type === "string" && parsed.type in PET_TYPE_TO_SPECIES) {
      const petType = parsed.type as PetTypeId
      patch.petType = petType
      patch.species = PET_TYPE_TO_SPECIES[petType]
      patch.breed = PET_TYPE_TO_BREED[petType]
      patch.emoji = resolvePetEmoji(patch.species)
    }
    return patch
  } catch {
    return null
  }
}

export function parsePetRecord(record: Record<string, unknown> | null | undefined): PetProfile {
  if (!record) return DEFAULT_PET_PROFILE

  const nameField = resolveField(record, ["name", "pet_name"])
  const speciesField = resolveField(record, ["species", "pet_species"])
  const breedField = resolveField(record, ["breed", "pet_breed"])
  const emojiField = resolveField(record, ["emoji", "pet_emoji"])
  const levelField = resolveField(record, ["pet_level", "level"])
  const lifeStageField = resolveField(record, ["life_stage", "pet_life_stage"])

  let species: PetSpecies = "dog"
  if (speciesField && typeof record[speciesField] === "string") {
    const value = String(record[speciesField])
    if (value in PET_SPECIES_EMOJI) species = value as PetSpecies
  }

  let breed = PET_TYPE_TO_BREED[TYPE_FALLBACK_BY_SPECIES[species]]
  if (breedField && typeof record[breedField] === "string" && String(record[breedField]).trim()) {
    const breedValue = String(record[breedField]).trim()
    const candidates = PET_BREEDS[species]
    breed = (candidates as readonly string[]).includes(breedValue)
      ? (breedValue as (typeof PET_TYPE_TO_BREED)[keyof typeof PET_TYPE_TO_BREED])
      : breed
  }

  let petType = resolvePetTypeBySpeciesBreed(species, breed)
  if (emojiField && typeof record[emojiField] === "string") {
    const emoji = String(record[emojiField])
    if (EMOJI_TO_PET_TYPE[emoji]) petType = EMOJI_TO_PET_TYPE[emoji]
  }

  const levelRaw = levelField ? Number(record[levelField]) : 1
  const level = Number.isFinite(levelRaw) && levelRaw > 0 ? Math.floor(levelRaw) : 1

  let lifeStage: LifeStage = resolveBattleLifeStage(level)
  if (lifeStageField && typeof record[lifeStageField] === "string") {
    const value = String(record[lifeStageField])
    if (value === "幼崽" || value === "成年" || value === "壮年") {
      lifeStage = value
    }
  }

  const name =
    nameField && typeof record[nameField] === "string" && String(record[nameField]).trim()
      ? String(record[nameField]).trim().slice(0, 12)
      : "毛毛"

  const emoji =
    emojiField && typeof record[emojiField] === "string" && String(record[emojiField]).trim()
      ? String(record[emojiField])
      : resolvePetEmoji(species)

  return buildPetProfile({ name, level, species, breed, petType, emoji, lifeStage })
}

export const PET_PROFILE_STORAGE_KEY = "ak_pet_profile_v2"
export const PET_PROFILE_UPDATED_EVENT = "ak-pet-profile-updated"

export function clearLocalPetProfilePatch() {
  if (typeof window === "undefined") return
  if (!window.localStorage.getItem(PET_PROFILE_STORAGE_KEY)) return
  window.localStorage.removeItem(PET_PROFILE_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(PET_PROFILE_UPDATED_EVENT))
}

export function mergePetProfile(
  apiProfile: PetProfile,
  localPatch?: Partial<PetProfile> | null,
  sourceRow?: Record<string, unknown> | null,
) {
  if (sourceRow && inferPetProfileCompleted(sourceRow)) return apiProfile
  if (!localPatch) return apiProfile
  return buildPetProfile({
    ...apiProfile,
    petType: localPatch.petType ?? apiProfile.petType,
    species: localPatch.species ?? apiProfile.species,
    breed: localPatch.breed ?? apiProfile.breed,
    name: localPatch.name?.trim() ? localPatch.name : apiProfile.name,
  })
}

export function writeLocalPetProfile(patch: { name?: string; petType?: PetTypeId }) {
  if (typeof window === "undefined") return
  let stored: Partial<{ name: string; type: string }> = {}
  try {
    const raw = window.localStorage.getItem(PET_PROFILE_STORAGE_KEY)
    if (raw) stored = JSON.parse(raw) as Partial<{ name: string; type: string }>
  } catch {
    stored = {}
  }
  const next = {
    ...stored,
    ...(patch.name !== undefined ? { name: patch.name.trim().slice(0, 12) } : {}),
    ...(patch.petType !== undefined ? { type: patch.petType } : {}),
  }
  window.localStorage.setItem(PET_PROFILE_STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(PET_PROFILE_UPDATED_EVENT))
}

export async function savePetProfileToServer(input: {
  petName?: string
  species?: PetSpecies
  breed?: string
}) {
  const response = await fetch("/api/pets", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const payload = await response.json()
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error?.message ?? "保存宠物档案失败")
  }
  return payload
}

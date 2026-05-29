import { PET_SPECIES_EMOJI, PET_SPECIES_LABEL, type PetSpecies } from "@/lib/pets/catalog"
import {
  PET_TYPE_TO_BREED,
  PET_TYPE_TO_SPECIES,
  resolvePetTypeBySpeciesBreed,
  type PetTypeId,
} from "@/lib/pets/pet-profile"

export interface PetTypeOption {
  id: PetTypeId
  label: string
  species: PetSpecies
  speciesLabel: string
  emoji: string
}

export const PET_TYPE_OPTIONS: PetTypeOption[] = (
  Object.keys(PET_TYPE_TO_SPECIES) as PetTypeId[]
).map((id) => {
  const species = PET_TYPE_TO_SPECIES[id]
  return {
    id,
    label: PET_TYPE_TO_BREED[id],
    species,
    speciesLabel: PET_SPECIES_LABEL[species],
    emoji: PET_SPECIES_EMOJI[species],
  }
})

export function isValidPetTypeId(value: string): value is PetTypeId {
  return value in PET_TYPE_TO_SPECIES
}

export function resolvePetTypeLabel(petType: string, breed?: string) {
  if (isValidPetTypeId(petType)) return PET_TYPE_TO_BREED[petType]
  return breed || petType || "—"
}

export function resolvePetTypeFromRow(species: string, breed: string): PetTypeId {
  if (species in PET_SPECIES_EMOJI) {
    return resolvePetTypeBySpeciesBreed(species as PetSpecies, breed)
  }
  return "tusong"
}

export function buildPetTypeColumnPatch(writable: string[], petType: PetTypeId) {
  const species = PET_TYPE_TO_SPECIES[petType]
  const breed = PET_TYPE_TO_BREED[petType]
  const emoji = PET_SPECIES_EMOJI[species]
  const payload: Record<string, string> = {}

  if (writable.includes("species")) payload.species = species
  if (writable.includes("pet_species")) payload.pet_species = species
  if (writable.includes("breed")) payload.breed = breed
  if (writable.includes("pet_breed")) payload.pet_breed = breed
  if (writable.includes("emoji")) payload.emoji = emoji
  if (writable.includes("pet_emoji")) payload.pet_emoji = emoji

  return payload
}

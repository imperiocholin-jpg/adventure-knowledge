import type { PetSpecies } from "@/lib/pets/catalog"

const GRAVE_BY_SPECIES: Partial<Record<PetSpecies, string>> = {
  dog: "/image/pets%20dead/dog%20dead.png",
  cat: "/image/pets%20dead/cat%20dead.png",
  bird: "/image/pets%20dead/bird%20dead.png",
}

const DEFAULT_GRAVE = GRAVE_BY_SPECIES.dog!

export function resolvePetGraveSrc(species: string | null | undefined) {
  if (species && species in GRAVE_BY_SPECIES) {
    return GRAVE_BY_SPECIES[species as PetSpecies]!
  }
  return DEFAULT_GRAVE
}

import { NextResponse } from "next/server"

import { getEnabledPetBreedsBySpecies } from "@/lib/admin/pet-type-store"
import { PET_SPECIES_EMOJI, PET_SPECIES_LABEL, type PetSpecies } from "@/lib/pets/catalog"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const breedsBySpecies = await getEnabledPetBreedsBySpecies()
    const species = (Object.keys(breedsBySpecies) as PetSpecies[]).map((id) => ({
      id,
      label: PET_SPECIES_LABEL[id],
      emoji: PET_SPECIES_EMOJI[id],
      breeds: breedsBySpecies[id] ?? [],
    }))

    return NextResponse.json({ ok: true, species, breedsBySpecies })
  } catch (error) {
    console.error("[GET /api/pets/types]", error)
    return NextResponse.json(
      { ok: false, error: { message: "无法加载可选宠物类型。" } },
      { status: 500 },
    )
  }
}

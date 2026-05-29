import type { PetSpecies } from "@/lib/pets/catalog"
import {
  PET_MODEL_MANIFEST,
  type LifeStage,
  type PetModelTransform,
  type PetSceneAction,
} from "@/lib/pets/model-manifest"

type PetModelFormat = "glb" | "vrm" | "auto"

interface ResolvePetModelInput {
  species: PetSpecies
  breed: string
  lifeStage: LifeStage
  preferredFormat?: PetModelFormat
}

export interface PetModelResolution {
  candidates: string[]
  transform: PetModelTransform
  animationMap?: Partial<Record<PetSceneAction, string>>
}

const LIFE_STAGE_SLUG: Record<LifeStage, string> = {
  幼崽: "baby",
  成年: "adult",
  壮年: "mature",
}

const DEFAULT_TRANSFORM: PetModelTransform = {
  scale: 0.9,
  position: [0, -0.6, 0],
  rotation: [0, 0, 0],
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "")
    .replace(/_+/g, "-")
}

function mergeTransform(
  ...items: Array<Partial<PetModelTransform> | undefined>
): PetModelTransform {
  return items.reduce<PetModelTransform>((acc, current) => {
    if (!current) return acc
    return {
      scale: current.scale ?? acc.scale,
      position: current.position ?? acc.position,
      rotation: current.rotation ?? acc.rotation,
    }
  }, DEFAULT_TRANSFORM)
}

/**
 * 真实模型双轨策略:
 * 1) 先查 manifest（品种+阶段）
 * 2) 再回退到物种默认模型与推导路径
 * 3) 最后由 Pet3DScene 自动回退程序化模型
 */
export function resolvePetModelAsset({
  species,
  breed,
  lifeStage,
  preferredFormat = "auto",
}: ResolvePetModelInput): PetModelResolution {
  const stageSlug = LIFE_STAGE_SLUG[lifeStage]
  const breedSlug = toSlug(breed)
  const speciesSlug = toSlug(species)
  const speciesConfig = PET_MODEL_MANIFEST.species[species]
  const breedConfig = speciesConfig?.breeds?.[breed]
  const stageConfig = breedConfig?.stages?.[lifeStage]
  const speciesDefaultStage = speciesConfig?.defaultStages?.[lifeStage]

  if (preferredFormat === "vrm") {
    return {
      candidates: [`/models/pets/${speciesSlug}/${breedSlug}-${stageSlug}.vrm`],
      transform: mergeTransform(
        speciesConfig?.fallbackTransform,
        breedConfig?.fallbackTransform,
        stageConfig?.transform,
      ),
      animationMap: stageConfig?.animationMap,
    }
  }
  if (preferredFormat === "glb") {
    return {
      candidates: [
        stageConfig?.path,
        speciesDefaultStage?.path,
        `/models/pets/${speciesSlug}/${breedSlug}-${stageSlug}.glb`,
      ].filter(Boolean) as string[],
      transform: mergeTransform(
        speciesConfig?.fallbackTransform,
        breedConfig?.fallbackTransform,
        speciesDefaultStage?.transform,
        stageConfig?.transform,
      ),
      animationMap: stageConfig?.animationMap,
    }
  }

  return {
    candidates: [
      stageConfig?.path,
      speciesDefaultStage?.path,
      `/models/pets/${speciesSlug}/${breedSlug}-${stageSlug}.glb`,
      `/models/pets/${speciesSlug}/default-${stageSlug}.glb`,
      `/models/pets/${speciesSlug}/${breedSlug}-${stageSlug}.vrm`,
    ].filter(Boolean) as string[],
    transform: mergeTransform(
      speciesConfig?.fallbackTransform,
      breedConfig?.fallbackTransform,
      speciesDefaultStage?.transform,
      stageConfig?.transform,
    ),
    animationMap: stageConfig?.animationMap,
  }
}


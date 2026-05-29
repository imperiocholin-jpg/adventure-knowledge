import { access } from "node:fs/promises"
import path from "node:path"

import { PET_MODEL_MANIFEST, type LifeStage } from "@/lib/pets/model-manifest"

type ManifestScope = "breed" | "species-default"

export interface ManifestModelPathRecord {
  species: string
  breed: string | null
  lifeStage: LifeStage
  scope: ManifestScope
  path: string
}

export interface ModelHealthItem extends ManifestModelPathRecord {
  exists: boolean
  absolutePath: string
  errorCode: string | null
}

export interface ModelHealthReport {
  checkedAt: string
  total: number
  existing: number
  missing: number
  items: ModelHealthItem[]
}

const LIFE_STAGES: LifeStage[] = ["幼崽", "成年", "壮年"]

export function collectManifestModelPaths() {
  const records: ManifestModelPathRecord[] = []

  for (const [species, speciesConfig] of Object.entries(PET_MODEL_MANIFEST.species)) {
    const defaultStages = speciesConfig.defaultStages ?? {}
    for (const lifeStage of LIFE_STAGES) {
      const target = defaultStages[lifeStage]
      if (!target?.path) continue
      records.push({
        species,
        breed: null,
        lifeStage,
        scope: "species-default",
        path: target.path,
      })
    }

    const breeds = speciesConfig.breeds ?? {}
    for (const [breed, breedConfig] of Object.entries(breeds)) {
      const stages = breedConfig.stages ?? {}
      for (const lifeStage of LIFE_STAGES) {
        const target = stages[lifeStage]
        if (!target?.path) continue
        records.push({
          species,
          breed,
          lifeStage,
          scope: "breed",
          path: target.path,
        })
      }
    }
  }

  return records
}

function toAbsoluteModelPath(resourcePath: string) {
  const normalized = resourcePath.startsWith("/") ? resourcePath.slice(1) : resourcePath
  return path.join(process.cwd(), "public", normalized)
}

async function checkModelPath(record: ManifestModelPathRecord): Promise<ModelHealthItem> {
  const absolutePath = toAbsoluteModelPath(record.path)
  try {
    await access(absolutePath)
    return {
      ...record,
      exists: true,
      absolutePath,
      errorCode: null,
    }
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "UNKNOWN"
    return {
      ...record,
      exists: false,
      absolutePath,
      errorCode: code,
    }
  }
}

export async function scanPetModelHealth(): Promise<ModelHealthReport> {
  const records = collectManifestModelPaths()
  const items = await Promise.all(records.map(checkModelPath))
  const existing = items.filter((item) => item.exists).length
  const missing = items.length - existing

  return {
    checkedAt: new Date().toISOString(),
    total: items.length,
    existing,
    missing,
    items,
  }
}


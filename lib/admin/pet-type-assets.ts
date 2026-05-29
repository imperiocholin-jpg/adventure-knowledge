import { access } from "node:fs/promises"
import path from "node:path"

import type { AdminPetTypeRecord } from "@/lib/admin/pet-type-store"
import { resolvePetAvatarSrc, resolvePetVideoAssets } from "@/lib/pets/avatar-registry"
import type { LifeStage } from "@/lib/pets/model-manifest"

const LIFE_STAGES: LifeStage[] = ["幼崽", "成年", "壮年"]

const VIDEO_ACTIONS = ["idle", "eating", "playing", "sleeping", "training", "happy"] as const

export interface StageAssetStatus {
  stage: LifeStage
  imagePath: string | null
  imageOk: boolean
  videosConfigured: boolean
  videos: Array<{ action: string; path: string; ok: boolean }>
  videoComplete: boolean
}

export type VideoAssetAggregateStatus = "complete" | "missing" | "not_configured"

export interface PetTypeAssetReport {
  id: string
  label: string
  species: string
  breed: string
  stages: StageAssetStatus[]
  imageComplete: boolean
  /** @deprecated 请使用 videoStatus */
  videoComplete: boolean
  videoStatus: VideoAssetAggregateStatus
  overallComplete: boolean
}

function aggregateVideoStatus(stages: StageAssetStatus[]): VideoAssetAggregateStatus {
  const configuredStages = stages.filter((stage) => stage.videosConfigured)
  if (configuredStages.length === 0) return "not_configured"
  return configuredStages.every((stage) => stage.videoComplete) ? "complete" : "missing"
}

function toAbsolutePublicPath(resourcePath: string) {
  const withoutLeadingSlash = resourcePath.startsWith("/") ? resourcePath.slice(1) : resourcePath
  const segments = withoutLeadingSlash.split("/").map((segment) => decodeURIComponent(segment))
  return path.join(process.cwd(), "public", ...segments)
}

async function fileExists(resourcePath: string | null | undefined) {
  if (!resourcePath) return false
  try {
    await access(toAbsolutePublicPath(resourcePath))
    return true
  } catch {
    return false
  }
}

function resolveBreedForScan(type: AdminPetTypeRecord) {
  if (type.id === "tusong") return "土松犬"
  if (type.id === "americanShorthair") return "美短"
  if (type.id === "dwarfRabbit") return "荷兰侏儒兔"
  if (type.id === "longhairLop") return "长毛垂耳兔"
  return type.label
}

export async function scanPetTypeAssets(type: AdminPetTypeRecord): Promise<PetTypeAssetReport> {
  const breed = resolveBreedForScan(type)
  const stages: StageAssetStatus[] = []

  for (const stage of LIFE_STAGES) {
    const imagePath = resolvePetAvatarSrc({
      species: type.species,
      breed,
      lifeStage: stage,
    })
    const imageOk = await fileExists(imagePath)

    const videoAssets = resolvePetVideoAssets({
      species: type.species,
      breed,
      lifeStage: stage,
    })
    const videosConfigured = Boolean(videoAssets.base)

    const resolvedVideos = await Promise.all(
      VIDEO_ACTIONS.map(async (action) => {
        const videoPath =
          videoAssets.byAction[action] ?? (action === "idle" || action === "happy" ? videoAssets.base : null)
        return {
          action,
          path: videoPath ?? "—",
          ok: videoPath ? await fileExists(videoPath) : false,
        }
      }),
    )

    const videoComplete = videosConfigured
      ? resolvedVideos.filter((item) => item.path !== "—").every((item) => item.ok)
      : false

    stages.push({
      stage,
      imagePath,
      imageOk,
      videosConfigured,
      videos: resolvedVideos,
      videoComplete,
    })
  }

  const imageComplete = stages.every((stage) => stage.imageOk)
  const videoStatus = aggregateVideoStatus(stages)
  const videoComplete = videoStatus === "complete"
  const overallComplete =
    imageComplete && (videoStatus === "not_configured" || videoStatus === "complete")

  return {
    id: type.id,
    label: type.label,
    species: type.species,
    breed,
    stages,
    imageComplete,
    videoComplete,
    videoStatus,
    overallComplete,
  }
}

export async function scanAllPetTypeAssets(types: AdminPetTypeRecord[]) {
  return Promise.all(types.map((type) => scanPetTypeAssets(type)))
}

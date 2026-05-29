import type { PetSpecies } from "@/lib/pets/catalog"

export type LifeStage = "幼崽" | "成年" | "壮年"
export type PetSceneAction = "idle" | "tap" | "feed" | "play" | "sleep" | "train" | "levelUp"

export interface PetModelTransform {
  scale: number
  position: [number, number, number]
  rotation?: [number, number, number]
}

interface StageModelConfig {
  path?: string
  transform?: Partial<PetModelTransform>
  animationMap?: Partial<Record<PetSceneAction, string>>
}

interface BreedModelConfig {
  stages?: Partial<Record<LifeStage, StageModelConfig>>
  fallbackTransform?: Partial<PetModelTransform>
}

interface SpeciesModelConfig {
  defaultStages?: Partial<Record<LifeStage, StageModelConfig>>
  breeds?: Record<string, BreedModelConfig>
  fallbackTransform?: Partial<PetModelTransform>
}

export interface PetModelManifest {
  species: Record<PetSpecies, SpeciesModelConfig>
}

/**
 * 说明：
 * - path 支持绝对静态资源路径，例如 /models/pets/dog/corgi-baby.glb
 * - transform 用于修正不同模型体型/中心点差异
 * - 未命中 path 时，将继续走 model-registry 的路径推导与兜底逻辑
 */
export const PET_MODEL_MANIFEST: PetModelManifest = {
  species: {
    dog: {
      fallbackTransform: { scale: 0.85, position: [0, -0.62, 0] },
      breeds: {
        柯基: {
          stages: {
            幼崽: {
              path: "/models/pets/dog/Corgi-1.glb",
              transform: { scale: 0.8, position: [0, -0.66, 0] },
              animationMap: {
                idle: "Idle",
                feed: "Eat",
                play: "Play",
                train: "Run",
                sleep: "Sleep",
              },
            },
            成年: {
              path: "/models/pets/dog/Corgi-1.glb",
              animationMap: {
                idle: "Idle",
                feed: "Eat",
                play: "Jump",
                train: "Run",
                levelUp: "Celebrate",
              },
            },
            壮年: {
              path: "/models/pets/dog/Corgi-1.glb",
              transform: { scale: 0.9 },
              animationMap: {
                idle: "Idle",
                play: "Jump",
                train: "Attack",
                levelUp: "Celebrate",
              },
            },
          },
        },
      },
      defaultStages: {},
    },
    cat: {
      fallbackTransform: { scale: 0.92, position: [0, -0.58, 0] },
      breeds: {},
      defaultStages: {},
    },
    rabbit: {
      fallbackTransform: { scale: 0.9, position: [0, -0.6, 0] },
      defaultStages: {},
      breeds: {},
    },
    hamster: {
      fallbackTransform: { scale: 0.92, position: [0, -0.63, 0] },
      defaultStages: {},
      breeds: {},
    },
    bird: {
      fallbackTransform: { scale: 0.95, position: [0, -0.52, 0] },
      defaultStages: {},
      breeds: {},
    },
    pig: {
      fallbackTransform: { scale: 0.88, position: [0, -0.6, 0] },
      defaultStages: {},
      breeds: {},
    },
    turtle: {
      fallbackTransform: { scale: 0.86, position: [0, -0.58, 0] },
      defaultStages: {},
      breeds: {},
    },
    lizard: {
      fallbackTransform: { scale: 0.88, position: [0, -0.6, 0] },
      defaultStages: {},
      breeds: {},
    },
  },
}


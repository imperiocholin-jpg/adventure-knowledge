import type { PetSpecies } from "@/lib/pets/catalog"
import type { LifeStage } from "@/lib/pets/model-manifest"
import type { PetSceneAction } from "@/lib/pets/model-manifest"

interface ResolvePetAvatarInput {
  species: PetSpecies
  breed: string
  lifeStage: LifeStage
}

export type PetImageAction =
  | PetSceneAction
  | "eating"
  | "playing"
  | "sleeping"
  | "training"
  | "excited"
  | "cute"
  | "listless"
  | "cuddle"
  | "happy"
  | "sad"

export interface PetImageAssets {
  base: string | null
  byAction: Partial<Record<PetImageAction, string>>
}

export interface PetVideoAssets {
  base: string | null
  byAction: Partial<Record<PetImageAction, string>>
}

export interface PetMediaAssets {
  images: PetImageAssets
  videos: PetVideoAssets
}

const corgiStageAvatar: Record<LifeStage, string> = {
  幼崽: "/image/pets/dog/Corgi-1.png",
  成年: "/image/pets/dog/Corgi-2.png",
  壮年: "/image/pets/dog/Corgi-3.png",
}

const tusongStageAvatar: Record<LifeStage, string> = {
  幼崽: "/image/pets/dog/Tusong-1.png",
  成年: "/image/pets/dog/Tusong-2.png",
  壮年: "/image/pets/dog/Tusong-3.png",
}

const huskyStageAvatar: Record<LifeStage, string> = {
  幼崽: "/image/pets/dog/Husky-1.png",
  成年: "/image/pets/dog/Husky-2.png",
  壮年: "/image/pets/dog/Husky-3.png",
}

const speciesDefaultAvatar: Partial<Record<PetSpecies, string>> = {
  dog: "/image/pets/dog/Tusong-1.png",
  cat: "/image/pets/cat/ASH-1.png",
  rabbit: "/image/pets/rabbit/FuzzyLop-1.png",
  hamster: "/image/pets/hamster/Hamster-1.png",
  bird: "/image/pets/bird/parrot-1.png",
  pig: "/image/pets/pig/ScentedPig-1.png",
  turtle: "/image/pets/turtle/Turtle-1.png",
  lizard: "/image/pets/lizard/Gecko-1.png",
}

function resolveStageNo(lifeStage: LifeStage) {
  return lifeStage === "幼崽" ? "1" : lifeStage === "成年" ? "2" : "3"
}

function resolveImagePrefix(species: PetSpecies, breed: string) {
  const normalized = breed.trim().toLowerCase()
  const hasAlias = (aliases: string[]) => aliases.some((alias) => alias.toLowerCase() === normalized)

  if (species === "dog") {
    if (hasAlias(["土松", "土松犬", "中华田园犬"])) return "Tusong"
    if (hasAlias(["柯基", "柯基犬", "corgi"])) return "Corgi"
    if (hasAlias(["哈士奇", "husky"])) return "Husky"
    if (hasAlias(["泰迪", "teddy"])) return "Teddy"
    if (hasAlias(["柴犬", "斗牛犬", "bulldog"])) return "Bulldog"
    return null
  }

  if (species === "cat") {
    if (hasAlias(["英短", "美短", "ash"])) return "ASH"
    if (hasAlias(["橘猫", "狸花", "狸花猫", "lihua"])) return "LiHua"
    if (hasAlias(["布偶", "ragdoll"])) return "Ragdoll"
    return null
  }

  if (species === "rabbit") {
    if (hasAlias(["垂耳兔", "长毛垂耳兔", "安哥拉兔", "狮子兔", "fuzzylop"])) return "FuzzyLop"
    if (hasAlias(["侏儒兔", "dwarf"])) return "Dwarf"
    return null
  }

  if (species === "hamster") {
    if (hasAlias(["仓鼠", "金丝熊", "hamster"])) return "Hamster"
    if (hasAlias(["龙猫", "布丁仓鼠", "银狐仓鼠", "三线仓鼠", "chinchilla"])) return "Chinchilla"
    return null
  }

  if (species === "bird") {
    if (hasAlias(["鹦鹉", "虎皮鹦鹉", "玄凤鹦鹉", "文鸟", "金丝雀", "parrot"])) return "parrot"
    return null
  }

  if (species === "pig") {
    if (hasAlias(["小香猪", "迷你猪", "香猪", "小花猪", "scentedpig"])) return "ScentedPig"
    return null
  }

  if (species === "turtle") {
    if (hasAlias(["地图龟", "turtle"])) return "Turtle"
    return null
  }

  if (species === "lizard") {
    if (hasAlias(["守宫", "gecko"])) return "Gecko"
    return null
  }

  return null
}

function resolveStageAvatarByPrefix(species: PetSpecies, prefix: string, lifeStage: LifeStage) {
  const stageNo = resolveStageNo(lifeStage)
  return `/image/pets/${species}/${prefix}-${stageNo}.png`
}

function buildStageVideoAssets(baseDir: string, basePrefix: string, stageNo: string): PetVideoAssets {
  const happyVideo = `${baseDir}/${basePrefix}-${stageNo}-happy.mp4`
  return {
    base: happyVideo,
    byAction: {
      idle: happyVideo,
      eating: `${baseDir}/${basePrefix}-${stageNo}-eating.mp4`,
      playing: `${baseDir}/${basePrefix}-${stageNo}-playing.mp4`,
      sleeping: `${baseDir}/${basePrefix}-${stageNo}-sleeping.mp4`,
      training: `${baseDir}/${basePrefix}-${stageNo}-training.mp4`,
      excited: `${baseDir}/${basePrefix}-${stageNo}-excited.mp4`,
      cute: `${baseDir}/${basePrefix}-${stageNo}-cute.mp4`,
      listless: `${baseDir}/${basePrefix}-${stageNo}-listless.mp4`,
      happy: happyVideo,
      sad: `${baseDir}/${basePrefix}-${stageNo}-sad.mp4`,
      cuddle: happyVideo,
    },
  }
}

/** 品种视频目录：dir 为 public/video 下实际文件夹名，prefix 为 mp4 文件名前缀 */
const DOG_VIDEO_BREEDS: Record<string, { dir: string; prefix: string }> = {
  Tusong: { dir: "Tusong", prefix: "Tusong" },
  Husky: { dir: "Husky", prefix: "Husky" },
  Bulldog: { dir: "Bulldog", prefix: "Bulldog" },
  Teddy: { dir: "Taddy", prefix: "Teddy" },
  Corgi: { dir: "Corgi", prefix: "Corgi" },
}

const CAT_VIDEO_BREEDS: Record<string, { dir: string; prefix: string }> = {
  ASH: { dir: "British Shorthair", prefix: "ASH" },
  LiHua: { dir: "Lihua", prefix: "LiHua" },
  Ragdoll: { dir: "Ragdoll", prefix: "Ragdoll" },
}

function encodePublicPathSegment(segment: string) {
  return encodeURIComponent(segment)
}

function resolveBreedVideoAssets(
  speciesFolder: "dog" | "cat",
  dirName: string,
  filePrefix: string,
  lifeStage: LifeStage,
): PetVideoAssets {
  const stageNo = resolveStageNo(lifeStage)
  const baseDir = `/video/pets/${speciesFolder}/${encodePublicPathSegment(dirName)}`
  return buildStageVideoAssets(baseDir, filePrefix, stageNo)
}

export function resolvePetAvatarSrc({ species, breed, lifeStage }: ResolvePetAvatarInput) {
  if (species === "dog" && ["土松", "土松犬", "中华田园犬"].includes(breed)) {
    return tusongStageAvatar[lifeStage]
  }
  if (species === "dog" && ["哈士奇", "husky", "Husky"].includes(breed)) {
    return huskyStageAvatar[lifeStage]
  }
  if (species === "dog" && ["柯基", "柯基犬", "corgi", "Corgi"].includes(breed)) {
    return corgiStageAvatar[lifeStage]
  }
  const imagePrefix = resolveImagePrefix(species, breed)
  if (imagePrefix) {
    return resolveStageAvatarByPrefix(species, imagePrefix, lifeStage)
  }
  return speciesDefaultAvatar[species] ?? null
}

export function resolvePetImageAssets(input: ResolvePetAvatarInput): PetImageAssets {
  const base = resolvePetAvatarSrc(input)
  if (!base) {
    return { base: null, byAction: {} }
  }

  // 当前阶段先用静态图；后续你给动作图后直接替换成动作对应路径即可。
  return {
    base,
    byAction: {
      idle: base,
      tap: base,
      feed: base,
      play: base,
      sleep: base,
      train: base,
      levelUp: base,
      cuddle: base,
      happy: base,
      sad: base,
    },
  }
}

export function resolvePetVideoAssets({ species, breed, lifeStage }: ResolvePetAvatarInput): PetVideoAssets {
  const imagePrefix = resolveImagePrefix(species, breed)

  if (species === "dog" && imagePrefix && imagePrefix in DOG_VIDEO_BREEDS) {
    const { dir, prefix } = DOG_VIDEO_BREEDS[imagePrefix]
    return resolveBreedVideoAssets("dog", dir, prefix, lifeStage)
  }

  if (species === "cat" && imagePrefix && imagePrefix in CAT_VIDEO_BREEDS) {
    const { dir, prefix } = CAT_VIDEO_BREEDS[imagePrefix]
    return resolveBreedVideoAssets("cat", dir, prefix, lifeStage)
  }

  return {
    base: null,
    byAction: {},
  }
}

export function resolvePetMediaAssets(input: ResolvePetAvatarInput): PetMediaAssets {
  return {
    images: resolvePetImageAssets(input),
    videos: resolvePetVideoAssets(input),
  }
}


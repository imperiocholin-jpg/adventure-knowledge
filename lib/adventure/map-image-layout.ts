import type { AdventureRegionId } from "@/lib/library/adventure-regions"

/** 冒险地图背景图（与 Advance Map-0 设计稿配套） */
export const ADVENTURE_MAP_BACKGROUND_SRC = "/image/Advance Map/Advance Map-background-2.png"

/** 背景图原始尺寸 941×1672 */
export const ADVENTURE_MAP_IMAGE_WIDTH = 941
export const ADVENTURE_MAP_IMAGE_HEIGHT = 1672
export const ADVENTURE_MAP_ASPECT_RATIO =
  ADVENTURE_MAP_IMAGE_WIDTH / ADVENTURE_MAP_IMAGE_HEIGHT

/** BOSS 尺寸缩放（在原始基础上缩小 1/3） */
export const MAP_BOSS_SIZE_SCALE = 2 / 3

export interface MapRegionHotspot {
  id: AdventureRegionId
  order: number
  /** 锚点（背景图百分比，标签在 BOSS 下方） */
  x: number
  y: number
  /** BOSS 宽度占地图宽度比例（缩放前设计值） */
  bossWidth: number
  bossImageSrc: string
}

/** 各区域路径入口（背景图百分比，沿主路从下到上） */
export const MAP_REGION_ENTRANCES: Record<AdventureRegionId, { x: number; y: number }> = {
  "magic-forest": { x: 44, y: 86 },
  "ice-mountain": { x: 55, y: 76 },
  "ancient-desert": { x: 37, y: 71 },
  "ocean-ruins": { x: 46, y: 49 },
  "sky-kingdom": { x: 38, y: 42 },
  "dream-tower": { x: 43, y: 26 },
}

export function getMapRegionEntrance(regionId: AdventureRegionId) {
  return MAP_REGION_ENTRANCES[regionId]
}

export const MAP_REGION_HOTSPOTS: MapRegionHotspot[] = [
  {
    id: "magic-forest",
    order: 1,
    x: 25,
    y: 74,
    bossWidth: 0.42,
    bossImageSrc: "/image/Advance Map/boss-1.png",
  },
  {
    id: "ice-mountain",
    order: 2,
    x: 73,
    y: 61,
    bossWidth: 0.4,
    bossImageSrc: "/image/Advance Map/boss-2.png",
  },
  {
    id: "ancient-desert",
    order: 3,
    x: 22,
    y: 55,
    bossWidth: 0.4,
    bossImageSrc: "/image/Advance Map/boss-3.png",
  },
  {
    id: "sky-kingdom",
    order: 4,
    x: 72,
    y: 36,
    bossWidth: 0.38,
    bossImageSrc: "/image/Advance Map/boss-4.png",
  },
  {
    id: "ocean-ruins",
    order: 5,
    x: 21,
    y: 29,
    bossWidth: 0.38,
    bossImageSrc: "/image/Advance Map/boss-5.png",
  },
  {
    id: "dream-tower",
    order: 6,
    x: 50,
    y: 12,
    bossWidth: 0.36,
    bossImageSrc: "/image/Advance Map/boss-6.png",
  },
]

export const MAP_REGION_PILL_THEME: Record<
  AdventureRegionId,
  { ring: string; pill: string; text: string; bossText: string; progress: string; glow: string }
> = {
  "magic-forest": {
    ring: "border-emerald-400",
    pill: "border-emerald-300/70 bg-emerald-950/75",
    text: "text-emerald-50",
    bossText: "text-emerald-300/90",
    progress: "text-emerald-300",
    glow: "shadow-[0_0_16px_rgba(52,211,153,0.35)]",
  },
  "ice-mountain": {
    ring: "border-cyan-400",
    pill: "border-cyan-300/70 bg-cyan-950/75",
    text: "text-cyan-50",
    bossText: "text-cyan-300/90",
    progress: "text-cyan-300",
    glow: "shadow-[0_0_16px_rgba(34,211,238,0.35)]",
  },
  "ancient-desert": {
    ring: "border-amber-400",
    pill: "border-amber-300/70 bg-amber-950/75",
    text: "text-amber-50",
    bossText: "text-amber-300/90",
    progress: "text-amber-300",
    glow: "shadow-[0_0_16px_rgba(251,191,36,0.35)]",
  },
  "sky-kingdom": {
    ring: "border-violet-400",
    pill: "border-violet-300/70 bg-violet-950/75",
    text: "text-violet-50",
    bossText: "text-violet-300/90",
    progress: "text-violet-300",
    glow: "shadow-[0_0_16px_rgba(167,139,250,0.35)]",
  },
  "ocean-ruins": {
    ring: "border-blue-400",
    pill: "border-blue-300/70 bg-blue-950/75",
    text: "text-blue-50",
    bossText: "text-blue-300/90",
    progress: "text-blue-300",
    glow: "shadow-[0_0_16px_rgba(59,130,246,0.35)]",
  },
  "dream-tower": {
    ring: "border-fuchsia-400",
    pill: "border-fuchsia-300/70 bg-fuchsia-950/75",
    text: "text-fuchsia-50",
    bossText: "text-fuchsia-300/90",
    progress: "text-fuchsia-300",
    glow: "shadow-[0_0_16px_rgba(217,70,239,0.35)]",
  },
}

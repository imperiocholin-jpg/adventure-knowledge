/** 冒险地图主题区域（与年级无关，按主题分池） */
export const ADVENTURE_REGION_IDS = [
  "magic-forest",
  "ice-mountain",
  "ancient-desert",
  "ocean-ruins",
  "sky-kingdom",
  "dream-tower",
] as const

export type AdventureRegionId = (typeof ADVENTURE_REGION_IDS)[number]

export interface AdventureRegionMeta {
  id: AdventureRegionId
  name: string
  description: string
  totalStages: number
  unlockedByDefault?: boolean
  unlockWhenPrevProgressAtLeast?: number
}

export const ADVENTURE_REGION_META: Record<AdventureRegionId, AdventureRegionMeta> = {
  "magic-forest": {
    id: "magic-forest",
    name: "魔法森林",
    description: "童话、绘本与友情故事",
    totalStages: 12,
    unlockedByDefault: true,
  },
  "ice-mountain": {
    id: "ice-mountain",
    name: "冰雪之巅",
    description: "成长、冒险与品格",
    totalStages: 12,
    unlockWhenPrevProgressAtLeast: 50,
  },
  "ancient-desert": {
    id: "ancient-desert",
    name: "远古沙漠",
    description: "历史、地理与人文",
    totalStages: 12,
    unlockWhenPrevProgressAtLeast: 50,
  },
  "ocean-ruins": {
    id: "ocean-ruins",
    name: "深海遗迹",
    description: "自然科学与探索",
    totalStages: 12,
    unlockWhenPrevProgressAtLeast: 50,
  },
  "sky-kingdom": {
    id: "sky-kingdom",
    name: "天空王国",
    description: "外国名著与奇幻科幻",
    totalStages: 12,
    unlockWhenPrevProgressAtLeast: 50,
  },
  "dream-tower": {
    id: "dream-tower",
    name: "梦境之塔",
    description: "高阶文学与艺术鉴赏",
    totalStages: 12,
    unlockWhenPrevProgressAtLeast: 50,
  },
}

export const ADVENTURE_REGION_UNLOCK_ORDER: AdventureRegionId[] = [...ADVENTURE_REGION_IDS]

export function getAdventureRegionName(regionId: string) {
  const meta = ADVENTURE_REGION_META[regionId as AdventureRegionId]
  return meta?.name ?? regionId
}

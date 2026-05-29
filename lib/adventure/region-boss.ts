import type { AdventureRegionId } from "@/lib/library/adventure-regions"

/** 区域 BOSS 挑战解锁进度（见冒险世界规则 §5.3） */
export const REGION_BOSS_PROGRESS_MIN = 92

export interface RegionBossConfig {
  regionId: AdventureRegionId
  name: string
  subtitle: string
  opponentEmoji: string
  imageSrc: string
  difficulty: number
  levelOffset: number
  starsGain: number
  experienceGain: number
  petExpGain: number
  ownerCoins: number
}

export const REGION_BOSS_CONFIG: Record<AdventureRegionId, RegionBossConfig> = {
  "magic-forest": {
    regionId: "magic-forest",
    name: "树精王",
    subtitle: "魔法森林守护者",
    opponentEmoji: "🌲",
    imageSrc: "/image/boss/boss-1.png",
    difficulty: 4,
    levelOffset: 2,
    starsGain: 3,
    experienceGain: 30,
    petExpGain: 18,
    ownerCoins: 15,
  },
  "ice-mountain": {
    regionId: "ice-mountain",
    name: "霜牙狼王",
    subtitle: "冰雪之巅守护者",
    opponentEmoji: "🐺",
    imageSrc: "/image/boss/boss-2.png",
    difficulty: 4,
    levelOffset: 3,
    starsGain: 3,
    experienceGain: 32,
    petExpGain: 20,
    ownerCoins: 16,
  },
  "ancient-desert": {
    regionId: "ancient-desert",
    name: "沙灵祭司",
    subtitle: "远古沙漠守护者",
    opponentEmoji: "🕌",
    imageSrc: "/image/boss/boss-3.png",
    difficulty: 4,
    levelOffset: 3,
    starsGain: 3,
    experienceGain: 34,
    petExpGain: 20,
    ownerCoins: 16,
  },
  "ocean-ruins": {
    regionId: "ocean-ruins",
    name: "深海巨灵",
    subtitle: "深海遗迹守护者",
    opponentEmoji: "🐙",
    imageSrc: "/image/boss/boss-4.png",
    difficulty: 5,
    levelOffset: 4,
    starsGain: 3,
    experienceGain: 36,
    petExpGain: 22,
    ownerCoins: 18,
  },
  "sky-kingdom": {
    regionId: "sky-kingdom",
    name: "云翼狮鹫",
    subtitle: "天空王国守护者",
    opponentEmoji: "🦅",
    imageSrc: "/image/boss/boss-5.png",
    difficulty: 5,
    levelOffset: 4,
    starsGain: 3,
    experienceGain: 38,
    petExpGain: 22,
    ownerCoins: 18,
  },
  "dream-tower": {
    regionId: "dream-tower",
    name: "织梦者",
    subtitle: "梦境之塔守护者",
    opponentEmoji: "✨",
    imageSrc: "/image/boss/boss-6.png",
    difficulty: 5,
    levelOffset: 5,
    starsGain: 3,
    experienceGain: 40,
    petExpGain: 24,
    ownerCoins: 20,
  },
}

export function getRegionBossConfig(regionId: string): RegionBossConfig | null {
  return REGION_BOSS_CONFIG[regionId as AdventureRegionId] ?? null
}

export function buildBossChallengeChapterId(regionId: string) {
  return `boss-${regionId}`
}

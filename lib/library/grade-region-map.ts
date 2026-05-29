import type { AdventureRegionId } from "@/lib/library/adventure-regions"

/** 小学 1～6 年级 → 六个冒险区域（与 book 目录年级一一对应） */
export const GRADE_TO_REGION: Record<number, AdventureRegionId> = {
  1: "magic-forest",
  2: "ice-mountain",
  3: "ancient-desert",
  4: "ocean-ruins",
  5: "sky-kingdom",
  6: "dream-tower",
}

export const REGION_COVER_EMOJI: Record<AdventureRegionId, string> = {
  "magic-forest": "🌲",
  "ice-mountain": "❄️",
  "ancient-desert": "🏜️",
  "ocean-ruins": "🐚",
  "sky-kingdom": "☁️",
  "dream-tower": "🌙",
}

export const GRADE_LABEL: Record<number, string> = {
  1: "一年级",
  2: "二年级",
  3: "三年级",
  4: "四年级",
  5: "五年级",
  6: "六年级",
}

export function resolveRegionByGrade(grade: number | null | undefined): AdventureRegionId {
  if (typeof grade === "number" && grade >= 1 && grade <= 6) {
    return GRADE_TO_REGION[grade]
  }
  return "magic-forest"
}

export function resolveCoverEmoji(regionId: AdventureRegionId): string {
  return REGION_COVER_EMOJI[regionId] ?? "📘"
}

export interface PetSkillConfig {
  id: string
  name: string
  description: string
  icon: string
  maxLevel: number
}

export interface PetSkillState extends PetSkillConfig {
  level: number
}

export interface PetSkillBattleBonuses {
  atkPct: number
  hpPct: number
  damagePct: number
}

export const PET_SKILLS_STORAGE_KEY = "ak_pet_skills_v1"

export const PET_SKILL_LIBRARY: PetSkillConfig[] = [
  { id: "coin-sense", name: "金币嗅觉", description: "阅读时额外获得金币", icon: "🪙", maxLevel: 5 },
  { id: "exp-boost", name: "经验加成", description: "完成任务获得更多经验", icon: "✨", maxLevel: 5 },
  { id: "lucky-ward", name: "幸运加护", description: "增加稀有物品掉落率", icon: "🍀", maxLevel: 5 },
]

const defaultLevels: Record<string, number> = {
  "coin-sense": 3,
  "exp-boost": 2,
  "lucky-ward": 0,
}

function clampSkillLevel(skillId: string, level: unknown) {
  const maxLevel = PET_SKILL_LIBRARY.find((skill) => skill.id === skillId)?.maxLevel ?? 5
  const numeric = typeof level === "number" && Number.isFinite(level) ? Math.floor(level) : 0
  return Math.max(0, Math.min(maxLevel, numeric))
}

export function getDefaultSkillLevels() {
  return PET_SKILL_LIBRARY.map((skill) => ({
    id: skill.id,
    level: defaultLevels[skill.id] ?? 0,
  }))
}

export function parseSkillLevels(input: unknown) {
  if (!Array.isArray(input)) return getDefaultSkillLevels()
  const normalizedMap = new Map<string, number>()
  for (const entry of input) {
    if (!entry || typeof entry !== "object") continue
    const row = entry as Record<string, unknown>
    const id = typeof row.id === "string" ? row.id : null
    if (!id) continue
    if (!PET_SKILL_LIBRARY.some((skill) => skill.id === id)) continue
    normalizedMap.set(id, clampSkillLevel(id, row.level))
  }
  return PET_SKILL_LIBRARY.map((skill) => ({
    id: skill.id,
    level: normalizedMap.has(skill.id) ? normalizedMap.get(skill.id)! : defaultLevels[skill.id] ?? 0,
  }))
}

export function resolveSkillStates(skillLevels: Array<{ id: string; level: number }>): PetSkillState[] {
  const normalized = parseSkillLevels(skillLevels)
  const levelMap = new Map(normalized.map((item) => [item.id, item.level]))
  return PET_SKILL_LIBRARY.map((skill) => ({
    ...skill,
    level: levelMap.get(skill.id) ?? 0,
  }))
}

export function upgradeSkillLevel(skillLevels: Array<{ id: string; level: number }>, skillId: string) {
  const normalized = parseSkillLevels(skillLevels)
  return normalized.map((item) => {
    if (item.id !== skillId) return item
    const maxLevel = PET_SKILL_LIBRARY.find((skill) => skill.id === skillId)?.maxLevel ?? 5
    return {
      ...item,
      level: Math.min(maxLevel, item.level + 1),
    }
  })
}

export function resolveBattleSkillBonuses(skillLevels: Array<{ id: string; level: number }>): PetSkillBattleBonuses {
  const normalized = parseSkillLevels(skillLevels)
  const levelMap = new Map(normalized.map((item) => [item.id, item.level]))
  const coinSenseLevel = levelMap.get("coin-sense") ?? 0
  const expBoostLevel = levelMap.get("exp-boost") ?? 0
  const luckyWardLevel = levelMap.get("lucky-ward") ?? 0

  return {
    atkPct: coinSenseLevel * 0.015,
    hpPct: expBoostLevel * 0.02,
    damagePct: luckyWardLevel * 0.01,
  }
}

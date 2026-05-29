import type { BossChallengeStatus } from "@/lib/adventure/boss-eligibility"

export type PathStageType = "reading" | "boss" | "treasure" | "battle" | "checkpoint" | "mystery" | "elite"

export interface PathStage {
  id: number
  type: PathStageType
  title: string
  status: "completed" | "current" | "locked"
  stars?: number
}

export function buildPathStagesFromRegion(params: {
  regionName: string
  totalStages: number
  completedStages: number
  regionStars: number
  bossName?: string
  bossDefeated?: boolean
  bossStatus?: BossChallengeStatus
}) {
  const { totalStages, completedStages } = params
  const safeTotal = Math.max(1, totalStages)
  const safeCompleted = Math.min(safeTotal, Math.max(0, completedStages))

  const stages: PathStage[] = []
  for (let i = 1; i <= safeTotal; i += 1) {
    const isLast = i === safeTotal
    let status: PathStage["status"] = "locked"
    if (isLast) {
      if (params.bossDefeated) status = "completed"
      else if (params.bossStatus === "ready") status = "current"
      else status = "locked"
    } else if (i <= safeCompleted) {
      status = "completed"
    } else if (i === safeCompleted + 1) {
      status = "current"
    }

    const type: PathStageType = isLast ? "boss" : i % 4 === 0 ? "treasure" : "reading"

    stages.push({
      id: i,
      type,
      title: isLast ? (params.bossName ?? `${params.regionName}守护者`) : `第 ${i} 关`,
      status,
      stars: status === "completed" ? (isLast ? 3 : 3) : undefined,
    })
  }

  return {
    stages,
    regionStars: params.regionStars,
    maxStars: safeTotal * 3,
  }
}

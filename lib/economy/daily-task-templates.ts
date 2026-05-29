import { V1_FEATURES } from "@/lib/config/v1-features"
import { DAILY_TASK_COIN_TIERS } from "@/lib/economy/reward-policy"

/** 每日任务 seed 模板（coins 对齐 §7.1：小 15 / 中 25 / 大 35） */
export interface DailyTaskTemplate {
  task_type: "reading" | "question" | "challenge" | "pet"
  title: string
  description: string
  tier: keyof typeof DAILY_TASK_COIN_TIERS
  xp_reward: number
  coin_reward: number
  pet_reward: number
  max_progress: number
}

export const DEFAULT_DAILY_TASK_TEMPLATES: DailyTaskTemplate[] = [
  {
    task_type: "reading",
    title: "阅读达人",
    description: "阅读一个章节",
    tier: "medium",
    xp_reward: 40,
    coin_reward: DAILY_TASK_COIN_TIERS.medium,
    pet_reward: 12,
    max_progress: 1,
  },
  {
    task_type: "question",
    title: "知识问答",
    description: "回答5道问题",
    tier: "medium",
    xp_reward: 35,
    coin_reward: DAILY_TASK_COIN_TIERS.medium,
    pet_reward: 15,
    max_progress: 5,
  },
  {
    task_type: "challenge",
    title: "挑战高手",
    description: "赢得一场PK",
    tier: "large",
    xp_reward: 50,
    coin_reward: DAILY_TASK_COIN_TIERS.large,
    pet_reward: 20,
    max_progress: 1,
  },
  {
    task_type: "pet",
    title: "关爱伙伴",
    description: "喂养宠物",
    tier: "small",
    xp_reward: 25,
    coin_reward: DAILY_TASK_COIN_TIERS.small,
    pet_reward: 10,
    max_progress: 1,
  },
]

/** 新用户 seed 用模板（V1 默认排除未接线的 question 任务） */
export function getDailyTaskTemplatesForSeed() {
  return DEFAULT_DAILY_TASK_TEMPLATES.filter(
    (template) => template.task_type !== "question" || V1_FEATURES.dailyTaskQuestion,
  )
}

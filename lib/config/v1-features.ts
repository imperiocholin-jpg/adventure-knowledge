/**
 * V1 功能开关：控制未成熟玩法，避免与宠物主链并行膨胀。
 * 见 冒险世界规则.md §15.1、docs/V1_LAUNCH_CHECKLIST.md §8
 */
export const V1_FEATURES = {
  /** 章节阅读挑战携带对战道具 */
  chapterBattleItems: false,
  /** 六区固定探索宝箱全自动掉落 */
  fullMapExplorationRewards: false,
  /** 冒险页底部「探索奖励」区块 */
  adventureRewardDiscoveryBlock: false,
  /** 每日任务：知识问答（未接答题统计前不 seed） */
  dailyTaskQuestion: false,
} as const

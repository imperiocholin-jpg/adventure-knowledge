export type PetShopCategory = "food" | "training" | "rest" | "toy" | "equipment"
export type PetInteractAction = "feed" | "train" | "sleep" | "play"

export interface PetShopItem {
  id: string
  name: string
  category: PetShopCategory
  price: number
  icon: string
  description: string
  battleHint?: string
  effect: {
    satiety?: number
    spirit?: number
    bond?: number
  }
}

export const PET_SHOP_ITEMS: PetShopItem[] = [
  // 食物（通用）
  {
    id: "food-basic",
    name: "营养主粮",
    category: "food",
    price: 12,
    icon: "🍖",
    description: "喂食时消耗，恢复饱食度与少量亲密。",
    effect: { satiety: 20, bond: 4 },
  },
  {
    id: "food-fresh-pack",
    name: "鲜食包",
    category: "food",
    price: 14,
    icon: "🥘",
    description: "均衡补给，恢复饱食度并提升少量精神。",
    effect: { satiety: 22, spirit: 4 },
  },
  {
    id: "food-fruit-cup",
    name: "果蔬杯",
    category: "food",
    price: 11,
    icon: "🍎",
    description: "轻食搭配，快速补充日常饱食度。",
    effect: { satiety: 16, bond: 3 },
  },
  {
    id: "food-energy-stick",
    name: "能量棒",
    category: "food",
    price: 15,
    icon: "🍫",
    description: "高能补给，恢复饱食度并略提精神。",
    effect: { satiety: 18, spirit: 6 },
  },
  {
    id: "food-nutri-bowl",
    name: "营养餐碗",
    category: "food",
    price: 18,
    icon: "🍲",
    description: "高品质主餐，恢复较多饱食度。",
    effect: { satiety: 28, bond: 4 },
  },
  {
    id: "food-snack-mix",
    name: "零食拼盘",
    category: "food",
    price: 10,
    icon: "🍪",
    description: "互动小零食，补充少量饱食度并增加亲密。",
    effect: { satiety: 12, bond: 6 },
  },

  // 训练工具（通用）
  {
    id: "train-rope",
    name: "训练绳",
    category: "training",
    price: 16,
    icon: "🪢",
    description: "训练时消耗，提升精神并增加亲密。",
    effect: { spirit: 10, bond: 6 },
  },
  {
    id: "train-cone",
    name: "障碍锥",
    category: "training",
    price: 17,
    icon: "🚧",
    description: "敏捷训练道具，提升精神与亲密。",
    effect: { spirit: 12, bond: 5 },
  },
  {
    id: "train-whistle",
    name: "训练哨",
    category: "training",
    price: 13,
    icon: "📣",
    description: "节奏训练辅助，稳定恢复精神。",
    effect: { spirit: 10, bond: 3 },
  },
  {
    id: "train-target",
    name: "目标靶盘",
    category: "training",
    price: 15,
    icon: "🎯",
    description: "指向练习道具，提升精神和默契。",
    effect: { spirit: 9, bond: 7 },
  },
  {
    id: "train-balance-pad",
    name: "平衡垫",
    category: "training",
    price: 18,
    icon: "🧩",
    description: "核心训练道具，恢复较多精神。",
    effect: { spirit: 14, bond: 4 },
  },
  {
    id: "train-mini-hurdle",
    name: "迷你跨栏",
    category: "training",
    price: 19,
    icon: "🏃",
    description: "进阶训练道具，提升精神与亲密。",
    effect: { spirit: 12, bond: 6 },
  },

  // 休息装备（通用）
  {
    id: "rest-pillow",
    name: "舒眠抱枕",
    category: "rest",
    price: 14,
    icon: "🛏️",
    description: "休息时消耗，主要恢复精神值。",
    effect: { spirit: 22 },
  },
  {
    id: "rest-blanket",
    name: "轻柔毛毯",
    category: "rest",
    price: 13,
    icon: "🧣",
    description: "安抚休息，恢复精神并补少量亲密。",
    effect: { spirit: 16, bond: 3 },
  },
  {
    id: "rest-mat",
    name: "舒压睡垫",
    category: "rest",
    price: 17,
    icon: "🛋️",
    description: "深度休息装备，恢复较多精神。",
    effect: { spirit: 24 },
  },
  {
    id: "rest-cushion",
    name: "柔软靠垫",
    category: "rest",
    price: 12,
    icon: "🪑",
    description: "短时休息道具，恢复精神。",
    effect: { spirit: 12, bond: 2 },
  },
  {
    id: "rest-eye-mask",
    name: "安睡眼罩",
    category: "rest",
    price: 11,
    icon: "😴",
    description: "辅助放松，恢复精神并稳定情绪。",
    effect: { spirit: 10, bond: 3 },
  },
  {
    id: "rest-white-noise",
    name: "白噪音盒",
    category: "rest",
    price: 16,
    icon: "🎵",
    description: "沉浸休息，恢复精神并少量亲密。",
    effect: { spirit: 15, bond: 4 },
  },

  // 玩耍道具（通用）
  {
    id: "toy-ball",
    name: "弹力玩具球",
    category: "toy",
    price: 10,
    icon: "🎾",
    description: "玩耍时消耗，恢复亲密与少量精神。",
    effect: { bond: 12, spirit: 4 },
  },
  {
    id: "toy-feather",
    name: "逗趣羽棒",
    category: "toy",
    price: 12,
    icon: "🪶",
    description: "轻互动玩具，提升亲密与精神。",
    effect: { bond: 10, spirit: 5 },
  },
  {
    id: "toy-plush",
    name: "陪伴玩偶",
    category: "toy",
    price: 14,
    icon: "🧸",
    description: "温和玩耍，恢复较多亲密。",
    effect: { bond: 16, spirit: 2 },
  },
  {
    id: "toy-frisbee",
    name: "飞盘",
    category: "toy",
    price: 15,
    icon: "🥏",
    description: "活力互动，提升亲密和精神。",
    effect: { bond: 11, spirit: 6 },
  },
  {
    id: "toy-rattle",
    name: "响铃玩具",
    category: "toy",
    price: 10,
    icon: "🔔",
    description: "轻松玩耍道具，稳定提升亲密。",
    effect: { bond: 9, spirit: 3 },
  },
  {
    id: "toy-tunnel",
    name: "探索隧道",
    category: "toy",
    price: 18,
    icon: "🌀",
    description: "探索互动，恢复亲密并提升精神。",
    effect: { bond: 13, spirit: 7 },
  },

  // 装备（通用，不强指向）
  {
    id: "equip-collar",
    name: "强攻护符",
    category: "equipment",
    price: 30,
    icon: "⚔️",
    description: "对战道具：本场下一回合攻击力 +50。",
    battleHint: "效果：立即获得 1 回合 +50 攻击力",
    effect: {},
  },
  {
    id: "equip-tag",
    name: "守护护盾",
    category: "equipment",
    price: 28,
    icon: "🛡️",
    description: "对战道具：抵挡一次来自对手的攻击伤害。",
    battleHint: "效果：本场触发 1 次伤害免疫",
    effect: {},
  },
  {
    id: "equip-bell",
    name: "连击推进器",
    category: "equipment",
    price: 24,
    icon: "💥",
    description: "对战道具：答题正确时额外叠加 1 层连击。",
    battleHint: "效果：本场连击增长速度提升",
    effect: {},
  },
  {
    id: "equip-bandana",
    name: "应急药剂",
    category: "equipment",
    price: 22,
    icon: "🧪",
    description: "对战道具：立即恢复 80 点生命值（单次）。",
    battleHint: "效果：本场可触发 1 次即时回复",
    effect: {},
  },
  {
    id: "equip-badge",
    name: "破甲符文",
    category: "equipment",
    price: 27,
    icon: "🪓",
    description: "对战道具：下一次攻击无视对方 30% 防护。",
    battleHint: "效果：本场生效 1 次破防攻击",
    effect: {},
  },
  {
    id: "equip-charm",
    name: "反击棱镜",
    category: "equipment",
    price: 29,
    icon: "🔮",
    description: "对战道具：受击后反弹 25% 伤害（一次）。",
    battleHint: "效果：本场触发 1 次伤害反弹",
    effect: {},
  },
]

export const SHOP_ACTION_REQUIREMENTS: Record<PetInteractAction, PetShopCategory> = {
  feed: "food",
  train: "training",
  sleep: "rest",
  play: "toy",
}

const itemById = new Map(PET_SHOP_ITEMS.map((item) => [item.id, item]))

export const DEFAULT_PET_SHOP_ITEMS: PetShopItem[] = PET_SHOP_ITEMS

export function findShopItem(itemId: string) {
  return itemById.get(itemId) ?? null
}

export function listItemsByCategory(category: PetShopCategory, items: PetShopItem[] = PET_SHOP_ITEMS) {
  return items.filter((item) => item.category === category)
}

export function findShopItemIn(items: PetShopItem[], itemId: string) {
  return items.find((item) => item.id === itemId) ?? null
}

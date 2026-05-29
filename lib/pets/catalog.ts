export type PetSpecies = "dog" | "cat" | "rabbit" | "hamster" | "bird" | "pig" | "turtle" | "lizard"

export const PET_SPECIES_LABEL: Record<PetSpecies, string> = {
  dog: "狗",
  cat: "猫",
  rabbit: "兔",
  hamster: "鼠",
  bird: "鸟",
  pig: "猪",
  turtle: "龟",
  lizard: "蜥蜴",
}

export const PET_SPECIES_EMOJI: Record<PetSpecies, string> = {
  dog: "🐕",
  cat: "🐱",
  rabbit: "🐰",
  hamster: "🐹",
  bird: "🐦",
  pig: "🐷",
  turtle: "🐢",
  lizard: "🦎",
}

export const PET_BREEDS: Record<PetSpecies, string[]> = {
  dog: ["土松犬", "柯基", "哈士奇", "斗牛犬", "泰迪"],
  cat: ["美短", "狸花", "布偶"],
  rabbit: ["荷兰侏儒兔", "长毛垂耳兔"],
  hamster: ["仓鼠", "龙猫"],
  bird: ["鹦鹉"],
  pig: ["小香猪"],
  turtle: ["地图龟"],
  lizard: ["守宫"],
}

export const PET_COLORS = [
  { id: "cream", label: "奶油色", hex: "#f4d8b0" },
  { id: "brown", label: "棕色", hex: "#b97a57" },
  { id: "white", label: "白色", hex: "#f4f4f5" },
  { id: "gray", label: "灰色", hex: "#a1a1aa" },
  { id: "black", label: "黑色", hex: "#52525b" },
  { id: "gold", label: "金色", hex: "#eab308" },
] as const

export type PetColorId = (typeof PET_COLORS)[number]["id"]

export function resolvePetEmoji(species: string) {
  if (species in PET_SPECIES_EMOJI) {
    return PET_SPECIES_EMOJI[species as PetSpecies]
  }
  return "🐕"
}


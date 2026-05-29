import type { AdventureRegionId } from "@/lib/library/adventure-regions"

export const REGION_UI_META: Record<
  AdventureRegionId,
  { icon: string; color: string; bgColor: string; difficulty: string }
> = {
  "magic-forest": {
    icon: "🌲",
    color: "from-emerald-400 to-emerald-600",
    bgColor: "bg-emerald-500/10",
    difficulty: "初级",
  },
  "ice-mountain": {
    icon: "❄️",
    color: "from-cyan-400 to-blue-500",
    bgColor: "bg-cyan-500/10",
    difficulty: "中级",
  },
  "ancient-desert": {
    icon: "☀️",
    color: "from-amber-400 to-orange-500",
    bgColor: "bg-amber-500/10",
    difficulty: "中级",
  },
  "ocean-ruins": {
    icon: "🌊",
    color: "from-blue-400 to-indigo-500",
    bgColor: "bg-blue-500/10",
    difficulty: "高级",
  },
  "sky-kingdom": {
    icon: "☁️",
    color: "from-violet-400 to-purple-500",
    bgColor: "bg-violet-500/10",
    difficulty: "高级",
  },
  "dream-tower": {
    icon: "🌙",
    color: "from-violet-500 to-fuchsia-500",
    bgColor: "bg-violet-500/10",
    difficulty: "极难",
  },
}

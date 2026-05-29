import type { LucideIcon } from "lucide-react"
import { Crown, Shield } from "lucide-react"

import type { ProfileRankBadge } from "@/lib/profile/rank-badge"

export interface RankConfigEntry {
  label: string
  gradient: string
  icon: LucideIcon
}

export const profileRankConfig: Record<ProfileRankBadge, RankConfigEntry> = {
  bronze: {
    label: "青铜冒险家",
    gradient: "from-amber-600 to-amber-800",
    icon: Shield,
  },
  silver: {
    label: "白银冒险家",
    gradient: "from-slate-300 to-slate-500",
    icon: Shield,
  },
  gold: {
    label: "黄金守护者",
    gradient: "from-amber-400 to-yellow-500",
    icon: Crown,
  },
  diamond: {
    label: "钻石传说",
    gradient: "from-cyan-300 to-blue-500",
    icon: Crown,
  },
  master: {
    label: "至尊大师",
    gradient: "from-violet-400 via-fuchsia-400 to-amber-400",
    icon: Crown,
  },
}

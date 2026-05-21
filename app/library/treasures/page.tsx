"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  ChevronLeft, Bell, Gift, Star, Lock, Sparkles, 
  Crown, Gem, Wand2, Check
} from "lucide-react"
import { BottomNavigation } from "@/components/game/bottom-navigation"

type RewardRarity = "rare" | "epic" | "legendary"
type RewardType = "pet" | "skin" | "badge" | "area" | "item" | "title"

interface Reward {
  id: string
  name: string
  icon: string
  type: RewardType
  rarity: RewardRarity
  requirement: string
  progress: number
  unlocked: boolean
  description: string
}

const allRewards: Reward[] = [
  { id: "1", name: "星空精灵", icon: "✨", type: "pet", rarity: "legendary", requirement: "完成《小王子》", progress: 100, unlocked: true, description: "来自遥远星球的神秘生物" },
  { id: "2", name: "魔法斗篷", icon: "🧥", type: "skin", rarity: "epic", requirement: "收集30颗星星", progress: 60, unlocked: false, description: "隐身于黑夜的神奇披风" },
  { id: "3", name: "阅读达人", icon: "🏅", type: "title", rarity: "rare", requirement: "连续阅读7天", progress: 85, unlocked: false, description: "展示你的阅读成就" },
  { id: "4", name: "神秘岛屿", icon: "🏝️", type: "area", rarity: "legendary", requirement: "完成5本史诗书籍", progress: 40, unlocked: false, description: "隐藏的冒险新大陆" },
  { id: "5", name: "龙蛋", icon: "🥚", type: "item", rarity: "epic", requirement: "解锁3个世界", progress: 66, unlocked: false, description: "沉睡的远古生命" },
  { id: "6", name: "彩虹翅膀", icon: "🦋", type: "skin", rarity: "legendary", requirement: "收集50颗星星", progress: 36, unlocked: false, description: "七彩斑斓的飞行装备" },
  { id: "7", name: "森林守护者", icon: "🌲", type: "title", rarity: "epic", requirement: "完成森林世界", progress: 75, unlocked: false, description: "保护森林的勇士称号" },
  { id: "8", name: "水晶球", icon: "🔮", type: "item", rarity: "rare", requirement: "阅读10本书", progress: 80, unlocked: false, description: "预见未来的神秘物品" },
  { id: "9", name: "小龙伙伴", icon: "🐉", type: "pet", rarity: "legendary", requirement: "完成《西游记》", progress: 15, unlocked: false, description: "忠诚勇敢的小龙" },
  { id: "10", name: "探险家徽章", icon: "🎖️", type: "badge", rarity: "rare", requirement: "探索3个世界", progress: 100, unlocked: true, description: "勇敢探险者的证明" },
  { id: "11", name: "魔法帽", icon: "🎩", type: "skin", rarity: "epic", requirement: "连续阅读14天", progress: 50, unlocked: false, description: "充满魔力的帽子" },
  { id: "12", name: "海洋之心", icon: "💎", type: "item", rarity: "legendary", requirement: "完成深海世界", progress: 0, unlocked: false, description: "来自深海的珍贵宝石" },
]

const rarityStyles: Record<RewardRarity, {
  border: string
  bg: string
  glow: string
  badge: string
  text: string
}> = {
  rare: { border: "border-blue-400", bg: "from-blue-100 to-cyan-50", glow: "shadow-[0_0_15px_rgba(59,130,246,0.25)]", badge: "from-blue-500 to-cyan-500", text: "text-blue-600" },
  epic: { border: "border-purple-400", bg: "from-purple-100 to-pink-50", glow: "shadow-[0_0_20px_rgba(168,85,247,0.35)]", badge: "from-purple-500 to-pink-500", text: "text-purple-600" },
  legendary: { border: "border-amber-400", bg: "from-amber-100 to-yellow-50", glow: "shadow-[0_0_25px_rgba(251,191,36,0.45)]", badge: "from-amber-400 to-orange-500", text: "text-amber-600" },
}

const typeLabels: Record<RewardType, { label: string, icon: typeof Gift }> = {
  pet: { label: "神奇宠物", icon: Sparkles },
  skin: { label: "魔法装扮", icon: Wand2 },
  badge: { label: "荣耀徽章", icon: Crown },
  area: { label: "秘境地图", icon: Gem },
  item: { label: "神秘道具", icon: Gift },
  title: { label: "称号", icon: Crown },
}

export default function TreasuresPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<"all" | "unlocked" | "inProgress" | "locked">("all")
  const [typeFilter, setTypeFilter] = useState<RewardType | "all">("all")

  const filteredRewards = allRewards.filter(reward => {
    const matchesStatus = 
      filter === "all" ||
      (filter === "unlocked" && reward.unlocked) ||
      (filter === "inProgress" && !reward.unlocked && reward.progress > 0) ||
      (filter === "locked" && !reward.unlocked && reward.progress === 0)
    const matchesType = typeFilter === "all" || reward.type === typeFilter
    return matchesStatus && matchesType
  })

  const handleNavigation = (item: string) => {
    if (item === "home") router.push("/")
    if (item === "library") router.push("/library")
    if (item === "adventure") router.push("/adventure")
    if (item === "pets") router.push("/pets")
    if (item === "profile") router.push("/profile")
  }

  const unlockedCount = allRewards.filter(r => r.unlocked).length

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => router.push("/library")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-500" />
            <h1 className="text-lg font-bold">神秘宝藏</h1>
          </div>
          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 hover:bg-muted transition-colors">
            <Bell className="h-5 w-5" />
          </button>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {[
            { id: "all", label: "全部宝藏" },
            { id: "unlocked", label: "已获得" },
            { id: "inProgress", label: "解锁中" },
            { id: "locked", label: "待解锁" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as typeof filter)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                filter === tab.id
                  ? "bg-purple-500 text-white"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {[
            { id: "all", label: "全部类型" },
            { id: "pet", label: "宠物" },
            { id: "skin", label: "装扮" },
            { id: "badge", label: "徽章" },
            { id: "area", label: "地图" },
            { id: "item", label: "道具" },
            { id: "title", label: "称号" },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setTypeFilter(type.id as typeof typeFilter)}
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all",
                typeFilter === type.id
                  ? "bg-foreground text-background"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats banner */}
      <div className="px-4 py-3">
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 rounded-2xl p-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs mb-1">宝藏收集进度</p>
              <p className="text-white text-2xl font-bold">{unlockedCount}/{allRewards.length}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                <span className="text-white/80 text-xs">稀有</span>
                <span className="text-white font-bold text-sm">{allRewards.filter(r => r.rarity === "rare" && r.unlocked).length}/{allRewards.filter(r => r.rarity === "rare").length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-white/80 text-xs">史诗</span>
                <span className="text-white font-bold text-sm">{allRewards.filter(r => r.rarity === "epic" && r.unlocked).length}/{allRewards.filter(r => r.rarity === "epic").length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-white/80 text-xs">传说</span>
                <span className="text-white font-bold text-sm">{allRewards.filter(r => r.rarity === "legendary" && r.unlocked).length}/{allRewards.filter(r => r.rarity === "legendary").length}</span>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="relative mt-3">
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                style={{ width: `${(unlockedCount / allRewards.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rewards grid */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredRewards.map((reward) => {
            const style = rarityStyles[reward.rarity]
            const TypeIcon = typeLabels[reward.type].icon
            
            return (
              <button
                key={reward.id}
                className={cn(
                  "relative rounded-2xl border-2 overflow-hidden transition-all duration-300",
                  `bg-gradient-to-b ${style.bg}`,
                  style.border,
                  reward.unlocked ? style.glow : "",
                  "hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {/* Rarity bar */}
                <div className={cn("h-1.5 bg-gradient-to-r", style.badge)} />

                <div className="p-3">
                  {/* Icon */}
                  <div className={cn(
                    "relative w-16 h-16 mx-auto mb-2 rounded-2xl flex items-center justify-center",
                    "bg-white/70 backdrop-blur-sm border border-white/50",
                    !reward.unlocked && "grayscale opacity-60"
                  )}>
                    <span className="text-4xl drop-shadow-lg">{reward.icon}</span>
                    
                    {reward.unlocked ? (
                      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center border-2 border-white">
                        <Lock className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Name & type */}
                  <p className="text-sm font-bold text-foreground text-center mb-0.5">{reward.name}</p>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <TypeIcon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{typeLabels[reward.type].label}</span>
                  </div>

                  {/* Description */}
                  <p className="text-[10px] text-muted-foreground text-center mb-2 line-clamp-2">{reward.description}</p>

                  {/* Status */}
                  {reward.unlocked ? (
                    <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      <span className="text-[10px] font-bold text-amber-700">已获得</span>
                    </div>
                  ) : (
                    <div>
                      <div className="h-2 rounded-full bg-gray-200/80 overflow-hidden mb-1">
                        <div
                          className={cn("h-full rounded-full bg-gradient-to-r", style.badge)}
                          style={{ width: `${reward.progress}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground text-center">{reward.requirement}</p>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeItem="library" onNavigate={handleNavigation} />
    </div>
  )
}

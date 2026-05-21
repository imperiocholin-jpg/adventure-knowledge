"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  ChevronLeft, 
  Gift, 
  Gem, 
  Key, 
  Sparkles,
  Lock,
  Star,
  Crown,
  Scroll,
  Eye,
  Filter,
  CheckCircle2,
  Clock,
  Zap,
  Shield,
  Heart,
  Map
} from "lucide-react"
import { BottomNavigation } from "@/components/game/bottom-navigation"

type FilterType = "all" | "unlocked" | "locked" | "rare" | "epic" | "legendary"

const allDiscoveries = [
  {
    id: 1,
    name: "神秘宝箱",
    icon: Gift,
    rarity: "rare",
    unlocked: true,
    unlockedAt: "2024-01-15",
    description: "完成3个关卡后可开启",
    source: "魔法森林第3关",
    color: "text-violet-500",
    bgGradient: "from-violet-400/30 to-purple-500/20",
  },
  {
    id: 2,
    name: "精灵水晶",
    icon: Gem,
    rarity: "epic",
    unlocked: true,
    unlockedAt: "2024-01-18",
    description: "收集100颗星星",
    source: "成就奖励",
    color: "text-cyan-500",
    bgGradient: "from-cyan-400/30 to-blue-500/20",
  },
  {
    id: 3,
    name: "古老钥匙",
    icon: Key,
    rarity: "legendary",
    unlocked: false,
    description: "击败魔法森林BOSS",
    progress: 0,
    total: 1,
    color: "text-amber-500",
    bgGradient: "from-amber-400/30 to-orange-500/20",
  },
  {
    id: 4,
    name: "勇气徽章",
    icon: Shield,
    rarity: "rare",
    unlocked: true,
    unlockedAt: "2024-01-10",
    description: "首次完成冒险关卡",
    source: "新手任务",
    color: "text-emerald-500",
    bgGradient: "from-emerald-400/30 to-green-500/20",
  },
  {
    id: 5,
    name: "智慧之书",
    icon: Scroll,
    rarity: "epic",
    unlocked: false,
    description: "阅读完成10本书籍",
    progress: 8,
    total: 10,
    color: "text-indigo-500",
    bgGradient: "from-indigo-400/30 to-blue-500/20",
  },
  {
    id: 6,
    name: "友谊之心",
    icon: Heart,
    rarity: "rare",
    unlocked: true,
    unlockedAt: "2024-01-20",
    description: "与宠物互动100次",
    source: "宠物系统",
    color: "text-pink-500",
    bgGradient: "from-pink-400/30 to-rose-500/20",
  },
  {
    id: 7,
    name: "闪电能量",
    icon: Zap,
    rarity: "epic",
    unlocked: false,
    description: "连续7天完成任务",
    progress: 5,
    total: 7,
    color: "text-yellow-500",
    bgGradient: "from-yellow-400/30 to-amber-500/20",
  },
  {
    id: 8,
    name: "传说王冠",
    icon: Crown,
    rarity: "legendary",
    unlocked: false,
    description: "达到冒险等级20",
    progress: 12,
    total: 20,
    color: "text-amber-600",
    bgGradient: "from-amber-500/30 to-yellow-500/20",
  },
  {
    id: 9,
    name: "探险家地图",
    icon: Map,
    rarity: "rare",
    unlocked: false,
    description: "解锁3个冒险区域",
    progress: 2,
    total: 3,
    color: "text-teal-500",
    bgGradient: "from-teal-400/30 to-cyan-500/20",
  },
]

const hiddenSecrets = [
  { id: 1, name: "迷雾之门", found: true, description: "在森林深处发现的神秘传送门", region: "魔法森林" },
  { id: 2, name: "精灵石碑", found: true, description: "记载着古老智慧的神秘石碑", region: "魔法森林" },
  { id: 3, name: "隐藏通道", found: false, hint: "需要特殊钥匙", region: "冰雪之巅" },
  { id: 4, name: "时光裂缝", found: false, hint: "传说中的时间通道", region: "远古沙漠" },
  { id: 5, name: "星空之眼", found: false, hint: "只在夜晚出现", region: "天空王国" },
]

const rarityConfig = {
  rare: { label: "稀有", color: "text-violet-600", bg: "bg-gradient-to-r from-violet-500 to-purple-600" },
  epic: { label: "史诗", color: "text-cyan-600", bg: "bg-gradient-to-r from-cyan-500 to-blue-600" },
  legendary: { label: "传说", color: "text-amber-600", bg: "bg-gradient-to-r from-amber-500 to-orange-600" },
}

export default function CollectionPage() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [activeTab, setActiveTab] = useState<"treasures" | "secrets">("treasures")

  const filteredDiscoveries = allDiscoveries.filter(item => {
    if (activeFilter === "all") return true
    if (activeFilter === "unlocked") return item.unlocked
    if (activeFilter === "locked") return !item.unlocked
    return item.rarity === activeFilter
  })

  const unlockedCount = allDiscoveries.filter(d => d.unlocked).length
  const foundSecrets = hiddenSecrets.filter(s => s.found).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-purple-50/50 to-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/40">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/90 shadow-md border border-white/60"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          
          <div className="flex items-center gap-2">
            <Gem className="h-4 w-4 text-violet-500" />
            <h1 className="text-base font-bold text-foreground">收藏室</h1>
          </div>
          
          <div className="w-9" />
        </div>
      </header>

      {/* Stats banner */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl p-4 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs">收藏进度</p>
              <p className="text-2xl font-bold">{unlockedCount}/{allDiscoveries.length}</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-xl font-bold">{allDiscoveries.filter(d => d.rarity === "rare" && d.unlocked).length}</p>
                <p className="text-[10px] text-white/70">稀有</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{allDiscoveries.filter(d => d.rarity === "epic" && d.unlocked).length}</p>
                <p className="text-[10px] text-white/70">史诗</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{allDiscoveries.filter(d => d.rarity === "legendary" && d.unlocked).length}</p>
                <p className="text-[10px] text-white/70">传说</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
          <button
            onClick={() => setActiveTab("treasures")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "treasures" 
                ? "bg-white shadow-md text-foreground" 
                : "text-muted-foreground"
            )}
          >
            <Gift className="h-4 w-4" />
            宝物收藏
          </button>
          <button
            onClick={() => setActiveTab("secrets")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "secrets" 
                ? "bg-white shadow-md text-foreground" 
                : "text-muted-foreground"
            )}
          >
            <Eye className="h-4 w-4" />
            神秘发现
            <span className="text-[10px] bg-violet-500/20 text-violet-600 px-1.5 rounded-full">
              {foundSecrets}/{hiddenSecrets.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === "treasures" && (
        <>
          {/* Filters */}
          <div className="px-4 mb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex items-center gap-1 text-muted-foreground mr-1">
                <Filter className="h-3.5 w-3.5" />
              </div>
              {[
                { key: "all", label: "全部" },
                { key: "unlocked", label: "已获得" },
                { key: "locked", label: "未解锁" },
                { key: "rare", label: "稀有" },
                { key: "epic", label: "史诗" },
                { key: "legendary", label: "传说" },
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key as FilterType)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                    activeFilter === filter.key
                      ? "bg-violet-500 text-white shadow-md"
                      : "bg-white/80 text-muted-foreground border border-border/50"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Collection grid */}
          <div className="px-4 grid grid-cols-2 gap-3">
            {filteredDiscoveries.map((item) => {
              const Icon = item.icon
              const rarity = rarityConfig[item.rarity as keyof typeof rarityConfig]
              
              return (
                <div
                  key={item.id}
                  className={cn(
                    "relative overflow-hidden rounded-2xl p-3",
                    "bg-white/90 backdrop-blur-sm border shadow-md",
                    item.unlocked ? "border-primary/30" : "border-gray-200/50"
                  )}
                >
                  {/* Unlocked indicator */}
                  {item.unlocked && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  {/* Icon */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center mb-2",
                      `bg-gradient-to-br ${item.bgGradient}`,
                      !item.unlocked && "opacity-50 grayscale"
                    )}>
                      {item.unlocked ? (
                        <Icon className={cn("h-7 w-7", item.color)} />
                      ) : (
                        <Lock className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Rarity badge */}
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-full text-white mb-1",
                      rarity.bg
                    )}>
                      {rarity.label}
                    </span>
                    
                    {/* Name */}
                    <span className={cn(
                      "text-xs font-bold text-center",
                      item.unlocked ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {item.name}
                    </span>
                    
                    {/* Progress or source */}
                    {item.unlocked ? (
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        {item.source}
                      </span>
                    ) : (
                      <div className="w-full mt-2">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full", rarity.bg)}
                            style={{ width: `${((item.progress || 0) / (item.total || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-muted-foreground">
                          {item.progress}/{item.total}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {activeTab === "secrets" && (
        <div className="px-4 space-y-3">
          {hiddenSecrets.map((secret) => (
            <div
              key={secret.id}
              className={cn(
                "p-4 rounded-2xl border transition-all",
                secret.found 
                  ? "bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-400/30" 
                  : "bg-white/80 border-gray-200/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  secret.found 
                    ? "bg-violet-500/20" 
                    : "bg-gray-100"
                )}>
                  {secret.found ? (
                    <Scroll className="h-5 w-5 text-violet-500" />
                  ) : (
                    <span className="text-xl">❓</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-bold",
                      secret.found ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {secret.found ? secret.name : "???"}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {secret.region}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {secret.found ? secret.description : secret.hint}
                  </p>
                </div>
                {secret.found && (
                  <CheckCircle2 className="h-5 w-5 text-violet-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomNavigation activeItem="adventure" onNavigate={(item) => {
        if (item === "home") router.push("/")
        if (item === "library") router.push("/library")
        if (item === "pets") router.push("/pets")
        if (item === "profile") router.push("/profile")
      }} />
    </div>
  )
}

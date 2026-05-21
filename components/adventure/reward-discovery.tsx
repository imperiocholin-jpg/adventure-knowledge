"use client"

import { cn } from "@/lib/utils"
import { 
  Gift, 
  Gem, 
  Key, 
  Sparkles,
  ChevronRight,
  Lock,
  Star,
  Eye,
  Crown,
  Scroll
} from "lucide-react"

interface RewardDiscoveryProps {
  className?: string
  onViewCollection?: () => void
}

const discoveries = [
  {
    id: 1,
    name: "神秘宝箱",
    icon: Gift,
    rarity: "rare",
    unlocked: true,
    description: "完成3个关卡后可开启",
    progress: 3,
    total: 3,
    color: "text-violet-500",
    bgGradient: "from-violet-400/30 to-purple-500/20",
    glowColor: "rgba(139,92,246,0.4)"
  },
  {
    id: 2,
    name: "精灵水晶",
    icon: Gem,
    rarity: "epic",
    unlocked: false,
    description: "收集100颗星星",
    progress: 87,
    total: 100,
    color: "text-cyan-500",
    bgGradient: "from-cyan-400/30 to-blue-500/20",
    glowColor: "rgba(34,211,238,0.4)"
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
    glowColor: "rgba(251,191,36,0.4)"
  },
]

const rarityConfig = {
  rare: { label: "稀有", color: "text-violet-600", bg: "bg-gradient-to-r from-violet-500 to-purple-600", border: "border-violet-400/50" },
  epic: { label: "史诗", color: "text-cyan-600", bg: "bg-gradient-to-r from-cyan-500 to-blue-600", border: "border-cyan-400/50" },
  legendary: { label: "传说", color: "text-amber-600", bg: "bg-gradient-to-r from-amber-500 to-orange-600", border: "border-amber-400/50" },
}

const hiddenSecrets = [
  { id: 1, name: "迷雾之门", found: false, hint: "在森林深处..." },
  { id: 2, name: "精灵石碑", found: true, hint: "已发现" },
  { id: 3, name: "隐藏通道", found: false, hint: "需要特殊钥匙" },
]

export function RewardDiscovery({ className, onViewCollection }: RewardDiscoveryProps) {
  return (
    <div className={cn("px-4", className)}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
            <Gem className="h-3.5 w-3.5 text-white" />
            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-300 animate-pulse" />
          </div>
          <h3 className="text-sm font-bold text-foreground">探索发现</h3>
        </div>
        <button 
          onClick={onViewCollection}
          className="flex items-center gap-0.5 text-xs text-primary font-medium hover:underline"
        >
          收藏室
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      
      {/* Discoveries list - enhanced cards */}
      <div className="space-y-2.5">
        {discoveries.map((item) => {
          const Icon = item.icon
          const rarity = rarityConfig[item.rarity as keyof typeof rarityConfig]
          const progressPercent = (item.progress / item.total) * 100
          
          return (
            <div
              key={item.id}
              className={cn(
                "relative overflow-hidden rounded-2xl",
                "bg-gradient-to-br from-white/95 to-white/80 backdrop-blur-sm",
                "border shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
                item.unlocked ? "border-primary/40" : rarity.border
              )}
            >
              {/* Background glow for unlocked */}
              {item.unlocked && (
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{ background: `radial-gradient(circle at 30% 50%, ${item.glowColor}, transparent 70%)` }}
                />
              )}
              
              {/* Shimmer effect for unlocked items */}
              {item.unlocked && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_3s_ease-in-out_infinite] -translate-x-full" />
              )}
              
              <div className="relative p-3 flex items-center gap-3">
                {/* Icon with enhanced styling */}
                <div className="relative">
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-xl",
                    `bg-gradient-to-br ${item.bgGradient}`,
                    "shadow-inner"
                  )}>
                    <Icon className={cn("h-6 w-6", item.color)} />
                  </div>
                  
                  {/* Unlocked pulse ring */}
                  {item.unlocked && (
                    <div className="absolute inset-0 rounded-xl border-2 border-primary/50 animate-[pulse_2s_ease-in-out_infinite]" />
                  )}
                  
                  {/* Rarity corner badge */}
                  <div className={cn(
                    "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-md",
                    rarity.bg
                  )}>
                    {item.rarity === "legendary" && <Crown className="h-2.5 w-2.5 text-white" />}
                    {item.rarity === "epic" && <Star className="h-2.5 w-2.5 text-white fill-white" />}
                    {item.rarity === "rare" && <Gem className="h-2.5 w-2.5 text-white" />}
                  </div>
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{item.name}</span>
                    <span className={cn(
                      "text-[8px] font-bold px-1.5 py-0.5 rounded-full",
                      rarity.bg,
                      "text-white uppercase tracking-wide"
                    )}>
                      {rarity.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.description}</p>
                  
                  {/* Progress bar for locked items */}
                  {!item.unlocked && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-700",
                            rarity.bg
                          )}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground min-w-[40px] text-right">
                        {item.progress}/{item.total}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Action button */}
                <button
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl transition-all",
                    item.unlocked
                      ? "bg-gradient-to-br from-primary to-emerald-500 text-white shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                  disabled={!item.unlocked}
                >
                  {item.unlocked ? (
                    <Gift className="h-5 w-5" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Hidden secrets section */}
      <div className="mt-4 p-3 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-purple-500/10 rounded-2xl border border-violet-500/20 relative overflow-hidden">
        {/* Mystical background effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(139,92,246,0.15),transparent_50%)]" />
        <div className="absolute top-2 right-2 opacity-20">
          <Eye className="h-16 w-16 text-violet-500" />
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Eye className="h-3.5 w-3.5 text-violet-500" />
            </div>
            <h4 className="text-xs font-bold text-foreground">神秘区域</h4>
            <span className="text-[9px] text-violet-500 font-medium">1/3 已发现</span>
          </div>
          
          <div className="flex gap-2">
            {hiddenSecrets.map((secret) => (
              <div 
                key={secret.id}
                className={cn(
                  "flex-1 p-2 rounded-xl border transition-all",
                  secret.found 
                    ? "bg-violet-500/20 border-violet-400/40" 
                    : "bg-white/50 border-gray-200/50"
                )}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {secret.found ? (
                    <Scroll className="h-3 w-3 text-violet-500" />
                  ) : (
                    <span className="text-xs">❓</span>
                  )}
                  <span className={cn(
                    "text-[10px] font-semibold truncate",
                    secret.found ? "text-violet-600" : "text-gray-400"
                  )}>
                    {secret.found ? secret.name : "???"}
                  </span>
                </div>
                <p className="text-[9px] text-muted-foreground truncate">{secret.hint}</p>
              </div>
            ))}
          </div>
          
          <p className="mt-2 text-[10px] text-muted-foreground text-center italic">
            {"\"探索地图的每个角落，也许会发现意想不到的秘密...\""}
          </p>
        </div>
      </div>
      
      {/* CSS */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}

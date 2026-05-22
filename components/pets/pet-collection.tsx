"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Lock, Star, Check, ChevronRight, Crown, Sparkles, Heart } from "lucide-react"

interface Pet {
  id: string
  name: string
  emoji: string
  rarity: "common" | "rare" | "epic" | "legendary"
  type: "corgi" | "cat" | "rabbit" | "hamster" | "shiba" | "parrot" | "turtle" | "capybara"
  unlocked: boolean
  isActive: boolean
}

interface PetCollectionProps {
  pets?: Pet[]
  onSelectPet?: (petId: string) => void
  onViewDetails?: (petId: string) => void
}

// Using household pets as requested
const defaultPets: Pet[] = [
  { id: "1", name: "毛毛", emoji: "🐕", type: "corgi", rarity: "epic", unlocked: true, isActive: true },
  { id: "2", name: "小白", emoji: "🐰", type: "rabbit", rarity: "rare", unlocked: true, isActive: false },
  { id: "3", name: "咪咪", emoji: "🐱", type: "cat", rarity: "rare", unlocked: true, isActive: false },
  { id: "4", name: "球球", emoji: "🐹", type: "hamster", rarity: "common", unlocked: true, isActive: false },
  { id: "5", name: "旺财", emoji: "🐕", type: "shiba", rarity: "legendary", unlocked: false, isActive: false },
  { id: "6", name: "彩虹", emoji: "🦜", type: "parrot", rarity: "epic", unlocked: false, isActive: false },
  { id: "7", name: "慢慢", emoji: "🐢", type: "turtle", rarity: "common", unlocked: false, isActive: false },
  { id: "8", name: "水豚君", emoji: "🦫", type: "capybara", rarity: "legendary", unlocked: false, isActive: false },
]

export function PetCollection({
  pets = defaultPets,
  onSelectPet,
  onViewDetails,
}: PetCollectionProps) {
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all")
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)

  const rarityConfig = {
    common: { 
      label: "普通", 
      gradient: "from-slate-300 to-slate-400", 
      border: "border-slate-200",
      bg: "bg-slate-50",
      glow: "",
      stars: 1,
    },
    rare: { 
      label: "稀有", 
      gradient: "from-blue-400 to-cyan-400", 
      border: "border-blue-200",
      bg: "bg-blue-50",
      glow: "shadow-[0_0_15px_rgba(59,130,246,0.2)]",
      stars: 2,
    },
    epic: { 
      label: "史诗", 
      gradient: "from-violet-400 to-fuchsia-400", 
      border: "border-violet-200",
      bg: "bg-violet-50",
      glow: "shadow-[0_0_20px_rgba(168,85,247,0.25)]",
      stars: 3,
    },
    legendary: { 
      label: "传说", 
      gradient: "from-amber-400 to-orange-400", 
      border: "border-amber-200",
      bg: "bg-amber-50",
      glow: "shadow-[0_0_25px_rgba(251,191,36,0.3)]",
      stars: 4,
    },
  }

  const filteredPets = pets.filter((pet) => {
    if (filter === "unlocked") return pet.unlocked
    if (filter === "locked") return !pet.unlocked
    return true
  })

  const unlockedCount = pets.filter(p => p.unlocked).length
  const totalCount = pets.length

  const handlePetClick = (pet: Pet) => {
    if (pet.unlocked) {
      setSelectedPet(pet)
      onSelectPet?.(pet.id)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header card with collection progress */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 border border-amber-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">宠物图鉴</h3>
              <p className="text-xs text-muted-foreground">收集可爱的伙伴们</p>
            </div>
          </div>
          
          {/* Collection progress ring */}
          <div className="relative w-14 h-14">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="4"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="url(#progress-gradient)"
                strokeWidth="4"
                strokeDasharray={`${(unlockedCount / totalCount) * 150} 150`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-amber-600">{unlockedCount}/{totalCount}</span>
            </div>
          </div>
        </div>
        
        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { id: "all", label: "全部" },
            { id: "unlocked", label: "已解锁" },
            { id: "locked", label: "待解锁" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as typeof filter)}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200",
                filter === tab.id 
                  ? "bg-white text-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-white/50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pet grid - larger cards for emotional connection */}
      <div className="grid grid-cols-2 gap-3">
        {filteredPets.map((pet) => {
          const config = rarityConfig[pet.rarity]
          
          return (
            <button
              key={pet.id}
              onClick={() => handlePetClick(pet)}
              className={cn(
                "relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-300",
                pet.unlocked 
                  ? cn(config.border, config.glow, config.bg, "hover:scale-[1.02] active:scale-[0.98]")
                  : "border-muted bg-muted/20"
              )}
            >
              {/* Active badge */}
              {pet.isActive && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary text-[9px] font-bold text-white flex items-center gap-0.5">
                  <Check className="h-2.5 w-2.5" />
                  当前
                </div>
              )}
              
              {/* Pet avatar */}
              <div className={cn(
                "relative w-16 h-16 rounded-2xl flex items-center justify-center mb-2 transition-all",
                pet.unlocked 
                  ? cn("bg-gradient-to-br shadow-lg", config.gradient)
                  : "bg-muted"
              )}>
                {pet.unlocked ? (
                  <>
                    <span className="text-3xl">{pet.emoji}</span>
                    {pet.rarity === "legendary" && (
                      <div className="absolute -top-1 -right-1">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="relative">
                    <span className="text-3xl opacity-20">{pet.emoji}</span>
                    <Lock className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Pet name */}
              <span className={cn(
                "text-sm font-bold mb-1",
                pet.unlocked ? "text-foreground" : "text-muted-foreground"
              )}>
                {pet.unlocked ? pet.name : "???"}
              </span>
              
              {/* Rarity indicator */}
              <div className="flex items-center gap-1">
                {[...Array(config.stars)].map((_, i) => (
                  <Star 
                    key={i}
                    className={cn(
                      "h-3 w-3",
                      pet.unlocked 
                        ? "text-amber-400 fill-amber-400" 
                        : "text-muted-foreground/20 fill-muted-foreground/20"
                    )}
                  />
                ))}
              </div>
              
              {/* Unlock hint for locked pets */}
              {!pet.unlocked && (
                <p className="text-[9px] text-muted-foreground mt-2 text-center">
                  {pet.rarity === "legendary" ? "完成特殊任务解锁" : "通过阅读解锁"}
                </p>
              )}
              
              {/* Affection for unlocked pets */}
              {pet.unlocked && !pet.isActive && (
                <div className="flex items-center gap-1 mt-2">
                  <Heart className="h-3 w-3 text-pink-400" />
                  <span className="text-[10px] text-muted-foreground">点击切换</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* View all button */}
      <button className="w-full flex items-center justify-center gap-1 py-3 text-sm font-medium text-primary hover:underline bg-primary/5 rounded-xl">
        查看更多伙伴
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

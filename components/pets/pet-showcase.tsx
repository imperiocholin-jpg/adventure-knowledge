"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Heart, Sparkles, Star, Crown, Volume2, VolumeX, Utensils, Gamepad2, Moon, Dumbbell, Shirt } from "lucide-react"
import { Pet2DScene } from "./pet-2d-scene"

interface PetShowcaseProps {
  petEmoji: string
  petName: string
  level: number
  rarity: "common" | "rare" | "epic" | "legendary"
  mood: "happy" | "excited" | "sleepy" | "hungry"
  petType?: "corgi" | "cat" | "rabbit" | "hamster" | "shiba"
  affectionLevel?: number
  companionDays?: number
  onPetTap?: () => void
  onFeed?: () => void
  onPlay?: () => void
  onSleep?: () => void
  onTrain?: () => void
  onDress?: () => void
}

export function PetShowcase({
  petEmoji = "🐕",
  petName = "毛毛",
  level = 12,
  rarity = "epic",
  mood = "happy",
  petType = "corgi",
  affectionLevel = 85,
  companionDays = 28,
  onPetTap,
  onFeed,
  onPlay,
  onSleep,
  onTrain,
  onDress,
}: PetShowcaseProps) {
  const [isTapped, setIsTapped] = useState(false)
  const [showLove, setShowLove] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [petMessage, setPetMessage] = useState("")
  const [activeAction, setActiveAction] = useState<string | null>(null)

  const rarityConfig = {
    common: { 
      label: "普通", 
      gradient: "from-slate-400 to-slate-500", 
      glow: "",
      borderColor: "border-slate-200"
    },
    rare: { 
      label: "稀有", 
      gradient: "from-blue-400 to-cyan-400", 
      glow: "shadow-[0_0_30px_rgba(96,165,250,0.25)]",
      borderColor: "border-blue-200"
    },
    epic: { 
      label: "史诗", 
      gradient: "from-violet-400 to-fuchsia-400", 
      glow: "shadow-[0_0_40px_rgba(192,132,252,0.3)]",
      borderColor: "border-violet-200"
    },
    legendary: { 
      label: "传说", 
      gradient: "from-amber-400 to-orange-400", 
      glow: "shadow-[0_0_50px_rgba(251,191,36,0.4)]",
      borderColor: "border-amber-200"
    },
  }

  const moodMessages = {
    happy: ["好开心~", "想和你玩!", "嘿嘿~", "摸摸我~"],
    excited: ["太棒了!", "冒险去!", "耶耶!", "好兴奋!"],
    sleepy: ["困了..zzZ", "想睡觉", "打个盹~", "晚安.."],
    hungry: ["肚子饿", "有吃的吗", "想吃零食", "饿饿.."],
  }

  const config = rarityConfig[rarity]

  const handleTap = () => {
    setIsTapped(true)
    setShowLove(true)
    onPetTap?.()
    
    // Show random message
    const messages = moodMessages[mood]
    setPetMessage(messages[Math.floor(Math.random() * messages.length)])
    
    setTimeout(() => setIsTapped(false), 200)
    setTimeout(() => setShowLove(false), 1500)
    setTimeout(() => setPetMessage(""), 2500)
  }

  const handleAction = (action: string, callback?: () => void) => {
    setActiveAction(action)
    callback?.()
    setTimeout(() => setActiveAction(null), 300)
  }

  return (
    <div className="relative">
      {/* Main showcase container - much larger for immersion */}
      <div className={cn(
        "relative rounded-3xl overflow-hidden bg-gradient-to-b from-amber-50/50 to-orange-50/30 border-2",
        config.borderColor,
        config.glow
      )}>
        {/* Top overlay with pet info */}
        <div className="absolute top-0 left-0 right-0 z-30 p-3 bg-gradient-to-b from-white/80 to-transparent">
          <div className="flex items-center justify-between">
            {/* Pet name and level */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">{petEmoji}</span>
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-1">
                  {petName}
                  {rarity === "legendary" && <Star className="h-4 w-4 text-amber-400 fill-amber-400" />}
                </h2>
                <p className="text-xs text-muted-foreground">Lv.{level}</p>
              </div>
            </div>
            
            {/* Rarity badge and sound toggle */}
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-gradient-to-r",
                config.gradient
              )}>
                {rarity === "legendary" && <Crown className="inline h-3 w-3 mr-0.5" />}
                {config.label}
              </span>
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-full bg-white/60 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* 2D Pet Scene - lightweight and fast */}
        <div 
          className="h-[380px] cursor-pointer"
          onClick={handleTap}
        >
          <Pet2DScene 
            mood={mood}
            rarity={rarity}
            isTapped={isTapped}
            showLove={showLove}
            petType={petType}
          />
        </div>
        
        {/* Pet message bubble */}
        {petMessage && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <div className="relative bg-white rounded-2xl px-4 py-2 shadow-lg border border-amber-100">
              <span className="text-sm font-medium text-foreground">{petMessage}</span>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-amber-100 rotate-45" />
            </div>
          </div>
        )}

        {/* Bottom info bar - minimal, emotional focused */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-3 bg-gradient-to-t from-white/95 via-white/80 to-transparent">
          {/* Interaction buttons - fixed at bottom of 3D stage */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <button
              onClick={() => handleAction("feed", onFeed)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200",
                activeAction === "feed" ? "scale-95" : "hover:bg-white/50 active:scale-95"
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white shadow-md">
                <Utensils className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">喂食</span>
            </button>
            <button
              onClick={() => handleAction("play", onPlay)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200",
                activeAction === "play" ? "scale-95" : "hover:bg-white/50 active:scale-95"
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white shadow-md">
                <Gamepad2 className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">玩耍</span>
            </button>
            <button
              onClick={() => handleAction("sleep", onSleep)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200",
                activeAction === "sleep" ? "scale-95" : "hover:bg-white/50 active:scale-95"
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white shadow-md">
                <Moon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">休息</span>
            </button>
            <button
              onClick={() => handleAction("train", onTrain)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200",
                activeAction === "train" ? "scale-95" : "hover:bg-white/50 active:scale-95"
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-400 flex items-center justify-center text-white shadow-md">
                <Dumbbell className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">训练</span>
            </button>
            <button
              onClick={() => handleAction("dress", onDress)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200",
                activeAction === "dress" ? "scale-95" : "hover:bg-white/50 active:scale-95"
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-400 flex items-center justify-center text-white shadow-md">
                <Shirt className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">装扮</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between gap-3">
            {/* Affection indicator - heart based */}
            <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
              <Heart className={cn(
                "h-4 w-4 transition-all",
                affectionLevel > 80 ? "text-pink-500 fill-pink-500 animate-pulse" : 
                affectionLevel > 50 ? "text-pink-400 fill-pink-400" : "text-pink-300"
              )} />
              <span className="text-xs font-medium text-foreground">亲密度 {affectionLevel}%</span>
            </div>
            
            {/* Companion days */}
            <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium text-foreground">相伴 {companionDays} 天</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

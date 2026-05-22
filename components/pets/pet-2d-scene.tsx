"use client"

import { cn } from "@/lib/utils"
import { Heart } from "lucide-react"

interface Pet2DSceneProps {
  mood: "happy" | "excited" | "sleepy" | "hungry"
  rarity: "common" | "rare" | "epic" | "legendary"
  isTapped: boolean
  showLove: boolean
  petType?: "corgi" | "cat" | "rabbit" | "hamster" | "shiba"
}

export function Pet2DScene({ 
  mood = "happy", 
  rarity = "epic",
  isTapped = false,
  showLove = false,
  petType = "corgi"
}: Pet2DSceneProps) {
  // Pet emoji based on type
  const petEmojis: Record<string, string> = {
    corgi: "🐕",
    cat: "🐱",
    rabbit: "🐰",
    hamster: "🐹",
    shiba: "🐕",
  }
  
  // Rarity colors - simplified
  const rarityConfig = {
    common: { glow: "bg-slate-200/30", ring: "ring-slate-300" },
    rare: { glow: "bg-blue-200/40", ring: "ring-blue-300" },
    epic: { glow: "bg-violet-200/50", ring: "ring-violet-300" },
    legendary: { glow: "bg-amber-200/60", ring: "ring-amber-300" },
  }
  
  const config = rarityConfig[rarity]

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden">
      {/* Simple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50 via-orange-50/80 to-rose-50/60" />
      
      {/* Decorative elements - static */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Ground platform */}
        <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-48 h-24">
          <div className="absolute inset-0 bg-gradient-to-t from-amber-100/80 to-transparent rounded-[100%]" />
        </div>
        
        {/* Small decorations - static */}
        <div className="absolute bottom-[18%] left-[18%] text-lg opacity-70">🌸</div>
        <div className="absolute bottom-[20%] right-[20%] text-base opacity-60">🎾</div>
        <div className="absolute bottom-[16%] right-[30%] text-sm opacity-50">🦴</div>
      </div>
      
      {/* Main pet container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className={cn(
            "relative transition-transform duration-200",
            isTapped ? "scale-90" : "scale-100"
          )}
        >
          {/* Rarity glow - static */}
          <div className={cn("absolute inset-0 -m-8 rounded-full blur-2xl opacity-60", config.glow)} />
          
          {/* Pet body */}
          <div className={cn(
            "relative w-32 h-32 rounded-full flex items-center justify-center",
            "bg-gradient-to-b from-amber-100 to-orange-100",
            "ring-4",
            config.ring,
            "shadow-xl"
          )}>
            <div className="text-7xl">{petEmojis[petType]}</div>
            
            {/* Legendary crown - static */}
            {rarity === "legendary" && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl">👑</div>
            )}
          </div>
          
          {/* Mood indicators - static */}
          {mood === "sleepy" && <div className="absolute -top-2 -right-4 text-xl">💤</div>}
          {mood === "hungry" && <div className="absolute -top-2 -right-4 text-xl">🍖</div>}
          {mood === "excited" && <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xl">⭐</div>}
          
          {/* Love reaction */}
          {showLove && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1">
              <Heart className="h-6 w-6 text-pink-500 fill-pink-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { cn } from "@/lib/utils"
import { 
  Heart, Sparkles, Calendar, ChevronRight
} from "lucide-react"

interface PetHomeShowcaseProps {
  petEmoji: string
  petName: string
  affectionLevel: number
  companionDays: number
  favoriteMemory?: string
  onClick?: () => void
}

export function PetHomeShowcase({
  petEmoji = "🐕",
  petName = "毛毛",
  affectionLevel = 85,
  companionDays = 28,
  favoriteMemory = "一起完成了《小王子》",
  onClick,
}: PetHomeShowcaseProps) {
  return (
    <button 
      onClick={onClick}
      className="w-full bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 rounded-2xl p-4 shadow-sm border border-amber-200/50 text-left transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-400 fill-rose-400" />
          <span className="text-xs font-bold text-foreground">我的伙伴</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
      
      {/* Pet display */}
      <div className="flex items-center gap-4">
        {/* Pet avatar with glow */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-300/50 to-orange-300/50 rounded-full blur-lg" />
          <div className="relative w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center text-3xl border-2 border-amber-200">
            {petEmoji}
          </div>
          {/* Sparkle */}
          <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-400 animate-pulse" />
        </div>
        
        {/* Pet info */}
        <div className="flex-1">
          <h4 className="text-base font-bold text-foreground">{petName}</h4>
          
          {/* Affection bar */}
          <div className="flex items-center gap-2 mt-1.5">
            <Heart className="h-3 w-3 text-rose-400 fill-rose-400" />
            <div className="flex-1 h-1.5 rounded-full bg-rose-200 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-rose-400 to-pink-400 rounded-full"
                style={{ width: `${affectionLevel}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-rose-500">{affectionLevel}%</span>
          </div>
          
          {/* Companion days */}
          <div className="flex items-center gap-1 mt-1.5">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">相伴 {companionDays} 天</span>
          </div>
        </div>
      </div>
      
      {/* Favorite memory */}
      {favoriteMemory && (
        <div className="mt-3 p-2 bg-white/60 rounded-lg">
          <p className="text-[10px] text-muted-foreground">
            <span className="font-medium text-foreground">美好记忆:</span> {favoriteMemory}
          </p>
        </div>
      )}
    </button>
  )
}

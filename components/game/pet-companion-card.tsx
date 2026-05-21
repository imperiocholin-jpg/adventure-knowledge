"use client"

import { Heart, Dumbbell, Eye, Sparkles, Star, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PetCompanionCardProps {
  petName: string
  petLevel: number
  petMood: "happy" | "neutral" | "hungry"
  petEmoji: string
  happiness?: number
  energy?: number
  rarity?: "common" | "rare" | "epic" | "legendary"
  onFeed?: () => void
  onTrain?: () => void
  onView?: () => void
}

export function PetCompanionCard({
  petName = "小火龙",
  petLevel = 8,
  petMood = "happy",
  petEmoji = "🐲",
  happiness = 85,
  energy = 70,
  rarity = "rare",
  onFeed,
  onTrain,
  onView,
}: PetCompanionCardProps) {
  const moodConfig = {
    happy: { label: "开心", emoji: "💖", color: "text-pink-500", bubbleColor: "bg-pink-500" },
    neutral: { label: "普通", emoji: "😊", color: "text-amber-500", bubbleColor: "bg-amber-500" },
    hungry: { label: "饥饿", emoji: "🍖", color: "text-orange-500", bubbleColor: "bg-orange-500" },
  }

  const rarityConfig = {
    common: { label: "普通", gradient: "from-slate-400 to-slate-500", border: "border-slate-300", glow: "" },
    rare: { label: "稀有", gradient: "from-blue-400 to-cyan-500", border: "border-blue-300", glow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]" },
    epic: { label: "史诗", gradient: "from-purple-400 to-pink-500", border: "border-purple-300", glow: "shadow-[0_0_25px_rgba(168,85,247,0.4)]" },
    legendary: { label: "传说", gradient: "from-amber-400 to-orange-500", border: "border-amber-300", glow: "shadow-[0_0_30px_rgba(251,191,36,0.5)]" },
  }

  const mood = moodConfig[petMood]
  const rarityStyle = rarityConfig[rarity]

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-card p-4 shadow-lg border ${rarityStyle.border} ${rarityStyle.glow}`}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400/40 animate-sparkle"
            style={{
              left: `${15 + (i * 15)}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>
      
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-game-xp/5 via-transparent to-game-energy/5" />
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${rarityStyle.gradient} opacity-10 blur-2xl`} />
      
      <div className="relative">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-card-foreground">我的伙伴</h3>
            {/* Rarity badge */}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r ${rarityStyle.gradient} text-white`}>
              {rarityStyle.label}
            </span>
          </div>
          
          {/* Mood bubble with animation */}
          <div className="relative">
            <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-white shadow-md border border-border/50 ${mood.color}`}>
              <span className="animate-bounce" style={{ animationDuration: '2s' }}>{mood.emoji}</span>
              {mood.label}
            </div>
            {/* Floating hearts for happy mood */}
            {petMood === "happy" && (
              <div className="absolute -top-2 -right-1 text-xs animate-float-up">💕</div>
            )}
          </div>
        </div>

        {/* Pet display area */}
        <div className="mb-4 flex items-center gap-4">
          {/* Pet avatar with breathing animation */}
          <div className="relative">
            <div className={`flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-game-xp/10 shadow-inner border-2 ${rarityStyle.border}`}>
              {/* Breathing animation wrapper */}
              <span className="text-5xl animate-breathe">{petEmoji}</span>
            </div>
            
            {/* Level badge with glow */}
            <div className={`absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${rarityStyle.gradient} text-xs font-bold text-white shadow-lg`}>
              {petLevel}
            </div>
            
            {/* Sparkle effects around pet */}
            <Sparkles className="absolute -top-1 -right-2 h-4 w-4 text-amber-400 animate-pulse" />
            <Star className="absolute -bottom-1 -left-1 h-3 w-3 text-amber-400 fill-amber-400 animate-twinkle" />
          </div>

          {/* Pet info */}
          <div className="flex-1">
            <h4 className="mb-0.5 text-lg font-bold text-card-foreground flex items-center gap-1">
              {petName}
              {rarity === "legendary" && <span className="text-sm">✨</span>}
            </h4>
            <p className="mb-2.5 text-sm text-muted-foreground">Lv.{petLevel} 萌宠伙伴</p>
            
            {/* Stats bars */}
            <div className="space-y-2">
              {/* Happiness bar */}
              <div>
                <div className="mb-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-pink-500 fill-pink-500" />
                    心情
                  </span>
                  <span className="font-medium">{happiness}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-pink-500 to-pink-400 transition-all duration-500"
                    style={{ width: `${happiness}%` }}
                  />
                </div>
              </div>
              
              {/* Energy bar */}
              <div>
                <div className="mb-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                    活力
                  </span>
                  <span className="font-medium">{energy}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                    style={{ width: `${energy}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons - more game-like */}
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onFeed}
            className="group flex-col gap-1 h-auto py-2.5 rounded-xl border-2 border-pink-200 bg-pink-50/50 hover:bg-pink-100 hover:border-pink-300 hover:scale-105 transition-all duration-200"
          >
            <Heart className="h-4 w-4 text-pink-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs text-pink-600 font-medium">喂养</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onTrain}
            className="group flex-col gap-1 h-auto py-2.5 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 hover:border-emerald-300 hover:scale-105 transition-all duration-200"
          >
            <Dumbbell className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs text-emerald-600 font-medium">训练</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onView}
            className="group flex-col gap-1 h-auto py-2.5 rounded-xl border-2 border-violet-200 bg-violet-50/50 hover:bg-violet-100 hover:border-violet-300 hover:scale-105 transition-all duration-200"
          >
            <Eye className="h-4 w-4 text-violet-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs text-violet-600 font-medium">详情</span>
          </Button>
        </div>
      </div>
      
      {/* CSS for custom animations */}
      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.5; transform: rotate(0deg); }
          50% { opacity: 1; transform: rotate(20deg); }
        }
        @keyframes float-up {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-12px) scale(0.8); opacity: 0; }
        }
        .animate-breathe {
          animation: breathe 3s ease-in-out infinite;
        }
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
        .animate-twinkle {
          animation: twinkle 1.5s ease-in-out infinite;
        }
        .animate-float-up {
          animation: float-up 2s ease-out infinite;
        }
      `}</style>
    </div>
  )
}

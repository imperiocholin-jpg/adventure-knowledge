"use client"

import { Zap, Coins, Star, Flame, Trophy } from "lucide-react"

interface UserHeaderProps {
  username: string
  level: number
  coins: number
  energy: number
  maxEnergy: number
  avatarUrl?: string
  dailyStreak?: number
  adventureLevel?: number
  worldProgress?: number
}

export function UserHeader({
  username = "小冒险家",
  level = 12,
  coins = 2680,
  energy = 45,
  maxEnergy = 60,
  avatarUrl,
  dailyStreak = 7,
  adventureLevel = 3,
  worldProgress = 42,
}: UserHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-card p-4 shadow-lg border border-border/50">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/20 animate-float-particle"
            style={{
              left: `${10 + i * 20}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${4 + i}s`,
            }}
          />
        ))}
      </div>
      
      {/* Decorative background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-400/10 to-transparent rounded-full blur-xl" />
      
      <div className="relative flex items-center gap-3">
        {/* Avatar with animated border */}
        <div className="relative">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary via-emerald-500 to-teal-400 p-0.5 animate-gradient-rotate">
            <div className="h-full w-full rounded-full bg-card flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl">👦</span>
              )}
            </div>
          </div>
          {/* Level badge with glow */}
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[10px] font-bold text-white shadow-[0_2px_8px_rgba(251,191,36,0.4)]">
            {level}
          </div>
          {/* Online indicator */}
          <div className="absolute top-0 right-0 h-3 w-3 rounded-full bg-game-energy border-2 border-card animate-pulse" />
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <h2 className="truncate text-base font-bold text-card-foreground flex items-center gap-1">
            {username}
            {dailyStreak >= 7 && <span className="text-sm">🔥</span>}
          </h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              <span>Lv.{level}</span>
            </div>
            <span className="text-border">|</span>
            <div className="flex items-center gap-0.5">
              <Trophy className="h-3 w-3 text-primary" />
              <span>探索 {worldProgress}%</span>
            </div>
          </div>
          
          {/* Daily streak indicator */}
          <div className="mt-1 flex items-center gap-1">
            <Flame className="h-3 w-3 text-orange-500 fill-orange-500" />
            <span className="text-[10px] font-medium text-orange-600">连续{dailyStreak}天</span>
            <div className="flex gap-0.5 ml-1">
              {[...Array(Math.min(dailyStreak, 7))].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-400 to-amber-400" />
              ))}
              {[...Array(Math.max(0, 7 - dailyStreak))].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted" />
              ))}
            </div>
          </div>
        </div>

        {/* Stats - vertical layout for mobile */}
        <div className="flex flex-col gap-1.5">
          {/* Coins with animated glow on high value */}
          <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-yellow-400/10 px-2.5 py-1 border border-amber-200/50">
            <Coins className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-bold text-amber-700">{coins.toLocaleString()}</span>
          </div>
          
          {/* Energy with visual bar */}
          <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-400/10 px-2.5 py-1 border border-emerald-200/50">
            <Zap className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500" />
            <div className="flex items-center gap-1">
              <div className="w-10 h-1.5 rounded-full bg-emerald-200 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  style={{ width: `${(energy / maxEnergy) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-emerald-700">{energy}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes float-particle {
          0% { transform: translateY(0) scale(1); opacity: 0.2; }
          50% { transform: translateY(-15px) scale(1.1); opacity: 0.5; }
          100% { transform: translateY(-30px) scale(0.9); opacity: 0; }
        }
        @keyframes gradient-rotate {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        .animate-float-particle {
          animation: float-particle 5s ease-in-out infinite;
        }
        .animate-gradient-rotate {
          animation: gradient-rotate 8s linear infinite;
        }
      `}</style>
    </div>
  )
}

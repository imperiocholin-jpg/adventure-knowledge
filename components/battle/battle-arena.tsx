"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Sparkles, Star, Heart, Zap } from "lucide-react"
import { PetAvatar } from "@/components/pets/pet-avatar"
import { UserAvatar } from "@/components/user/user-avatar"

interface BattleArenaProps {
  playerPet: {
    emoji: string
    avatarSrc?: string | null
    name: string
    level: number
    attack: number
    health: number
    maxHealth: number
  }
  opponentPet: {
    emoji: string
    avatarSrc?: string | null
    name: string
    level: number
    attack: number
    health: number
    maxHealth: number
  }
  playerAvatarSrc: string
  opponentAvatarSrc?: string | null
  playerName: string
  opponentName: string
  isPlayerTurn: boolean
  battlePhase: "idle" | "question" | "skill" | "result"
  lastSkillUsed?: string
  skillTarget?: "player" | "opponent"
}

export function BattleArena({
  playerPet,
  opponentPet,
  playerAvatarSrc,
  opponentAvatarSrc,
  playerName,
  opponentName,
  isPlayerTurn,
  battlePhase,
  lastSkillUsed,
  skillTarget,
}: BattleArenaProps) {
  const [showSkillEffect, setShowSkillEffect] = useState(false)
  const [floatingHearts, setFloatingHearts] = useState<number[]>([])

  useEffect(() => {
    if (battlePhase === "skill") {
      setShowSkillEffect(true)
      setTimeout(() => setShowSkillEffect(false), 1500)
    }
  }, [battlePhase])

  // Add floating hearts on pet interaction
  const renderPetCombatStats = (
    pet: BattleArenaProps["playerPet"],
    side: "player" | "opponent",
  ) => {
    const hpPercent = pet.maxHealth > 0 ? Math.max(0, Math.min(100, (pet.health / pet.maxHealth) * 100)) : 0
    const atkClass = side === "player" ? "text-amber-600" : "text-amber-600"
    const hpClass = side === "player" ? "text-emerald-700" : "text-rose-700"
    const barClass =
      side === "player"
        ? "bg-gradient-to-r from-emerald-400 to-green-400"
        : "bg-gradient-to-r from-rose-400 to-pink-400"
    const barWidth = side === "player" ? "w-24" : "w-20"
    const barHeight = side === "player" ? "h-2.5" : "h-2"

    return (
      <div className={cn("mt-1", barWidth)}>
        <div className="flex items-center justify-between gap-2 text-[9px] font-semibold leading-none">
          <span className={atkClass}>ATK {pet.attack}</span>
          <span className={hpClass}>
            HP {pet.health}/{pet.maxHealth}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1">
          <Heart className={cn("w-2.5 h-2.5 shrink-0", hpClass)} />
          <div
            className={cn(
              "flex-1 rounded-full overflow-hidden bg-white/50 shadow-inner",
              barWidth,
              barHeight,
            )}
          >
            <div
              className={cn("h-full transition-all duration-500 rounded-full", barClass)}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  const addHeart = () => {
    const id = Date.now()
    setFloatingHearts(prev => [...prev, id])
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h !== id))
    }, 1500)
  }

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-sky-100 via-purple-50 to-pink-50 border border-white/50 shadow-xl">
      {/* Magical sky background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating clouds */}
        <div className="absolute top-4 left-4 w-16 h-8 bg-white/60 rounded-full blur-sm animate-float-slow" />
        <div className="absolute top-8 right-8 w-20 h-10 bg-white/50 rounded-full blur-sm animate-float-slow" style={{ animationDelay: "1s" }} />
        <div className="absolute top-12 left-1/3 w-12 h-6 bg-white/40 rounded-full blur-sm animate-float-slow" style={{ animationDelay: "2s" }} />
        
        {/* Rainbow arc */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-40 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 rounded-b-full blur-xl" />
        </div>
        
        {/* Magical sparkles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-twinkle"
            style={{
              left: `${8 + (i * 8)}%`,
              top: `${10 + (i % 4) * 15}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            <Star className="w-2 h-2 text-amber-300 fill-amber-200" />
          </div>
        ))}
        
        {/* Floating magical particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full animate-particle-float"
            style={{
              background: i % 3 === 0 ? "rgba(251, 191, 36, 0.6)" : i % 3 === 1 ? "rgba(236, 72, 153, 0.5)" : "rgba(147, 51, 234, 0.5)",
              left: `${10 + (i * 10)}%`,
              bottom: "20%",
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Arena stage - floating platform */}
      <div className="relative px-4 pt-4 pb-6">
        {/* Battle title */}
        <div className="flex justify-center mb-3">
          <div className="px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-md border border-white/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {isPlayerTurn ? "你的回合" : "对手回合"}
              </span>
              <Sparkles className="w-4 h-4 text-pink-500" />
            </div>
          </div>
        </div>

        {/* Battle area with pets */}
        <div className="relative h-52">
          {/* Opponent side */}
          <div className="absolute top-0 right-4 flex flex-col items-center">
            {/* Opponent info */}
            <div className="flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur-sm shadow-sm">
              {opponentAvatarSrc ? (
                <UserAvatar src={opponentAvatarSrc} alt={opponentName} size="xs" className="ring-1 ring-white" />
              ) : (
                <span className="text-lg">👧</span>
              )}
              <span className="text-xs font-semibold text-foreground">{opponentName}</span>
            </div>
            
            {/* Opponent pet */}
            <div 
              className={cn(
                "relative transition-all duration-500",
                battlePhase === "skill" && skillTarget === "opponent" && "animate-shake",
                !isPlayerTurn && "scale-105"
              )}
            >
              {/* Pet glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-rose-200/50 to-transparent rounded-full blur-xl scale-150" />
              
              <PetAvatar
                src={opponentPet.avatarSrc}
                emoji={opponentPet.emoji}
                alt={`${opponentPet.name}头像`}
                size="lg"
                rounded="full"
                className="shadow-lg animate-pet-idle"
              />
              
              {/* Pet name & level */}
              <div className="mt-1 text-center">
                <span className="text-[10px] font-medium text-foreground bg-white/70 px-2 py-0.5 rounded-full">
                  {opponentPet.name} Lv.{opponentPet.level}
                </span>
              </div>
              {renderPetCombatStats(opponentPet, "opponent")}
            </div>
          </div>

          {/* Player side */}
          <div className="absolute bottom-0 left-4 flex flex-col items-center">
            {/* Player info */}
            <div className="flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur-sm shadow-sm border-2 border-primary/20">
              <UserAvatar src={playerAvatarSrc} alt={playerName} size="xs" className="ring-1 ring-white" />
              <span className="text-xs font-semibold text-foreground">{playerName}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">你</span>
            </div>
            
            {/* Player pet */}
            <div 
              className={cn(
                "relative transition-all duration-500 cursor-pointer",
                battlePhase === "skill" && skillTarget === "player" && "animate-shake",
                isPlayerTurn && "scale-105"
              )}
              onClick={addHeart}
            >
              {/* Pet glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-transparent rounded-full blur-xl scale-150" />
              
              <PetAvatar
                src={playerPet.avatarSrc}
                emoji={playerPet.emoji}
                alt={`${playerPet.name}头像`}
                size="xl"
                rounded="full"
                className="shadow-lg animate-pet-idle"
              />
              
              {/* Floating hearts */}
              {floatingHearts.map(id => (
                <Heart
                  key={id}
                  className="absolute left-1/2 top-0 w-4 h-4 text-pink-400 fill-pink-400 animate-heart-float"
                />
              ))}
              
              {/* Pet name & level */}
              <div className="mt-1 text-center">
                <span className="text-[10px] font-medium text-foreground bg-white/70 px-2 py-0.5 rounded-full">
                  {playerPet.name} Lv.{playerPet.level}
                </span>
              </div>
              {renderPetCombatStats(playerPet, "player")}
            </div>
          </div>

          {/* Skill effect overlay */}
          {showSkillEffect && lastSkillUsed && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="animate-skill-burst">
                <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-400 shadow-2xl">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <Zap className="w-5 h-5 fill-white" />
                    <span>{lastSkillUsed}</span>
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating platform decoration */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-4 bg-gradient-to-t from-purple-200/50 to-transparent rounded-t-full blur-md" />
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-8px) translateX(4px); }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        
        @keyframes particle-float {
          0% { transform: translateY(0) scale(1); opacity: 0.6; }
          100% { transform: translateY(-100px) scale(0.5); opacity: 0; }
        }
        .animate-particle-float {
          animation: particle-float 3s ease-out infinite;
        }
        
        @keyframes pet-idle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(-2deg); }
          75% { transform: translateY(-3px) rotate(2deg); }
        }
        .animate-pet-idle {
          animation: pet-idle 2s ease-in-out infinite;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out 3;
        }
        
        @keyframes skill-burst {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-skill-burst {
          animation: skill-burst 0.5s ease-out forwards;
        }
        
        @keyframes heart-float {
          0% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
          100% { transform: translateX(-50%) translateY(-40px) scale(0.5); opacity: 0; }
        }
        .animate-heart-float {
          animation: heart-float 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

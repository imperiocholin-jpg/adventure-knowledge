"use client"

import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { Sparkles } from "lucide-react"
import { useState, useEffect } from "react"

import { PetAvatar } from "@/components/pets/pet-avatar"

interface MapPetCompanionProps {
  className?: string
  style?: CSSProperties
  petEmoji?: string
  petAvatarSrc?: string | null
  petName?: string
}

const petMessages = [
  "主人，前面有宝藏！",
  "我闻到了魔法的味道~",
  "加油，快到终点了！",
  "这里好神秘啊...",
  "主人最棒了！",
]

/** 地图右下角伙伴营地（贴地图容器右下角） */
export const MAP_PET_COMPANION_OFFSET = { right: 14, bottom: 14 } as const

export function MapPetCompanion({
  className,
  style,
  petEmoji = "🐲",
  petAvatarSrc = null,
  petName = "小火龙",
}: MapPetCompanionProps) {
  const [message, setMessage] = useState(petMessages[0])
  const [showMessage, setShowMessage] = useState(false)
  const [isHappy, setIsHappy] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        setMessage(petMessages[Math.floor(Math.random() * petMessages.length)])
        setShowMessage(true)
        setTimeout(() => setShowMessage(false), 3000)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handlePetTap = () => {
    setIsHappy(true)
    setMessage("嘻嘻，好痒~")
    setShowMessage(true)
    setTimeout(() => {
      setIsHappy(false)
      setShowMessage(false)
    }, 2000)
  }

  return (
    <div
      className={cn(
        "absolute z-30 flex flex-col items-center pointer-events-auto",
        className,
      )}
      style={style}
    >
      {showMessage ? (
        <div className="absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-[9rem] -translate-x-1/2 animate-in fade-in-0 zoom-in-95 duration-300">
          <div className="relative rounded-xl border border-white/50 bg-white px-2.5 py-1 shadow-lg">
            <p className="whitespace-nowrap text-[10px] font-medium text-foreground">{message}</p>
            <div className="absolute -bottom-1.5 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-white/50 bg-white" />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handlePetTap}
        className="group flex flex-col items-center gap-1 transition-transform active:scale-95"
      >
        <div className="relative">
          <PetAvatar
            src={petAvatarSrc}
            emoji={petEmoji}
            alt={`${petName}头像`}
            size="md"
            rounded="full"
            animate={false}
            className={cn(
              "border-2 border-white shadow-lg transition-transform duration-300",
              isHappy ? "scale-110" : "group-hover:scale-105",
            )}
          />
          <Sparkles className="absolute -right-0.5 -top-0.5 h-3 w-3 text-amber-400 animate-pulse" />
        </div>
        <span className="max-w-[3.25rem] truncate rounded-full bg-white/90 px-2 py-0.5 text-center text-[9px] font-semibold leading-none text-foreground shadow-sm backdrop-blur-sm">
          {petName}
        </span>
      </button>
    </div>
  )
}

"use client"

import { cn } from "@/lib/utils"
import { Sparkles } from "lucide-react"
import { useState, useEffect } from "react"

interface MapPetCompanionProps {
  className?: string
  petEmoji?: string
  petName?: string
}

const petMessages = [
  "主人，前面有宝藏！",
  "我闻到了魔法的味道~",
  "加油，快到终点了！",
  "这里好神秘啊...",
  "主人最棒了！",
]

export function MapPetCompanion({ 
  className,
  petEmoji = "🐲",
  petName = "小火龙"
}: MapPetCompanionProps) {
  const [message, setMessage] = useState(petMessages[0])
  const [showMessage, setShowMessage] = useState(false)
  const [isHappy, setIsHappy] = useState(false)

  useEffect(() => {
    // Randomly show messages
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
    <div className={cn("relative", className)}>
      {/* Speech bubble */}
      {showMessage && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-in fade-in-0 zoom-in-95 duration-300 z-10">
          <div className="relative bg-white rounded-xl px-2.5 py-1 shadow-lg border border-white/50">
            <p className="text-[10px] font-medium text-foreground whitespace-nowrap">{message}</p>
            {/* Speech bubble tail */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-r border-b border-white/50" />
          </div>
        </div>
      )}
      
      {/* Pet container */}
      <button
        onClick={handlePetTap}
        className="relative group"
      >
        {/* Pet circle with emoji - same style as home page */}
        <div className={cn(
          "relative flex items-center justify-center w-12 h-12 rounded-full",
          "bg-gradient-to-br from-primary/10 to-game-xp/10",
          "border-2 border-white shadow-lg",
          "transition-transform duration-300",
          isHappy ? "scale-110" : "group-hover:scale-105"
        )}>
          {/* Pet emoji with breathing animation */}
          <span className={cn(
            "text-2xl",
            isHappy ? "animate-bounce" : "animate-breathe"
          )}>
            {petEmoji}
          </span>
        </div>
        
        {/* Sparkle effect */}
        <Sparkles className="absolute -top-0.5 -right-0.5 h-3 w-3 text-amber-400 animate-pulse" />
      </button>
      
      {/* Pet name tag - simple and clean */}
      <div className="mt-1 text-center">
        <span className="text-[9px] font-semibold text-foreground bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
          {petName}
        </span>
      </div>
      
      {/* CSS for breathing animation */}
      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .animate-breathe {
          animation: breathe 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Sparkles, Star, MapPin, Lock, Play, Wind, Snowflake, Waves } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeaturedWorld {
  id: string
  title: string
  subtitle: string
  cover: string
  theme: string
  gradient: string
  ambientGradient: string
  progress?: number
  isNew?: boolean
  isLocked?: boolean
  chapters: number
  completedChapters: number
  atmosphere: "stars" | "forest" | "ocean" | "snow" | "desert"
  readers: number
}

const featuredWorlds: FeaturedWorld[] = [
  {
    id: "1",
    title: "小王子的星球",
    subtitle: "探索宇宙的哲学之旅",
    cover: "🌟",
    theme: "星际冒险",
    gradient: "from-indigo-600 via-purple-600 to-pink-600",
    ambientGradient: "from-indigo-900/50 via-purple-900/30 to-transparent",
    progress: 65,
    chapters: 12,
    completedChapters: 8,
    atmosphere: "stars",
    readers: 2847,
  },
  {
    id: "2",
    title: "爱丽丝仙境",
    subtitle: "奇幻冒险的起点",
    cover: "🐰",
    theme: "魔法森林",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    ambientGradient: "from-emerald-900/50 via-teal-900/30 to-transparent",
    progress: 30,
    isNew: true,
    chapters: 15,
    completedChapters: 4,
    atmosphere: "forest",
    readers: 3521,
  },
  {
    id: "3",
    title: "海底王国",
    subtitle: "深海冒险等你来",
    cover: "🐚",
    theme: "神秘深海",
    gradient: "from-blue-600 via-cyan-600 to-teal-500",
    ambientGradient: "from-blue-900/50 via-cyan-900/30 to-transparent",
    isLocked: true,
    chapters: 10,
    completedChapters: 0,
    atmosphere: "ocean",
    readers: 1923,
  },
  {
    id: "4",
    title: "冰雪女王",
    subtitle: "冰封王国的秘密",
    cover: "❄️",
    theme: "冰雪奇缘",
    gradient: "from-sky-400 via-blue-500 to-indigo-600",
    ambientGradient: "from-sky-900/50 via-blue-900/30 to-transparent",
    progress: 45,
    chapters: 8,
    completedChapters: 3,
    atmosphere: "snow",
    readers: 2156,
  },
]

// Atmosphere particle component
function AtmosphereParticles({ type }: { type: string }) {
  const particles = [...Array(12)]
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {type === "stars" && particles.map((_, i) => (
        <div
          key={i}
          className="absolute animate-twinkle"
          style={{
            left: `${5 + i * 8}%`,
            top: `${10 + (i % 4) * 20}%`,
            animationDelay: `${i * 0.2}s`,
          }}
        >
          <Star className="h-2 w-2 text-yellow-200 fill-yellow-200" />
        </div>
      ))}
      
      {type === "forest" && particles.map((_, i) => (
        <div
          key={i}
          className="absolute animate-leaf-fall"
          style={{
            left: `${10 + i * 8}%`,
            top: `-10%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${4 + i * 0.3}s`,
          }}
        >
          <span className="text-sm opacity-60">🍃</span>
        </div>
      ))}
      
      {type === "ocean" && particles.map((_, i) => (
        <div
          key={i}
          className="absolute animate-bubble"
          style={{
            left: `${8 + i * 8}%`,
            bottom: `-10%`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${3 + i * 0.2}s`,
          }}
        >
          <div className="w-2 h-2 rounded-full bg-white/30" />
        </div>
      ))}
      
      {type === "snow" && particles.map((_, i) => (
        <div
          key={i}
          className="absolute animate-snowfall"
          style={{
            left: `${5 + i * 8}%`,
            top: `-5%`,
            animationDelay: `${i * 0.3}s`,
            animationDuration: `${5 + i * 0.5}s`,
          }}
        >
          <Snowflake className="h-2 w-2 text-white/60" />
        </div>
      ))}
    </div>
  )
}

interface FeaturedWorldsProps {
  onWorldSelect?: (worldId: string) => void
  onExploreMore?: () => void
}

export function FeaturedWorlds({ onWorldSelect, onExploreMore }: FeaturedWorldsProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Auto-rotate featured worlds
  useEffect(() => {
    if (isHovered) return
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featuredWorlds.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [isHovered])

  return (
    <div className="px-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
            <MapPin className="h-4 w-4 text-white" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse opacity-50 blur-sm" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">阅读世界</h2>
            <p className="text-[10px] text-muted-foreground">开启你的奇幻旅程</p>
          </div>
        </div>
        <button 
          onClick={onExploreMore}
          className="flex items-center gap-0.5 text-xs text-primary font-medium hover:underline"
        >
          探索更多 <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Featured carousel - Portal style */}
      <div 
        className="relative overflow-hidden rounded-3xl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Magical border glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-amber-400 via-purple-500 to-cyan-400 opacity-75 blur-sm animate-border-glow" />
        
        <div className="relative m-[2px] rounded-[22px] overflow-hidden">
          <div 
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {featuredWorlds.map((world) => (
              <div key={world.id} className="w-full flex-shrink-0">
                <button
                  onClick={() => !world.isLocked && onWorldSelect?.(world.id)}
                  className={cn(
                    "relative w-full h-52 overflow-hidden",
                    world.isLocked && "cursor-not-allowed"
                  )}
                >
                  {/* Background gradient */}
                  <div className={cn("absolute inset-0 bg-gradient-to-br", world.gradient)} />
                  
                  {/* Ambient overlay for depth */}
                  <div className={cn("absolute inset-0 bg-gradient-to-t", world.ambientGradient)} />
                  
                  {/* Atmosphere particles */}
                  <AtmosphereParticles type={world.atmosphere} />
                  
                  {/* Radial light effect */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                  
                  {/* Locked overlay */}
                  {world.isLocked && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10" />
                  )}

                  {/* Content */}
                  <div className="relative h-full p-5 flex flex-col justify-between z-10">
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        {world.isNew && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold text-white border border-white/20">
                            <Sparkles className="h-3 w-3 animate-pulse" /> 新世界开放
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-[10px] text-white/90 font-medium">
                            {world.theme}
                          </span>
                          <span className="text-[10px] text-white/70">
                            {world.readers.toLocaleString()} 冒险者
                          </span>
                        </div>
                      </div>
                      
                      {/* Cover emoji - floating effect */}
                      <div className="relative">
                        <div className="text-5xl drop-shadow-2xl animate-float-slow">{world.cover}</div>
                        <div className="absolute inset-0 text-5xl blur-md opacity-50">{world.cover}</div>
                      </div>
                    </div>

                    {/* Bottom row */}
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1 text-left drop-shadow-lg">{world.title}</h3>
                      <p className="text-white/80 text-sm mb-4 text-left">{world.subtitle}</p>
                      
                      {world.isLocked ? (
                        <div className="flex items-center gap-3 bg-black/30 backdrop-blur-md rounded-2xl p-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                            <Lock className="h-5 w-5 text-white/80" />
                          </div>
                          <div className="text-left">
                            <p className="text-white/90 text-xs font-medium">世界尚未解锁</p>
                            <p className="text-white/60 text-[10px]">完成前置冒险即可进入</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {/* Progress section */}
                          <div className="flex-1 bg-black/20 backdrop-blur-md rounded-2xl p-3">
                            <div className="flex items-center justify-between text-[10px] text-white/90 mb-1.5">
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-amber-300 fill-amber-300" />
                                {world.completedChapters}/{world.chapters} 章节
                              </span>
                              <span className="font-bold">{world.progress}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-white via-white to-amber-200 shadow-[0_0_12px_rgba(255,255,255,0.6)] transition-all duration-500"
                                style={{ width: `${world.progress}%` }}
                              />
                            </div>
                          </div>
                          
                          {/* Enter portal button */}
                          <div className="relative group">
                            <div className="absolute inset-0 rounded-full bg-white/30 blur-md group-hover:blur-lg transition-all" />
                            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/25 backdrop-blur-md border border-white/30 group-hover:bg-white/35 group-hover:scale-110 transition-all duration-300">
                              <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {featuredWorlds.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === activeIndex 
                  ? "w-6 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
                  : "w-2 bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes leaf-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.7; }
          100% { transform: translateY(250px) rotate(360deg); opacity: 0; }
        }
        @keyframes bubble {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.4; }
          100% { transform: translateY(-250px) scale(1.5); opacity: 0; }
        }
        @keyframes snowfall {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.6; }
          100% { transform: translateY(250px) translateX(20px); opacity: 0; }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes border-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }
        .animate-twinkle { animation: twinkle 2s ease-in-out infinite; }
        .animate-leaf-fall { animation: leaf-fall 6s linear infinite; }
        .animate-bubble { animation: bubble 4s ease-out infinite; }
        .animate-snowfall { animation: snowfall 8s linear infinite; }
        .animate-float-slow { animation: float-slow 3s ease-in-out infinite; }
        .animate-border-glow { animation: border-glow 3s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

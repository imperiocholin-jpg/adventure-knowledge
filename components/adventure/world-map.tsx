"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { 
  Lock, 
  Star, 
  Sparkles,
  TreePine,
  Mountain,
  Waves,
  Sun,
  Flame,
  Cloud,
  MapPin,
  Gem,
  Eye
} from "lucide-react"

type Region = {
  id: string
  name: string
  icon: typeof TreePine
  unlocked: boolean
  progress: number
  totalStages: number
  completedStages: number
  color: string
  bgGradient: string
  glowColor: string
  position: { x: number; y: number }
  description: string
  atmosphere: "forest" | "ice" | "desert" | "sky" | "ocean" | "volcano"
}

const regions: Region[] = [
  {
    id: "magic-forest",
    name: "魔法森林",
    icon: TreePine,
    unlocked: true,
    progress: 75,
    totalStages: 12,
    completedStages: 9,
    color: "text-emerald-500",
    bgGradient: "from-emerald-400/40 to-green-500/30",
    glowColor: "rgba(52,211,153,0.6)",
    position: { x: 22, y: 72 },
    description: "神秘的精灵之地",
    atmosphere: "forest"
  },
  {
    id: "ice-mountain",
    name: "冰雪之巅",
    icon: Mountain,
    unlocked: true,
    progress: 40,
    totalStages: 10,
    completedStages: 4,
    color: "text-cyan-400",
    bgGradient: "from-cyan-400/40 to-blue-400/30",
    glowColor: "rgba(34,211,238,0.6)",
    position: { x: 75, y: 18 },
    description: "永恒冰封的山脉",
    atmosphere: "ice"
  },
  {
    id: "ancient-desert",
    name: "远古沙漠",
    icon: Sun,
    unlocked: true,
    progress: 20,
    totalStages: 8,
    completedStages: 2,
    color: "text-amber-500",
    bgGradient: "from-amber-400/40 to-orange-400/30",
    glowColor: "rgba(251,191,36,0.6)",
    position: { x: 78, y: 55 },
    description: "失落文明的遗迹",
    atmosphere: "desert"
  },
  {
    id: "sky-kingdom",
    name: "天空王国",
    icon: Cloud,
    unlocked: false,
    progress: 0,
    totalStages: 15,
    completedStages: 0,
    color: "text-violet-400",
    bgGradient: "from-violet-400/40 to-purple-400/30",
    glowColor: "rgba(167,139,250,0.5)",
    position: { x: 28, y: 15 },
    description: "云端之上的国度",
    atmosphere: "sky"
  },
  {
    id: "ocean-ruins",
    name: "深海遗迹",
    icon: Waves,
    unlocked: false,
    progress: 0,
    totalStages: 12,
    completedStages: 0,
    color: "text-blue-500",
    bgGradient: "from-blue-500/40 to-indigo-500/30",
    glowColor: "rgba(59,130,246,0.5)",
    position: { x: 22, y: 42 },
    description: "沉没的海底文明",
    atmosphere: "ocean"
  },
  {
    id: "volcano-realm",
    name: "炎龙火山",
    icon: Flame,
    unlocked: false,
    progress: 0,
    totalStages: 10,
    completedStages: 0,
    color: "text-red-500",
    bgGradient: "from-red-500/40 to-orange-600/30",
    glowColor: "rgba(239,68,68,0.5)",
    position: { x: 52, y: 45 },
    description: "龙族的领地",
    atmosphere: "volcano"
  },
]

// Hidden discovery points on the map
const discoveries = [
  { id: 1, type: "chest", x: 45, y: 30, found: false },
  { id: 2, type: "mystery", x: 60, y: 70, found: true },
  { id: 3, type: "portal", x: 35, y: 58, found: false },
]

interface WorldMapProps {
  onRegionSelect?: (regionId: string) => void
  selectedRegion?: string
  playerPosition?: { x: number; y: number }
}

export function WorldMap({ onRegionSelect, selectedRegion, playerPosition = { x: 22, y: 72 } }: WorldMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)

  return (
    <div className="relative w-full h-[400px] overflow-hidden rounded-3xl">
      {/* === LAYERED BACKGROUND === */}
      <div className="absolute inset-0">
        {/* Deep sky gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-300/80 via-sky-200 to-emerald-200/90" />
        
        {/* Atmospheric light rays */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-[20%] w-32 h-64 bg-gradient-to-b from-amber-200/40 to-transparent rotate-12 blur-2xl" />
          <div className="absolute top-0 right-[30%] w-24 h-48 bg-gradient-to-b from-amber-100/30 to-transparent -rotate-6 blur-xl" />
        </div>
        
        {/* Floating clouds - layered depth */}
        <div className="absolute top-6 left-[5%] w-28 h-10 bg-white/70 rounded-full blur-md animate-[drift_20s_ease-in-out_infinite]" />
        <div className="absolute top-3 right-[10%] w-36 h-12 bg-white/60 rounded-full blur-md animate-[drift_25s_ease-in-out_infinite_2s]" />
        <div className="absolute top-14 left-[35%] w-20 h-7 bg-white/50 rounded-full blur-sm animate-[drift_18s_ease-in-out_infinite_1s]" />
        <div className="absolute top-10 right-[40%] w-24 h-8 bg-white/40 rounded-full blur-sm animate-[drift_22s_ease-in-out_infinite_3s]" />
        
        {/* Distant floating islands */}
        <div className="absolute top-20 left-[60%] opacity-40">
          <div className="w-16 h-8 bg-gradient-to-b from-emerald-600 to-emerald-800 rounded-t-full" />
          <div className="w-16 h-4 bg-gradient-to-b from-amber-700 to-amber-900 rounded-b-lg -mt-1" />
        </div>
        
        {/* Mountain silhouettes - multiple layers */}
        <svg className="absolute bottom-0 left-0 right-0 h-40" viewBox="0 0 400 160" preserveAspectRatio="none">
          {/* Far mountains */}
          <path 
            d="M0,160 L0,120 Q30,80 60,100 Q100,60 140,90 Q180,50 220,80 Q260,40 300,70 Q340,30 380,55 L400,45 L400,160 Z" 
            fill="rgba(34,197,94,0.12)"
          />
          {/* Mid mountains */}
          <path 
            d="M0,160 L0,130 Q40,100 80,115 Q130,85 180,105 Q230,75 280,100 Q330,70 380,90 L400,80 L400,160 Z" 
            fill="rgba(34,197,94,0.22)"
          />
          {/* Near hills */}
          <path 
            d="M0,160 L0,140 Q50,125 100,135 Q160,120 220,130 Q280,115 340,128 L400,120 L400,160 Z" 
            fill="rgba(34,197,94,0.35)"
          />
        </svg>
        
        {/* Ground layer with grass texture */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-emerald-500/50 via-emerald-400/30 to-transparent" />
      </div>
      
      {/* === REGIONAL ATMOSPHERIC EFFECTS === */}
      
      {/* Forest region - floating leaves and spores */}
      <div className="absolute left-[10%] bottom-[15%] w-32 h-32 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={`leaf-${i}`}
            className="absolute w-2 h-2 bg-emerald-400/60 rounded-full animate-[floatLeaf_6s_ease-in-out_infinite]"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${Math.random() * 80}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${5 + Math.random() * 3}s`,
            }}
          />
        ))}
        {/* Glowing spores */}
        {[...Array(4)].map((_, i) => (
          <div
            key={`spore-${i}`}
            className="absolute w-1.5 h-1.5 bg-lime-300 rounded-full shadow-[0_0_6px_rgba(163,230,53,0.8)] animate-[floatSpore_8s_ease-in-out_infinite]"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}
      </div>
      
      {/* Ice region - snow particles */}
      <div className="absolute right-[15%] top-[5%] w-28 h-28 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={`snow-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)] animate-[snowfall_4s_linear_infinite]"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
        {/* Icy glow */}
        <div className="absolute inset-0 bg-gradient-radial from-cyan-300/20 to-transparent rounded-full blur-xl" />
      </div>
      
      {/* Desert region - sand particles and warm glow */}
      <div className="absolute right-[10%] top-[40%] w-24 h-24 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={`sand-${i}`}
            className="absolute w-1 h-1 bg-amber-400/50 rounded-full animate-[driftSand_5s_ease-in-out_infinite]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
        {/* Heat shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-400/15 to-transparent animate-pulse" />
      </div>
      
      {/* Volcano region - ember particles */}
      <div className="absolute left-[40%] top-[35%] w-20 h-20 pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <div
            key={`ember-${i}`}
            className="absolute w-1 h-1 bg-orange-500 rounded-full shadow-[0_0_4px_rgba(249,115,22,0.9)] animate-[emberRise_3s_ease-out_infinite]"
            style={{
              left: `${30 + Math.random() * 40}%`,
              bottom: 0,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
      </div>
      
      {/* === MAGICAL FLOATING PARTICLES === */}
      {[...Array(10)].map((_, i) => (
        <div
          key={`particle-${i}`}
          className="absolute w-1.5 h-1.5 bg-amber-300/50 rounded-full animate-[floatParticle_12s_ease-in-out_infinite]"
          style={{
            left: `${5 + Math.random() * 90}%`,
            top: `${10 + Math.random() * 70}%`,
            animationDelay: `${i * 1.2}s`,
            animationDuration: `${10 + Math.random() * 5}s`,
          }}
        />
      ))}
      
      {/* === CONNECTION PATHS === */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="pathGradientActive" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(251,191,36,0.8)" />
            <stop offset="50%" stopColor="rgba(52,211,153,0.6)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0.4)" />
          </linearGradient>
          <linearGradient id="pathGradientLocked" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(156,163,175,0.3)" />
            <stop offset="100%" stopColor="rgba(156,163,175,0.15)" />
          </linearGradient>
          {/* Glowing filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Active paths - glowing trails */}
        <path
          d="M88,288 Q140,220 260,90"
          stroke="url(#pathGradientActive)"
          strokeWidth="4"
          strokeDasharray="12,6"
          fill="none"
          filter="url(#glow)"
          className="animate-[dashMove_3s_linear_infinite]"
        />
        <path
          d="M88,288 Q180,300 312,220"
          stroke="url(#pathGradientActive)"
          strokeWidth="4"
          strokeDasharray="12,6"
          fill="none"
          filter="url(#glow)"
          className="animate-[dashMove_3s_linear_infinite_0.5s]"
        />
        
        {/* Locked paths */}
        <path
          d="M260,90 Q200,70 112,60"
          stroke="url(#pathGradientLocked)"
          strokeWidth="2"
          strokeDasharray="4,4"
          fill="none"
        />
        <path
          d="M88,168 Q120,200 88,288"
          stroke="url(#pathGradientLocked)"
          strokeWidth="2"
          strokeDasharray="4,4"
          fill="none"
        />
      </svg>
      
      {/* === HIDDEN DISCOVERIES === */}
      {discoveries.map((disc) => (
        <div
          key={disc.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
          style={{ left: `${disc.x}%`, top: `${disc.y}%` }}
        >
          {disc.type === "chest" && !disc.found && (
            <div className="relative animate-[bob_2s_ease-in-out_infinite]">
              <div className="w-6 h-5 bg-gradient-to-b from-amber-500 to-amber-700 rounded-sm shadow-lg">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-400 rounded-t-sm" />
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-300 rounded-full" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-3 w-3 text-amber-300 animate-pulse" />
            </div>
          )}
          {disc.type === "mystery" && (
            <div className="relative">
              <div className="w-5 h-5 rounded-full bg-violet-500/30 backdrop-blur-sm border border-violet-400/50 flex items-center justify-center animate-pulse">
                <Eye className="h-2.5 w-2.5 text-violet-400" />
              </div>
            </div>
          )}
          {disc.type === "portal" && !disc.found && (
            <div className="relative animate-[spin_8s_linear_infinite]">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 opacity-60 shadow-[0_0_12px_rgba(139,92,246,0.5)]" />
              <div className="absolute inset-1 rounded-full bg-white/50" />
            </div>
          )}
        </div>
      ))}
      
      {/* === PLAYER AVATAR MARKER === */}
      <div
        className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ left: `${playerPosition.x}%`, top: `${playerPosition.y}%` }}
      >
        <div className="relative">
          {/* Pulse ring */}
          <div className="absolute inset-0 w-8 h-8 -m-1 rounded-full bg-primary/30 animate-ping" />
          {/* Location pin */}
          <div className="relative w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <MapPin className="h-3 w-3 text-white" />
          </div>
          {/* Direction indicator */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-primary" />
        </div>
      </div>
      
      {/* === REGION NODES === */}
      {regions.map((region) => {
        const Icon = region.icon
        const isSelected = selectedRegion === region.id
        const isHovered = hoveredRegion === region.id
        
        return (
          <button
            key={region.id}
            onClick={() => region.unlocked && onRegionSelect?.(region.id)}
            onMouseEnter={() => setHoveredRegion(region.id)}
            onMouseLeave={() => setHoveredRegion(null)}
            className={cn(
              "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10",
              region.unlocked ? "cursor-pointer" : "cursor-not-allowed"
            )}
            style={{
              left: `${region.position.x}%`,
              top: `${region.position.y}%`,
            }}
          >
            {/* Atmospheric glow based on region type */}
            {region.unlocked && (
              <div 
                className={cn(
                  "absolute inset-0 rounded-full blur-2xl transition-all duration-500",
                  isSelected || isHovered ? "scale-[2] opacity-80" : "scale-150 opacity-40"
                )}
                style={{ backgroundColor: region.glowColor }}
              />
            )}
            
            {/* Node circle with enhanced styling */}
            <div className={cn(
              "relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300",
              region.unlocked
                ? cn(
                    "bg-gradient-to-br from-white to-gray-100 shadow-xl border-2",
                    isSelected 
                      ? "border-amber-400 scale-115 shadow-[0_0_25px_rgba(251,191,36,0.6)]" 
                      : "border-white/80 hover:scale-110"
                  )
                : "bg-gray-400/40 backdrop-blur-sm border-2 border-gray-500/30"
            )}>
              {region.unlocked ? (
                <>
                  {/* Icon with gradient background */}
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    `bg-gradient-to-br ${region.bgGradient}`
                  )}>
                    <Icon className={cn("h-5 w-5", region.color)} strokeWidth={2.5} />
                  </div>
                  
                  {/* Animated progress ring */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="28"
                      cy="28"
                      r="25"
                      fill="none"
                      stroke="rgba(229,231,235,0.5)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="25"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${region.progress * 1.57} 157`}
                      className={cn(region.color, "drop-shadow-sm")}
                    />
                  </svg>
                  
                  {/* Stars badge */}
                  <div className="absolute -top-1 -right-1 flex items-center gap-0.5 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full px-1.5 py-0.5 shadow-lg">
                    <Star className="h-2.5 w-2.5 text-white fill-white" />
                    <span className="text-[9px] font-bold text-white">{region.completedStages}</span>
                  </div>
                  
                  {/* Completion checkmark for 100% */}
                  {region.progress === 100 && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                      <Gem className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 text-gray-500" />
                  {/* Fog overlay for locked regions */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-gray-400/20 to-transparent" />
                </>
              )}
            </div>
            
            {/* Region name label */}
            <div className={cn(
              "absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-300",
              "px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm",
              region.unlocked
                ? isSelected || isHovered
                  ? "bg-foreground text-background scale-105"
                  : "bg-white/95 text-foreground"
                : "bg-gray-300/80 text-gray-500"
            )}>
              {region.name}
            </div>
            
            {/* Hover tooltip - positioned based on region location */}
            {region.unlocked && isHovered && !isSelected && (
              <div className={cn(
                "absolute left-1/2 -translate-x-1/2 w-28 p-2 rounded-xl",
                "bg-white/95 backdrop-blur-md shadow-xl border border-white/50",
                "animate-in fade-in-0 zoom-in-95 duration-200 z-30",
                // Position tooltip below for top regions, above for bottom regions
                region.position.y < 40 ? "top-full mt-8" : "bottom-full mb-8"
              )}>
                <p className="text-[9px] text-muted-foreground text-center">{region.description}</p>
                <div className="flex items-center justify-center gap-1 text-[10px] mt-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span className="font-semibold">{region.completedStages}/{region.totalStages}</span>
                </div>
                {/* Tooltip arrow - flip based on position */}
                <div className={cn(
                  "absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-white/50",
                  region.position.y < 40 
                    ? "-top-1.5 border-l border-t" 
                    : "-bottom-1.5 border-r border-b"
                )} />
              </div>
            )}
          </button>
        )
      })}
      
      {/* === MAP LEGEND - simplified and moved to left side === */}
      <div className="absolute bottom-2 left-2 flex items-center gap-3 bg-white/90 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg border border-white/50">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" />
          <span className="text-[8px] text-muted-foreground">已解锁</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="text-[8px] text-muted-foreground">未解锁</span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="w-2 h-2 text-primary" />
          <span className="text-[8px] text-muted-foreground">位置</span>
        </div>
      </div>
      
      {/* === CSS ANIMATIONS === */}
      <style jsx>{`
        @keyframes drift {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(20px); }
        }
        @keyframes floatLeaf {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.6; }
          50% { transform: translateY(-15px) rotate(180deg); opacity: 1; }
        }
        @keyframes floatSpore {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 0.9; }
        }
        @keyframes snowfall {
          0% { transform: translateY(-10px) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100px) translateX(10px); opacity: 0; }
        }
        @keyframes driftSand {
          0%, 100% { transform: translateX(0) translateY(0); opacity: 0.3; }
          50% { transform: translateX(15px) translateY(-5px); opacity: 0.7; }
        }
        @keyframes emberRise {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-40px) scale(0); opacity: 0; }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-15px) translateX(8px); opacity: 0.7; }
          50% { transform: translateY(-8px) translateX(-5px); opacity: 0.5; }
          75% { transform: translateY(-20px) translateX(5px); opacity: 0.6; }
        }
        @keyframes dashMove {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -18; }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}

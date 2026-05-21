"use client"

import { Play, MapPin, Sparkles, Star, Mountain } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdventureBannerProps {
  currentChapter: string
  currentWorld: string
  progress: number
  explorationPercent?: number
  discoveredRegions?: number
  totalRegions?: number
  onStartAdventure?: () => void
}

export function AdventureBanner({
  currentChapter = "第三章",
  currentWorld = "魔法森林",
  progress = 65,
  explorationPercent = 42,
  discoveredRegions = 3,
  totalRegions = 7,
  onStartAdventure,
}: AdventureBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl shadow-2xl">
      {/* Multi-layer fantasy background */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-600 via-emerald-700 to-emerald-900" />
      
      {/* Sky layer with stars */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-3 left-6 w-1 h-1 rounded-full bg-white animate-pulse" />
        <div className="absolute top-5 left-16 w-0.5 h-0.5 rounded-full bg-white/80 animate-pulse" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-8 left-24 w-1 h-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.6s' }} />
        <div className="absolute top-4 right-20 w-0.5 h-0.5 rounded-full bg-white/80 animate-pulse" style={{ animationDelay: '0.2s' }} />
        <div className="absolute top-6 right-8 w-1 h-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.8s' }} />
      </div>
      
      {/* Distant mountains silhouette */}
      <div className="absolute bottom-0 left-0 right-0 h-28 opacity-30">
        <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
          <path d="M0,100 L0,70 Q50,30 100,60 T200,40 T300,55 T400,35 L400,100 Z" fill="rgba(0,0,0,0.3)" />
          <path d="M0,100 L0,80 Q40,50 80,70 T160,55 T240,65 T320,50 T400,60 L400,100 Z" fill="rgba(0,0,0,0.2)" />
        </svg>
      </div>
      
      {/* Floating islands */}
      <div className="absolute right-4 top-12 opacity-80">
        <div className="relative animate-float">
          <div className="w-16 h-8 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-t-full rounded-b-lg shadow-lg" />
          <div className="absolute top-1 left-3 w-3 h-5 bg-emerald-300 rounded-full opacity-60" />
          <div className="absolute -top-3 left-5 w-2 h-4 bg-emerald-500 rounded-full" />
        </div>
      </div>
      <div className="absolute right-16 top-6 opacity-60">
        <div className="relative animate-float" style={{ animationDelay: '1s' }}>
          <div className="w-10 h-5 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-t-full rounded-b-lg shadow-md" />
          <div className="absolute -top-2 left-3 w-1.5 h-3 bg-emerald-400 rounded-full" />
        </div>
      </div>
      
      {/* Magical fog/mist layers */}
      <div className="absolute bottom-16 left-0 right-0 h-20 bg-gradient-to-t from-white/10 to-transparent" />
      <div className="absolute bottom-24 left-4 w-32 h-8 rounded-full bg-white/5 blur-xl animate-drift" />
      <div className="absolute bottom-20 right-8 w-24 h-6 rounded-full bg-white/5 blur-xl animate-drift" style={{ animationDelay: '2s' }} />
      
      {/* Floating magical particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-300/60 animate-float-particle"
            style={{
              left: `${10 + (i * 7)}%`,
              top: `${20 + (i % 4) * 15}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${3 + (i % 3)}s`,
            }}
          />
        ))}
      </div>
      
      {/* Light rays */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-amber-400/20 to-transparent rounded-full blur-2xl" />
      <div className="absolute top-10 right-10 w-20 h-32 bg-gradient-to-b from-amber-300/10 to-transparent rotate-12 blur-lg" />

      {/* Main content */}
      <div className="relative z-10 p-5 pt-4">
        {/* World badge with exploration */}
        <div className="mb-3 flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm border border-white/10">
            <MapPin className="h-3.5 w-3.5 text-white" />
            <span className="text-xs font-medium text-white">{currentWorld}</span>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-1 backdrop-blur-sm border border-amber-400/20">
            <Mountain className="h-3 w-3 text-amber-300" />
            <span className="text-[10px] font-medium text-amber-200">{discoveredRegions}/{totalRegions} 区域</span>
          </div>
        </div>

        {/* Title with glow */}
        <h1 className="mb-1 text-2xl font-bold text-white drop-shadow-lg">
          继续冒险
        </h1>
        <p className="mb-4 text-sm text-white/80 flex items-center gap-1">
          <Star className="h-3 w-3 text-amber-300 fill-amber-300" />
          {currentChapter} · 探索未知领域
        </p>

        {/* Enhanced progress section */}
        <div className="mb-5 p-3 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/70">章节进度</span>
              <span className="text-xs font-bold text-white">{progress}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-amber-300/80">世界探索</span>
              <span className="text-[10px] font-bold text-amber-300">{explorationPercent}%</span>
            </div>
          </div>
          
          {/* Chapter progress bar */}
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10 mb-2">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 shadow-[0_0_10px_rgba(251,191,36,0.5)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* World exploration bar */}
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
              style={{ width: `${explorationPercent}%` }}
            />
          </div>
        </div>

        {/* Enhanced CTA Button */}
        <Button 
          onClick={onStartAdventure}
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 px-8 py-6 text-lg font-bold text-white shadow-[0_4px_20px_rgba(251,191,36,0.4)] hover:shadow-[0_6px_30px_rgba(251,191,36,0.6)] hover:scale-[1.02] transition-all duration-300 border-2 border-amber-300/30"
        >
          {/* Button shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          
          <span className="relative flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 animate-pulse" />
            开始冒险
            <Play className="h-5 w-5 fill-current" />
          </span>
        </Button>
      </div>
      
      {/* CSS for custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes drift {
          0%, 100% { transform: translateX(0); opacity: 0.05; }
          50% { transform: translateX(20px); opacity: 0.1; }
        }
        @keyframes float-particle {
          0% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 1; }
          100% { transform: translateY(-40px) scale(0.8); opacity: 0; }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-drift {
          animation: drift 6s ease-in-out infinite;
        }
        .animate-float-particle {
          animation: float-particle 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

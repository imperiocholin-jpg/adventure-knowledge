"use client"

import { useState, useEffect } from "react"
import { WorldMap } from "@/components/adventure/world-map"
import { AdventurePath } from "@/components/adventure/adventure-path"
import { ProgressSection } from "@/components/adventure/progress-section"
import { MapPetCompanion } from "@/components/adventure/map-pet-companion"
import { RewardDiscovery } from "@/components/adventure/reward-discovery"
import { BottomNavigation } from "@/components/game/bottom-navigation"
import { ChevronLeft, Settings, Bell, MapPin, Compass, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AdventurePage() {
  const [selectedRegion, setSelectedRegion] = useState("magic-forest")
  const [playerPos, setPlayerPos] = useState({ x: 22, y: 72 })
  const [showWelcome, setShowWelcome] = useState(true)
  const router = useRouter()

  // Hide welcome message after delay
  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  // Update player position based on selected region
  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {
      "magic-forest": { x: 22, y: 72 },
      "ice-mountain": { x: 75, y: 18 },
      "ancient-desert": { x: 78, y: 55 },
    }
    if (positions[selectedRegion]) {
      setPlayerPos(positions[selectedRegion])
    }
  }, [selectedRegion])

  const handleNavigation = (item: string) => {
    if (item === "home") {
      router.push("/")
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-indigo-100/80 via-sky-50 to-emerald-50/50 pb-24">
      {/* === HEADER === */}
      <header className="sticky top-0 z-40 bg-white border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <Link 
            href="/"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/90 shadow-md border border-white/60 hover:scale-105 active:scale-95 transition-transform"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </Link>
          
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            <h1 className="text-base font-bold text-foreground">冒险地图</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white/90 shadow-md border border-white/60 hover:scale-105 active:scale-95 transition-transform">
              <Bell className="h-4 w-4 text-foreground" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-sm">
                2
              </span>
            </button>
            <button className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/90 shadow-md border border-white/60 hover:scale-105 active:scale-95 transition-transform">
              <Settings className="h-4 w-4 text-foreground" />
            </button>
          </div>
        </div>
        
        {/* Player status bar */}
        <div className="px-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full">
              <MapPin className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-semibold text-primary">魔法森林</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 rounded-full">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span className="text-[10px] font-semibold text-amber-600">探险中</span>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground">今日探索: 45分钟</span>
        </div>
      </header>

      {/* === WELCOME TOAST === */}
      {showWelcome && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in-0 slide-in-from-top-4 duration-500">
          <div className="px-4 py-2 bg-white rounded-2xl shadow-xl border border-border/50 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-foreground">欢迎回到冒险世界!</span>
          </div>
        </div>
      )}

      {/* === MAIN CONTENT === */}
      <main className="relative z-10">
        {/* World Map Section */}
        <section className="px-4 pt-4">
          <div className="relative">
            <WorldMap 
              selectedRegion={selectedRegion}
              onRegionSelect={setSelectedRegion}
              playerPosition={playerPos}
            />
            
            {/* Pet companion floating on map - matches home page pet */}
            <div className="absolute bottom-4 right-4 z-20">
              <MapPetCompanion 
                petEmoji="🐕"
                petName="毛毛"
              />
            </div>
          </div>
        </section>

        {/* Progress Section */}
        <section className="mt-5">
          <ProgressSection onViewDetails={() => router.push("/adventure/progress")} />
        </section>

        {/* Adventure Path */}
        <section className="mt-5">
          <AdventurePath 
            onStageSelect={(id) => console.log("Selected stage:", id)}
          />
        </section>

        {/* Reward Discovery */}
        <section className="mt-5 pb-4">
          <RewardDiscovery onViewCollection={() => router.push("/adventure/collection")} />
        </section>
      </main>

      {/* === BOTTOM NAVIGATION === */}
      <BottomNavigation activeItem="adventure" onNavigate={handleNavigation} />
    </div>
  )
}

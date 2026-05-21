"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserHeader } from "@/components/game/user-header"
import { AdventureBanner } from "@/components/game/adventure-banner"
import { PetCompanionCard } from "@/components/game/pet-companion-card"
import { DailyMissions } from "@/components/game/daily-missions"
import { ReadingLibrary } from "@/components/game/reading-library"
import { PKChallenge } from "@/components/game/pk-challenge"
import { BottomNavigation } from "@/components/game/bottom-navigation"

type NavItem = "home" | "library" | "adventure" | "pets" | "profile"

export default function HomePage() {
  const [activeNav, setActiveNav] = useState<NavItem>("home")
  const router = useRouter()

  const handleNavigation = (item: NavItem) => {
    setActiveNav(item)
    if (item === "adventure") {
      router.push("/adventure")
    }
    if (item === "library") {
      router.push("/library")
    }
    if (item === "pets") {
      router.push("/pets")
    }
    if (item === "profile") {
      router.push("/profile")
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28 relative overflow-hidden">
      {/* Global ambient floating particles for living world feel */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-ambient-float"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              backgroundColor: i % 3 === 0 
                ? 'rgba(34, 197, 94, 0.15)' 
                : i % 3 === 1 
                ? 'rgba(251, 191, 36, 0.12)' 
                : 'rgba(168, 85, 247, 0.1)',
              left: `${5 + (i * 6)}%`,
              top: `${10 + (i % 5) * 18}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${8 + (i % 4) * 2}s`,
            }}
          />
        ))}
      </div>
      
      {/* Main content */}
      <div className="mx-auto max-w-md px-4 py-4 relative z-10">
        {/* User Header with progression */}
        <UserHeader
          username="小冒险家"
          level={12}
          coins={2680}
          energy={45}
          maxEnergy={60}
          dailyStreak={7}
          adventureLevel={3}
          worldProgress={42}
        />

        {/* Adventure Banner - world exploration portal */}
        <div className="mt-4">
          <AdventureBanner
            currentChapter="第三章"
            currentWorld="魔法森林"
            progress={65}
            explorationPercent={42}
            discoveredRegions={3}
            totalRegions={7}
            onStartAdventure={() => router.push("/adventure")}
          />
        </div>

        {/* Content grid */}
        <div className="mt-4 grid gap-4">
          {/* Pet Companion Card - emotional companion */}
          <PetCompanionCard
            petName="毛毛"
            petLevel={12}
            petMood="happy"
            petEmoji="🐕"
            happiness={85}
            energy={70}
            rarity="epic"
            onFeed={() => console.log("Feed pet!")}
            onTrain={() => console.log("Train pet!")}
            onView={() => router.push("/pets")}
          />

          {/* Daily Missions - achievement system */}
          <DailyMissions 
            onClaimReward={(id) => console.log("Claim reward:", id)}
          />

          {/* Reading Library - collectible archive */}
          <ReadingLibrary
            onContinueReading={() => console.log("Continue reading!")}
            onViewLibrary={() => router.push("/library")}
          />

          {/* PK Challenge - competitive element */}
          <PKChallenge
            remainingChallenges={3}
            maxChallenges={5}
            currentRank={15}
            winStreak={3}
            onChallenge={() => router.push("/battle")}
            onViewRanking={() => router.push("/battle")}
          />
        </div>
      </div>

      {/* Bottom Navigation - floating game style */}
      <BottomNavigation
        activeItem={activeNav}
        onNavigate={handleNavigation}
      />
      
      {/* Global animation styles */}
      <style jsx global>{`
        @keyframes ambient-float {
          0% { 
            transform: translateY(0) translateX(0) scale(1); 
            opacity: 0.1; 
          }
          25% { 
            transform: translateY(-30px) translateX(10px) scale(1.2); 
            opacity: 0.3; 
          }
          50% { 
            transform: translateY(-60px) translateX(-5px) scale(1); 
            opacity: 0.2; 
          }
          75% { 
            transform: translateY(-90px) translateX(15px) scale(1.1); 
            opacity: 0.15; 
          }
          100% { 
            transform: translateY(-120px) translateX(0) scale(0.8); 
            opacity: 0; 
          }
        }
        .animate-ambient-float {
          animation: ambient-float linear infinite;
        }
      `}</style>
    </div>
  )
}

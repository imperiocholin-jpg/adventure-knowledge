"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdventurerHero } from "@/components/profile/adventurer-hero"
import { GrowthProgress } from "@/components/profile/growth-progress"
import { AchievementWall } from "@/components/profile/achievement-wall"
import { AdventureJournal } from "@/components/profile/adventure-journal"
import { SocialRanking } from "@/components/profile/social-ranking"
import { PetHomeShowcase } from "@/components/profile/pet-home-showcase"
import { SettingsArea } from "@/components/profile/settings-area"
import { BottomNavigation } from "@/components/game/bottom-navigation"

type NavItem = "home" | "library" | "adventure" | "pets" | "profile"

export default function ProfilePage() {
  const router = useRouter()
  const [activeNav] = useState<NavItem>("profile")

  const handleNavigation = (item: NavItem) => {
    if (item === "home") router.push("/")
    if (item === "adventure") router.push("/adventure")
    if (item === "library") router.push("/library")
    if (item === "pets") router.push("/pets")
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Adventurer Hero - magical identity card */}
      <AdventurerHero
        username="小冒险家"
        adventureTitle="森林守护者"
        level={12}
        currentWorld="魔法森林"
        rankBadge="gold"
      />

      {/* Content sections - more breathing room */}
      <div className="px-4 py-5 space-y-5">
        {/* Growth Progress - 2x2 grid */}
        <GrowthProgress
          readingStreak={7}
          worldsExplored={3}
          completedBooks={12}
          collectedStars={156}
          currentLevelXp={680}
          nextLevelXp={1000}
          adventureLevel={12}
        />

        {/* Pet Home Showcase - emotional bond */}
        <PetHomeShowcase
          petEmoji="🐕"
          petName="毛毛"
          affectionLevel={85}
          companionDays={28}
          favoriteMemory="一起完成了《小王子》"
          onClick={() => router.push("/pets")}
        />

        {/* Achievement Wall - horizontal scroll */}
        <AchievementWall
          onViewAll={() => console.log("View all badges")}
        />

        {/* Adventure Journal - only 3 entries */}
        <AdventureJournal />

        {/* Social Ranking - compact card */}
        <SocialRanking
          myRank={15}
          myScore={1560}
          onViewAll={() => router.push("/battle")}
        />

        {/* Settings - collapsed to single button */}
        <SettingsArea
          onSettings={() => console.log("Settings")}
          onFeedback={() => console.log("Feedback")}
          onParentArea={() => console.log("Parent area")}
          onAccount={() => console.log("Account")}
        />
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeItem={activeNav}
        onNavigate={handleNavigation}
      />
    </div>
  )
}

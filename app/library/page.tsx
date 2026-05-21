"use client"

import { useRouter } from "next/navigation"
import { LibraryHeader } from "@/components/library/library-header"
import { SearchFilter } from "@/components/library/search-filter"
import { FeaturedWorlds } from "@/components/library/featured-worlds"
import { BookCollection } from "@/components/library/book-collection"
import { ReadingStats } from "@/components/library/reading-stats"
import { UnlockableRewards } from "@/components/library/unlockable-rewards"
import { BottomNavigation } from "@/components/game/bottom-navigation"

export default function LibraryPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-56 h-56 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <LibraryHeader 
          onBack={() => router.push("/")}
          notificationCount={3}
        />

        {/* Main content */}
        <div className="space-y-5 pt-2">
          {/* Search bar */}
          <SearchFilter
            onSearch={(query) => console.log("[v0] Search:", query)}
            onLevelChange={(level) => console.log("[v0] Level:", level)}
          />

          {/* Reading Progress Stats */}
          <ReadingStats
            totalBooks={24}
            completedBooks={8}
            totalStars={18}
            maxStars={72}
            readingStreak={7}
            weeklyProgress={65}
          />

          {/* Featured Reading Worlds */}
          <FeaturedWorlds
            onWorldSelect={(worldId) => console.log("[v0] World selected:", worldId)}
            onExploreMore={() => router.push("/library/worlds")}
          />

          {/* Book Collection Grid - now includes category filters */}
          <BookCollection
            onBookSelect={(bookId) => console.log("[v0] Book selected:", bookId)}
            onViewAll={() => router.push("/library/books")}
            onCategoryChange={(cat) => console.log("[v0] Category:", cat)}
          />

          {/* Unlockable Rewards */}
          <UnlockableRewards
            onRewardClick={(rewardId) => console.log("[v0] Reward clicked:", rewardId)}
            onViewAll={() => router.push("/library/treasures")}
          />
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeItem="library"
        onNavigate={(item) => {
          if (item === "home") router.push("/")
          if (item === "adventure") router.push("/adventure")
        }}
      />
    </div>
  )
}

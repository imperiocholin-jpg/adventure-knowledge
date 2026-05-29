"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LibraryHeader } from "@/components/library/library-header"
import { SearchFilter } from "@/components/library/search-filter"
import { FeaturedWorlds } from "@/components/library/featured-worlds"
import { BookCollection } from "@/components/library/book-collection"
import { ReadingStats } from "@/components/library/reading-stats"
import { UnlockableRewards } from "@/components/library/unlockable-rewards"
import { BottomNavigation } from "@/components/game/bottom-navigation"
import { PlayerPageShell } from "@/components/layout/player-page-shell"
import {
  fetchAdventureDashboard,
  resolveAdventurerTitleLabel,
} from "@/lib/adventure/adventure-dashboard-client"
import { getCatalogStats } from "@/lib/library/library-books"
import type { GradeBand } from "@/lib/library/moe-catalog-2020"

export default function LibraryPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [gradeBand, setGradeBand] = useState<GradeBand | "">("")
  const stats = getCatalogStats()
  const [totalStars, setTotalStars] = useState(0)
  const [worldProgress, setWorldProgress] = useState(0)
  const [adventureLevel, setAdventureLevel] = useState(1)
  const [dailyStreak, setDailyStreak] = useState(0)
  const [userExpInLevel, setUserExpInLevel] = useState(0)
  const [userExpToNext, setUserExpToNext] = useState(100)
  const [adventureTitle, setAdventureTitle] = useState("见习冒险家")

  useEffect(() => {
    void (async () => {
      const dashboard = await fetchAdventureDashboard()
      if (dashboard.progress) {
        setTotalStars(dashboard.progress.totalStars)
        setWorldProgress(dashboard.progress.worldProgress)
      }
      if (dashboard.user) {
        setAdventureLevel(dashboard.user.adventureLevel)
        setAdventureTitle(resolveAdventurerTitleLabel(dashboard.user.adventureLevel))
        setDailyStreak(dashboard.user.dailyStreak)
        setUserExpInLevel(dashboard.user.userExpInLevel)
        setUserExpToNext(dashboard.user.userExpToNext)
      }
    })()
  }, [])

  const handleBookSelect = (bookId: string, available: boolean) => {
    if (!available) return
    router.push(`/library/read/${bookId}`)
  }

  return (
    <PlayerPageShell className="bg-background">
      <div className="relative z-10">
        <LibraryHeader onBack={() => router.push("/")} notificationCount={3} />

        <div className="space-y-5 pt-2">
          <SearchFilter onSearch={setSearchQuery} onLevelChange={setGradeBand} />

          <ReadingStats
            totalBooks={stats.total}
            completedBooks={0}
            totalStars={totalStars}
            readingStreak={dailyStreak}
            worldProgress={worldProgress}
            adventureLevel={adventureLevel}
            adventureTitle={adventureTitle}
            adventureExpInLevel={userExpInLevel}
            adventureExpToNext={userExpToNext}
          />

          <FeaturedWorlds
            onWorldSelect={(worldId) => router.push(`/adventure/${worldId}`)}
            onExploreMore={() => router.push("/adventure")}
          />

          <BookCollection
            gradeBand={gradeBand}
            searchQuery={searchQuery}
            onBookSelect={handleBookSelect}
          />

          <UnlockableRewards onViewAll={() => router.push("/library/treasures")} />
        </div>
      </div>

      <BottomNavigation />
    </PlayerPageShell>
  )
}

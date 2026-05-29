"use client"

import { useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"

import { AdventurerHero } from "@/components/profile/adventurer-hero"
import { GrowthProgress } from "@/components/profile/growth-progress"
import { AchievementWall } from "@/components/profile/achievement-wall"
import { AdventureJournal } from "@/components/profile/adventure-journal"
import { SocialRanking } from "@/components/profile/social-ranking"
import { PetHomeShowcase } from "@/components/profile/pet-home-showcase"
import { ProfileMenuList, buildDefaultProfileMenuItems } from "@/components/profile/profile-menu"
import { BottomNavigation } from "@/components/game/bottom-navigation"
import { PlayerPageShell } from "@/components/layout/player-page-shell"
import { useProfileOverview } from "@/hooks/use-profile-overview"
import { resolveAdventurerTitleLabel, resolveRankBadge } from "@/lib/profile/rank-badge"
import { clearProfileSessionCache } from "@/lib/profile/session-cache"
import { clearLocalUserProfilePatch } from "@/lib/user/user-profile"
import { clearLocalPetProfilePatch } from "@/lib/pets/pet-profile"

type NavItem = "home" | "library" | "adventure" | "pets" | "profile"

export default function ProfilePage() {
  const router = useRouter()
  const { user, pet, social, dashboard, isDisplayReady, refresh } = useProfileOverview()

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" })
        if (!response.ok) {
          router.push("/auth")
          return
        }
        void fetch("/api/users/daily-activity", { method: "POST" }).catch(() => undefined)
      } catch {
        router.push("/auth")
      }
    })()
  }, [router])

  const refreshAll = useCallback(async () => {
    await refresh()
  }, [refresh])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshAll()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [refreshAll])

  const adventureLevel = dashboard.adventureUser?.adventureLevel ?? user.adventureLevel
  const adventureTitle = resolveAdventurerTitleLabel(adventureLevel)
  const rankBadge = resolveRankBadge(adventureLevel)
  const dailyStreak = dashboard.adventureUser?.dailyStreak ?? user.dailyStreak
  const battleWins = dashboard.battleWins || social.myBattleWins

  const favoriteMemory = useMemo(() => {
    if (dashboard.completedBooks > 0) {
      return `已完成 ${dashboard.completedBooks} 本书的阅读挑战`
    }
    if (dashboard.treasuresUnlocked > 0) {
      return `发现了 ${dashboard.treasuresUnlocked} 件神秘宝藏`
    }
    return "继续冒险，创造更多美好回忆吧"
  }, [dashboard.completedBooks, dashboard.treasuresUnlocked])

  const handleNavigation = (item: NavItem) => {
    if (item === "home") router.push("/")
    if (item === "adventure") router.push("/adventure")
    if (item === "library") router.push("/library")
    if (item === "pets") router.push("/pets")
  }

  const handleLogout = async () => {
    if (!window.confirm("确定要退出登录吗？")) return
    clearProfileSessionCache()
    clearLocalUserProfilePatch()
    clearLocalPetProfilePatch()
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/auth")
    router.refresh()
  }

  const menuItems = buildDefaultProfileMenuItems({ onLogout: () => void handleLogout() })

  return (
    <PlayerPageShell className="bg-background">
      <AdventurerHero
        avatar={user.avatarSrc}
        username={user.username}
        isUsernameLoading={!isDisplayReady}
        adventureTitle={adventureTitle}
        level={adventureLevel}
        currentWorld={dashboard.currentWorld}
        rankBadge={rankBadge}
        followingCount={social.followingCount}
        followerCount={social.followerCount}
        schoolName={user.schoolName}
        gradeClass={user.gradeClass}
        age={user.age}
        metrics={{
          coins: user.coins,
          dailyStreak,
          battleWins,
        }}
        onEditProfile={() => router.push("/profile/edit")}
        onFollowingClick={() => router.push("/profile/following")}
        onFollowersClick={() => router.push("/profile/followers")}
      />

      <div className="space-y-4 px-4 pb-5 pt-3">
        <GrowthProgress
          worldsExplored={dashboard.worldsExplored}
          completedBooks={dashboard.completedBooks}
          collectedStars={dashboard.adventureProgress?.totalStars ?? 0}
          currentLevelXp={dashboard.adventureUser?.userExpInLevel ?? user.userExpInLevel}
          nextLevelXp={dashboard.adventureUser?.userExpToNext ?? user.userExpToNext}
          adventureLevel={adventureLevel}
        />

        <PetHomeShowcase
          petEmoji={pet.emoji}
          petAvatarSrc={pet.avatarSrc}
          petName={pet.name}
          isPetNameLoading={!isDisplayReady}
          affectionLevel={dashboard.petBond}
          companionDays={dashboard.companionDays}
          favoriteMemory={favoriteMemory}
          onClick={() => router.push("/pets")}
        />

        <SocialRanking myRank={social.myRank} onViewAll={() => router.push("/leaderboard")} />

        <AchievementWall
          featuredBadges={dashboard.featuredBadges}
          totalUnlocked={dashboard.totalBadgesUnlocked}
          totalBadges={dashboard.totalBadges}
          onViewAll={() => router.push("/adventure/progress")}
        />

        <AdventureJournal entries={dashboard.journalEntries} />

        <ProfileMenuList items={menuItems} onNavigate={(href) => router.push(href)} />
      </div>

      <BottomNavigation onNavigate={handleNavigation} />
    </PlayerPageShell>
  )
}

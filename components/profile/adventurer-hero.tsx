"use client"

import { Pencil } from "lucide-react"

import { ProfileHero, type ProfileHeroMetrics } from "@/components/profile/profile-hero"

interface AdventurerHeroProps {
  avatar?: string
  username?: string
  isUsernameLoading?: boolean
  adventureTitle: string
  level: number
  currentWorld: string
  rankBadge: "bronze" | "silver" | "gold" | "diamond" | "master"
  followingCount?: number
  followerCount?: number
  schoolName?: string | null
  gradeClass?: string | null
  age?: number | null
  metrics?: ProfileHeroMetrics
  onEditProfile?: () => void
  onFollowingClick?: () => void
  onFollowersClick?: () => void
}

export function AdventurerHero({
  avatar,
  username,
  isUsernameLoading = false,
  adventureTitle = "森林守护者",
  level = 12,
  currentWorld = "魔法森林",
  rankBadge = "gold",
  followingCount = 0,
  followerCount = 0,
  schoolName,
  gradeClass,
  age,
  metrics,
  onEditProfile,
  onFollowingClick,
  onFollowersClick,
}: AdventurerHeroProps) {
  return (
    <ProfileHero
      avatar={avatar}
      username={username}
      isUsernameLoading={isUsernameLoading}
      adventureTitle={adventureTitle}
      level={level}
      rankBadge={rankBadge}
      followingCount={followingCount}
      followerCount={followerCount}
      schoolName={schoolName}
      gradeClass={gradeClass}
      age={age}
      currentWorld={currentWorld}
      metrics={metrics}
      onFollowingClick={onFollowingClick}
      onFollowersClick={onFollowersClick}
      topRight={
        onEditProfile ? (
          <button
            type="button"
            onClick={onEditProfile}
            className="flex items-center gap-1 rounded-full border border-border/60 bg-background/90 px-2.5 py-1 text-[10px] font-medium text-muted-foreground shadow-sm transition hover:text-foreground"
          >
            <Pencil className="h-3 w-3" />
            编辑
          </button>
        ) : undefined
      }
    />
  )
}

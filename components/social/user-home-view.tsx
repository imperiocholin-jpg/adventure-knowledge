"use client"

import { cn } from "@/lib/utils"
import { Heart, PawPrint } from "lucide-react"

import { PetAvatar } from "@/components/pets/pet-avatar"
import { ProfileHero } from "@/components/profile/profile-hero"
import { resolveRankBadge } from "@/lib/profile/rank-badge"
import type { PublicUserProfile } from "@/lib/social/types"

interface UserHomeViewProps {
  profile: PublicUserProfile
  isFollowLoading?: boolean
  onFollowToggle?: () => void
}

export function UserHomeView({
  profile,
  isFollowLoading,
  onFollowToggle,
}: UserHomeViewProps) {
  const rankBadge = resolveRankBadge(profile.adventureLevel)

  return (
    <div className="pb-10">
      <ProfileHero
        className="pt-0"
        avatar={profile.avatarSrc}
        username={profile.username}
        adventureTitle={profile.adventureTitle}
        level={profile.adventureLevel}
        rankBadge={rankBadge}
        followingCount={profile.followingCount}
        followerCount={profile.followerCount}
        schoolName={profile.schoolName}
        gradeClass={profile.gradeClass}
        age={profile.age}
        metrics={{
          dailyStreak: profile.dailyStreak,
          battleWins: profile.battleWins,
        }}
        bottomAction={
          !profile.isSelf && onFollowToggle ? (
            <button
              type="button"
              disabled={isFollowLoading}
              onClick={onFollowToggle}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-60",
                profile.isFollowing
                  ? "border border-border bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {isFollowLoading ? "…" : profile.isFollowing ? "已关注" : "+ 关注"}
            </button>
          ) : undefined
        }
      />

      <div className="space-y-4 px-4 pt-3">
        <section className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-emerald-500/[0.06]" />

          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <PawPrint className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-sm font-bold text-foreground">宠物伙伴</h2>
            </div>

            {profile.pet ? (
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-full bg-primary/15 blur-md" />
                  <PetAvatar
                    src={profile.pet.avatarSrc}
                    emoji={profile.pet.emoji}
                    alt={profile.pet.name}
                    size="lg"
                    rounded="full"
                    className="relative border-2 border-primary/20 shadow-sm"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-foreground">{profile.pet.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {profile.pet.breed} · {profile.pet.lifeStage} · Lv.{profile.pet.level}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Heart className="h-3 w-3 fill-rose-400 text-rose-400" />
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
                        style={{ width: `${profile.pet.bond}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-primary">{profile.pet.bond}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">这位冒险家还没有选择宠物伙伴</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

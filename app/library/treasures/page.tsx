"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronLeft, Bell, Gift } from "lucide-react"
import { BottomNavigation } from "@/components/game/bottom-navigation"
import { PlayerPageShell } from "@/components/layout/player-page-shell"
import { TreasureRewardList } from "@/components/library/treasure-reward-list"
import { fetchUserTreasures } from "@/lib/treasures/treasures-client"
import type { TreasureListItem, TreasureRewardType } from "@/lib/treasures/types"

type StatusFilter = "all" | "unlocked" | "inProgress" | "locked"

export default function TreasuresPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<StatusFilter>("all")
  const [typeFilter, setTypeFilter] = useState<TreasureRewardType | "all">("all")
  const [rewards, setRewards] = useState<TreasureListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      setIsLoading(true)
      const data = await fetchUserTreasures()
      setRewards(data?.items ?? [])
      setIsLoading(false)
    })()
  }, [])

  const filteredRewards = useMemo(() => {
    return rewards.filter((reward) => {
      const matchesStatus =
        filter === "all" ||
        (filter === "unlocked" && reward.unlocked) ||
        (filter === "inProgress" && !reward.unlocked && reward.progress > 0) ||
        (filter === "locked" && !reward.unlocked && reward.progress === 0)
      const matchesType = typeFilter === "all" || reward.type === typeFilter
      return matchesStatus && matchesType
    })
  }, [filter, rewards, typeFilter])

  const unlockedCount = rewards.filter((reward) => reward.unlocked).length
  const rareUnlocked = rewards.filter((reward) => reward.rarity === "rare" && reward.unlocked).length
  const rareTotal = rewards.filter((reward) => reward.rarity === "rare").length
  const epicUnlocked = rewards.filter((reward) => reward.rarity === "epic" && reward.unlocked).length
  const epicTotal = rewards.filter((reward) => reward.rarity === "epic").length
  const legendaryUnlocked = rewards.filter((reward) => reward.rarity === "legendary" && reward.unlocked).length
  const legendaryTotal = rewards.filter((reward) => reward.rarity === "legendary").length

  const handleNavigation = (item: string) => {
    if (item === "home") router.push("/")
    if (item === "library") router.push("/library")
    if (item === "adventure") router.push("/adventure")
    if (item === "pets") router.push("/pets")
    if (item === "profile") router.push("/profile")
  }

  return (
    <PlayerPageShell className="bg-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => router.push("/library")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-500" />
            <h1 className="text-lg font-bold">神秘宝藏</h1>
          </div>
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 hover:bg-muted transition-colors"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {[
            { id: "all", label: "全部宝藏" },
            { id: "unlocked", label: "已获得" },
            { id: "inProgress", label: "解锁中" },
            { id: "locked", label: "待解锁" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as StatusFilter)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                filter === tab.id
                  ? "bg-purple-500 text-white"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {[
            { id: "all", label: "全部类型" },
            { id: "pet", label: "宠物" },
            { id: "skin", label: "装扮" },
            { id: "badge", label: "徽章" },
            { id: "area", label: "地图" },
            { id: "item", label: "道具" },
            { id: "title", label: "称号" },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setTypeFilter(type.id as TreasureRewardType | "all")}
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all",
                typeFilter === type.id
                  ? "bg-foreground text-background"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted",
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 rounded-2xl p-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs mb-1">宝藏收集进度</p>
              <p className="text-white text-2xl font-bold">
                {isLoading ? "—" : `${unlockedCount}/${rewards.length}`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-white/80 text-xs">稀有</span>
                <span className="text-white font-bold">
                  {isLoading ? "—" : `${rareUnlocked}/${rareTotal}`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-white/80 text-xs">史诗</span>
                <span className="text-white font-bold">
                  {isLoading ? "—" : `${epicUnlocked}/${epicTotal}`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-white/80 text-xs">传说</span>
                <span className="text-white font-bold">
                  {isLoading ? "—" : `${legendaryUnlocked}/${legendaryTotal}`}
                </span>
              </div>
            </div>
          </div>
          <div className="relative mt-3">
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all"
                style={{
                  width: isLoading || rewards.length === 0 ? "0%" : `${(unlockedCount / rewards.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((key) => (
              <div key={key} className="h-52 rounded-2xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : filteredRewards.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">当前筛选下暂无宝藏。</p>
        ) : (
          <TreasureRewardList rewards={filteredRewards} layout="grid" />
        )}
      </div>

      <BottomNavigation activeItem="library" onNavigate={handleNavigation} />
    </PlayerPageShell>
  )
}

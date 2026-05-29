"use client"

import { useEffect, useState } from "react"
import { ChevronRight, Gift } from "lucide-react"
import { TreasureRewardList } from "@/components/library/treasure-reward-list"
import { fetchUserTreasures } from "@/lib/treasures/treasures-client"
import type { TreasureListItem } from "@/lib/treasures/types"

interface UnlockableRewardsProps {
  onRewardClick?: (rewardId: string) => void
  onViewAll?: () => void
}

export function UnlockableRewards({ onRewardClick, onViewAll }: UnlockableRewardsProps) {
  const [rewards, setRewards] = useState<TreasureListItem[]>([])
  const [unlockedCount, setUnlockedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    void (async () => {
      setIsLoading(true)
      const data = await fetchUserTreasures()
      if (!mounted) return
      if (data) {
        setRewards(data.preview)
        setUnlockedCount(data.unlockedCount)
        setTotalCount(data.totalCount)
      } else {
        setRewards([])
        setUnlockedCount(0)
        setTotalCount(0)
      }
      setIsLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
            <Gift className="h-4 w-4 text-white" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse opacity-40 blur-sm" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">神秘宝藏</h2>
            <p className="text-[10px] text-muted-foreground">
              {isLoading ? "加载中…" : `已解锁 ${unlockedCount}/${totalCount} 件宝物`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-0.5 text-xs text-primary font-medium hover:underline"
        >
          宝库 <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden pb-3">
          {[1, 2, 3].map((key) => (
            <div key={key} className="h-44 w-36 flex-shrink-0 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : rewards.length === 0 ? (
        <p className="text-xs text-muted-foreground pb-3">暂无宝藏数据，请稍后再试。</p>
      ) : (
        <TreasureRewardList rewards={rewards} onRewardClick={onRewardClick} layout="scroll" />
      )}
    </div>
  )
}

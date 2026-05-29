"use client"

import Image from "next/image"
import { Check, Crown, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BossChallengeSnapshot } from "@/lib/adventure/boss-eligibility"
import type { RegionBossConfig } from "@/lib/adventure/region-boss"

interface RegionBossPanelProps {
  boss: RegionBossConfig
  bossSnapshot: BossChallengeSnapshot | null
  isBossLoading?: boolean
  onChallenge?: () => void
}

export function RegionBossPanel({
  boss,
  bossSnapshot,
  isBossLoading = false,
  onChallenge,
}: RegionBossPanelProps) {
  const bossStatus = bossSnapshot?.status ?? "locked"

  return (
    <section className="px-4 pb-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
          <Crown className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">区域守护者</h3>
          <p className="text-[10px] text-muted-foreground">完成冒险之路后可挑战 BOSS</p>
        </div>
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border shadow-lg",
          bossStatus === "defeated"
            ? "border-emerald-300/60 bg-gradient-to-br from-emerald-50 via-teal-50/80 to-emerald-100/60"
            : bossStatus === "ready"
              ? "border-amber-300/60 bg-gradient-to-br from-amber-50 via-orange-50/80 to-amber-100/60"
              : "border-border/50 bg-gradient-to-br from-slate-50 via-white to-slate-100/80",
        )}
      >
        {bossStatus === "ready" ? (
          <div className="pointer-events-none absolute inset-0 animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        ) : null}

        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={boss.imageSrc}
            alt={boss.name}
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            className={cn(
              "object-cover object-center transition-all",
              bossStatus === "locked" && "opacity-60 grayscale",
            )}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

          {bossStatus === "locked" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
              <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                尚未解锁
              </span>
            </div>
          ) : null}

          {bossStatus === "defeated" ? (
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md">
              <Check className="h-3 w-3" strokeWidth={3} />
              已击败
            </div>
          ) : null}

          {bossStatus === "ready" ? (
            <div className="absolute right-3 top-3 flex h-6 w-6 animate-pulse items-center justify-center rounded-full border-2 border-white bg-red-500 shadow-md">
              <span className="text-[10px] font-bold text-white">!</span>
            </div>
          ) : null}
        </div>

        <div className="relative flex items-end justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-amber-600">BOSS 战</p>
            <p className="truncate text-lg font-bold text-foreground">{boss.name}</p>
            <p className="truncate text-xs text-muted-foreground">{boss.subtitle}</p>
            <div className="mt-1.5 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i <= boss.difficulty ? "fill-amber-400 text-amber-400" : "text-gray-300",
                  )}
                />
              ))}
              <span className="text-[10px] text-muted-foreground">难度</span>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
              {isBossLoading ? "正在检查挑战条件…" : bossSnapshot?.requirementText}
            </p>
          </div>

          {bossStatus === "ready" ? (
            <button
              type="button"
              onClick={onChallenge}
              className="shrink-0 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              挑战
            </button>
          ) : bossStatus === "defeated" ? (
            <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
              已完成
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
              未解锁
            </span>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </section>
  )
}

"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef } from "react"
import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { REGION_SHELF_CONFIG } from "@/lib/adventure/config"
import {
  ADVENTURE_MAP_ASPECT_RATIO,
  ADVENTURE_MAP_BACKGROUND_SRC,
  MAP_BOSS_SIZE_SCALE,
  getMapRegionEntrance,
  MAP_REGION_HOTSPOTS,
  MAP_REGION_PILL_THEME,
} from "@/lib/adventure/map-image-layout"
import { pickActiveRegionId } from "@/lib/adventure/adventure-dashboard-client"
import { getRegionBossConfig } from "@/lib/adventure/region-boss"
import type { AdventureRegionId } from "@/lib/library/adventure-regions"
import { PetAvatar } from "@/components/pets/pet-avatar"

interface WorldMapImageProps {
  onRegionSelect?: (regionId: string) => void
  onLockedRegionSelect?: (regionId: string) => void
  regionProgress?: Record<
    string,
    {
      progress: number
      completedStages: number
      unlocked?: boolean
    }
  >
  companionPet?: {
    name: string
    emoji: string
    avatarSrc: string | null
  }
}

function RegionProgressRing({
  progress,
  ringClass,
  textClass,
  locked,
}: {
  progress: number
  ringClass: string
  textClass: string
  locked: boolean
}) {
  const value = locked ? 0 : Math.min(100, Math.max(0, Math.round(progress)))
  return (
    <div
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-black/35 text-[6px] font-bold leading-none backdrop-blur-sm",
        ringClass,
        locked && "border-white/40 text-white/70",
      )}
    >
      <span className={cn(!locked && textClass)}>{value}%</span>
    </div>
  )
}

export function WorldMapImage({
  onRegionSelect,
  onLockedRegionSelect,
  regionProgress,
  companionPet,
}: WorldMapImageProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const currentHotspotRef = useRef<HTMLDivElement>(null)

  const hotspotStates = useMemo(() => {
    return MAP_REGION_HOTSPOTS.map((hotspot) => {
      const regionId = hotspot.id
      const config = REGION_SHELF_CONFIG[regionId]
      const override = regionProgress?.[regionId]
      const unlocked =
        typeof override?.unlocked === "boolean"
          ? override.unlocked
          : Boolean(config?.unlockedByDefault)
      const progress = override?.progress ?? 0
      const boss = getRegionBossConfig(regionId)
      return {
        ...hotspot,
        name: config?.name ?? regionId,
        bossName: boss?.name ?? "守护者",
        unlocked,
        progress,
        displayWidth: hotspot.bossWidth * MAP_BOSS_SIZE_SCALE,
      }
    })
  }, [regionProgress])

  const petLocationRegionId = useMemo(() => {
    if (!regionProgress) return "magic-forest" as AdventureRegionId
    const progressSnapshot = Object.fromEntries(
      Object.entries(regionProgress).map(([regionId, row]) => {
        const config = REGION_SHELF_CONFIG[regionId as AdventureRegionId]
        return [
          regionId,
          {
            stars: 0,
            totalStages: 0,
            completedStages: row.completedStages,
            progress: row.progress,
            unlocked:
              typeof row.unlocked === "boolean"
                ? row.unlocked
                : Boolean(config?.unlockedByDefault),
          },
        ]
      }),
    )
    return pickActiveRegionId(progressSnapshot) ?? "magic-forest"
  }, [regionProgress])

  const petEntrance = getMapRegionEntrance(petLocationRegionId as AdventureRegionId)

  useEffect(() => {
    const container = scrollRef.current
    const target = currentHotspotRef.current
    if (!container || !target) return

    const timer = window.setTimeout(() => {
      const containerRect = container.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      const offset =
        targetRect.top -
        containerRect.top +
        container.scrollTop -
        containerRect.height * 0.45
      container.scrollTo({ top: Math.max(0, offset), behavior: "smooth" })
    }, 120)

    return () => window.clearTimeout(timer)
  }, [petLocationRegionId])

  return (
    <div
      ref={scrollRef}
      className="h-full touch-pan-y overflow-y-auto overscroll-y-contain bg-background scrollbar-hide pb-[calc(4.75rem+env(safe-area-inset-bottom))]"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="relative mx-auto w-full max-w-md">
        <div className="relative w-full" style={{ aspectRatio: ADVENTURE_MAP_ASPECT_RATIO }}>
          <Image
            src={ADVENTURE_MAP_BACKGROUND_SRC}
            alt="阅读大陆地图"
            fill
            priority
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover object-center"
          />

          {/* 四边渐隐，融入页面白底 */}
          <div className="pointer-events-none absolute inset-0 z-[1]">
            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background to-transparent" />
            <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-background to-transparent" />
            <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-background to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-background to-transparent" />
          </div>

          {hotspotStates.map((hotspot, index) => {
            const theme = MAP_REGION_PILL_THEME[hotspot.id as AdventureRegionId]
            const floatDelay = `${index * 0.35}s`

            return (
              <div
                key={hotspot.id}
                className="absolute z-10 -translate-x-1/2"
                style={{
                  left: `${hotspot.x}%`,
                  top: `${hotspot.y}%`,
                  width: `${hotspot.displayWidth * 100}%`,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (hotspot.unlocked) {
                      onRegionSelect?.(hotspot.id)
                      return
                    }
                    onLockedRegionSelect?.(hotspot.id)
                  }}
                  className={cn(
                    "flex w-full touch-manipulation flex-col items-center",
                    hotspot.unlocked ? "cursor-pointer active:scale-95" : "cursor-not-allowed",
                  )}
                  aria-label={hotspot.name}
                >
                  {/* BOSS 立绘 — 悬浮；宽度相对地图容器 */}
                  <div
                    className="animate-map-boss-float w-full"
                    style={{ animationDelay: floatDelay }}
                  >
                    <div
                      className={cn(
                        "relative aspect-square w-full",
                        !hotspot.unlocked && "brightness-[0.88] saturate-[0.75]",
                      )}
                    >
                      <Image
                        src={hotspot.bossImageSrc}
                        alt={hotspot.bossName}
                        fill
                        sizes="(max-width: 448px) 28vw, 120px"
                        className="object-contain object-center drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)]"
                      />
                      {!hotspot.unlocked ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 backdrop-blur-[2px]">
                            <Lock className="h-4 w-4 text-white/90" />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* 区域标签 — BOSS 下方，独立浮动 */}
                  <div
                    className={cn(
                      "animate-map-label-float -mt-0.5 flex w-max max-w-[7rem] items-center gap-1 rounded-xl border py-1 pl-1.5 pr-1.5 shadow-lg backdrop-blur-md",
                      theme.pill,
                      theme.glow,
                      !hotspot.unlocked && "brightness-90 saturate-75",
                    )}
                    style={{ animationDelay: `${index * 0.35 + 0.5}s` }}
                  >
                    <RegionProgressRing
                      progress={hotspot.progress}
                      ringClass={theme.ring}
                      textClass={theme.progress}
                      locked={!hotspot.unlocked}
                    />
                    <div className="min-w-0 flex-1 text-left leading-tight">
                      <p className={cn("truncate text-[9px] font-bold", theme.text)}>
                        {hotspot.name}
                      </p>
                      <p className={cn("truncate text-[8px] font-medium", theme.bossText)}>
                        {hotspot.bossName}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )
          })}

          {companionPet ? (
            <div
              ref={currentHotspotRef}
              className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${petEntrance.x}%`, top: `${petEntrance.y}%` }}
            >
              <div className="animate-map-boss-float flex flex-col items-center">
                <div className="relative">
                  <span className="absolute inset-0 m-auto h-12 w-12 rounded-full bg-emerald-400/25 blur-sm" />
                  <PetAvatar
                    src={companionPet.avatarSrc}
                    emoji={companionPet.emoji}
                    alt={companionPet.name}
                    size="sm"
                    rounded="full"
                    className="relative border-2 border-white shadow-lg"
                  />
                </div>
                <span className="mt-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[9px] font-semibold text-white shadow-md">
                  当前位置
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        @keyframes map-boss-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-7px);
          }
        }
        @keyframes map-label-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        .animate-map-boss-float {
          animation: map-boss-float 3.2s ease-in-out infinite;
        }
        .animate-map-label-float {
          animation: map-label-float 3.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

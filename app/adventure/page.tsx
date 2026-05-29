"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { WorldMap } from "@/components/adventure/world-map"
import { AdventureMapHeader } from "@/components/adventure/adventure-map-header"
import {
  fetchAdventureDashboard,
  type AdventureProgressSnapshot,
} from "@/lib/adventure/adventure-dashboard-client"
import { BottomNavigation } from "@/components/game/bottom-navigation"
import { PlayerPageShell } from "@/components/layout/player-page-shell"
import {
  REGION_SHELF_CONFIG,
  REGION_UNLOCK_ORDER,
} from "@/lib/adventure/config"
import { Sparkles, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { usePetProfile } from "@/hooks/use-pet-profile"

type AdventureProgressData = AdventureProgressSnapshot
type NavItem = "home" | "library" | "adventure" | "pets" | "profile"

export default function AdventurePage() {
  const { profile: petProfile } = usePetProfile()
  const [selectedRegion, setSelectedRegion] = useState("magic-forest")
  const [playerPos, setPlayerPos] = useState({ x: 22, y: 72 })
  const [showWelcome, setShowWelcome] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const [unlockHintText, setUnlockHintText] = useState<string | null>(null)
  const [newUnlockedRegionText, setNewUnlockedRegionText] = useState<string | null>(null)
  const [isProgressLoading, setIsProgressLoading] = useState(false)
  const [adventureProgress, setAdventureProgress] = useState<AdventureProgressData>({
    totalStars: 0,
    worldProgress: 0,
    regionProgress: {},
  })
  const previousRegionUnlockedRef = useRef<Record<string, boolean>>({})
  const hasHydratedProgressRef = useRef(false)
  const lastToastSignatureRef = useRef<string>("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const regionParam = searchParams.get("region")
    if (regionParam && regionParam in REGION_SHELF_CONFIG) {
      router.replace(`/adventure/${regionParam}`)
    }
  }, [searchParams, router])

  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const refreshAdventureProgress = async () => {
    try {
      setIsProgressLoading(true)
      const dashboard = await fetchAdventureDashboard()
      const data = dashboard.progress
      if (!data) throw new Error("获取地图进度失败")

      const nextProgress: AdventureProgressData = {
        totalStars: data.totalStars,
        worldProgress: data.worldProgress,
        regionProgress: data.regionProgress,
      }

      const previousUnlockedMap = previousRegionUnlockedRef.current
      const currentUnlockedMap: Record<string, boolean> = {}
      let justUnlockedRegionName: string | null = null
      Object.entries(REGION_SHELF_CONFIG).forEach(([regionId, region]) => {
        const nextUnlocked = Boolean(nextProgress.regionProgress[regionId]?.unlocked)
        currentUnlockedMap[regionId] = nextUnlocked
        if (hasHydratedProgressRef.current && !previousUnlockedMap[regionId] && nextUnlocked && !justUnlockedRegionName) {
          justUnlockedRegionName = region.name
        }
      })
      previousRegionUnlockedRef.current = currentUnlockedMap
      if (!hasHydratedProgressRef.current) {
        hasHydratedProgressRef.current = true
      } else if (justUnlockedRegionName) {
        setNewUnlockedRegionText(`新区域已解锁：${justUnlockedRegionName}`)
      }

      setAdventureProgress(nextProgress)
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "获取地图进度失败")
    } finally {
      setIsProgressLoading(false)
    }
  }

  useEffect(() => {
    void refreshAdventureProgress()
  }, [])

  useEffect(() => {
    if (!newUnlockedRegionText) return
    const timer = window.setTimeout(() => setNewUnlockedRegionText(null), 2800)
    return () => window.clearTimeout(timer)
  }, [newUnlockedRegionText])

  useEffect(() => {
    if (!unlockHintText) return
    const timer = window.setTimeout(() => setUnlockHintText(null), 2600)
    return () => window.clearTimeout(timer)
  }, [unlockHintText])

  useEffect(() => {
    if (!dataError) return
    const timer = window.setTimeout(() => setDataError(null), 2600)
    return () => window.clearTimeout(timer)
  }, [dataError])

  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {
      "magic-forest": { x: 22, y: 72 },
      "ice-mountain": { x: 75, y: 18 },
      "ancient-desert": { x: 78, y: 55 },
      "ocean-ruins": { x: 22, y: 42 },
      "sky-kingdom": { x: 28, y: 15 },
      "dream-tower": { x: 52, y: 45 },
    }
    if (positions[selectedRegion]) {
      setPlayerPos(positions[selectedRegion])
    }
  }, [selectedRegion])

  const isRegionUnlocked = (regionId: string) => {
    const dynamicUnlocked = adventureProgress.regionProgress[regionId]?.unlocked
    if (typeof dynamicUnlocked === "boolean") return dynamicUnlocked
    return Boolean(REGION_SHELF_CONFIG[regionId]?.unlockedByDefault)
  }

  const buildRegionUnlockHint = (regionId: string) => {
    if (isRegionUnlocked(regionId)) return null
    const currentIndex = REGION_UNLOCK_ORDER.findIndex((candidate) => candidate === regionId)
    if (currentIndex <= 0) return "该区域暂未解锁，请先完成前置区域挑战。"
    const prevRegionId = REGION_UNLOCK_ORDER[currentIndex - 1]
    const prevRegionName = prevRegionId ? REGION_SHELF_CONFIG[prevRegionId]?.name ?? "前一区域" : "前一区域"
    const threshold = REGION_SHELF_CONFIG[regionId]?.unlockWhenPrevProgressAtLeast ?? 100
    const prevProgress = prevRegionId ? adventureProgress.regionProgress[prevRegionId]?.progress ?? 0 : 0
    return `解锁条件：${prevRegionName}进度达到 ${threshold}%（当前 ${prevProgress}%）`
  }

  const mobileToast = useMemo(() => {
    if (dataError) return { text: dataError, tone: "error" as const }
    if (unlockHintText) return { text: unlockHintText, tone: "warning" as const }
    if (newUnlockedRegionText) return { text: newUnlockedRegionText, tone: "success" as const }
    return null
  }, [dataError, newUnlockedRegionText, unlockHintText])

  useEffect(() => {
    if (!mobileToast) {
      lastToastSignatureRef.current = ""
      return
    }
    const signature = `${mobileToast.tone}:${mobileToast.text}`
    if (lastToastSignatureRef.current === signature) return
    lastToastSignatureRef.current = signature
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      if (mobileToast.tone === "success") navigator.vibrate(20)
      if (mobileToast.tone === "warning") navigator.vibrate([20, 30, 20])
      if (mobileToast.tone === "error") navigator.vibrate([30, 40, 30])
    }
  }, [mobileToast])

  const handleNavigation = (item: NavItem) => {
    if (item === "home") router.push("/")
    if (item === "library") router.push("/library")
    if (item === "pets") router.push("/pets")
    if (item === "profile") router.push("/profile")
  }

  const handleRegionSelect = (regionId: string) => {
    if (!isRegionUnlocked(regionId)) {
      setUnlockHintText(buildRegionUnlockHint(regionId))
      return
    }
    setUnlockHintText(null)
    setSelectedRegion(regionId)
    router.push(`/adventure/${regionId}`)
  }

  const handleLockedRegionSelect = (regionId: string) => {
    setUnlockHintText(buildRegionUnlockHint(regionId))
  }

  return (
    <PlayerPageShell className="relative bg-gradient-to-b from-indigo-100/80 via-sky-50 to-emerald-50/50">
      <AdventureMapHeader
        totalStars={adventureProgress.totalStars}
        worldProgress={adventureProgress.worldProgress}
        isProgressLoading={isProgressLoading}
      />

      {showWelcome && (
        <div className="fixed top-28 left-1/2 z-50 -translate-x-1/2 animate-in fade-in-0 slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/90 px-4 py-2 shadow-xl backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-foreground">欢迎回到冒险世界！</span>
          </div>
        </div>
      )}

      <main className="relative z-10 px-4 pt-3 pb-4">
        <WorldMap
          selectedRegion={selectedRegion}
          onRegionSelect={handleRegionSelect}
          onLockedRegionSelect={handleLockedRegionSelect}
          playerPosition={playerPos}
          regionProgress={Object.fromEntries(
            Object.entries(adventureProgress.regionProgress).map(([regionId, region]) => [
              regionId,
              {
                progress: region.progress,
                completedStages: region.completedStages,
                unlocked: region.unlocked,
              },
            ]),
          )}
          companionPet={{
            name: petProfile.name,
            emoji: petProfile.emoji,
            avatarSrc: petProfile.avatarSrc,
          }}
        />

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          点击已解锁区域，进入该区域的冒险之路
        </p>
      </main>

      <BottomNavigation activeItem="adventure" onNavigate={handleNavigation} />

      {mobileToast && (
        <div className="fixed bottom-24 left-1/2 z-[70] w-[88%] max-w-sm -translate-x-1/2 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
          <div
            className={[
              "flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-medium shadow-xl backdrop-blur-md",
              mobileToast.tone === "error" ? "bg-red-500/90 text-white" : "",
              mobileToast.tone === "warning" ? "bg-amber-500/90 text-white" : "",
              mobileToast.tone === "success" ? "bg-emerald-500/90 text-white" : "",
            ].join(" ")}
          >
            {mobileToast.tone === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {mobileToast.tone === "warning" && <AlertTriangle className="h-4 w-4 shrink-0" />}
            {mobileToast.tone === "error" && <XCircle className="h-4 w-4 shrink-0" />}
            <span className="flex-1 text-center">{mobileToast.text}</span>
          </div>
        </div>
      )}
    </PlayerPageShell>
  )
}

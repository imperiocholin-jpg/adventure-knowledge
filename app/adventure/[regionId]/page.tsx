"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { AdventurePath } from "@/components/adventure/adventure-path"
import { AdventureRegionHeader } from "@/components/adventure/adventure-region-header"
import { RegionBossPanel } from "@/components/adventure/region-boss-panel"
import {
  fetchAdventureDashboard,
  type AdventureProgressSnapshot,
} from "@/lib/adventure/adventure-dashboard-client"
import { BottomNavigation } from "@/components/game/bottom-navigation"
import { PlayerPageShell, PLAYER_SHELL_MAX_CLASS } from "@/components/layout/player-page-shell"
import { StoryAdventurePanel } from "@/components/game/story-adventure-panel"
import { Button } from "@/components/ui/button"
import { loadChapter } from "@/lib/story/load-chapter"
import type { StoryChapter } from "@/lib/story/types"
import { bookReadPath } from "@/lib/library/book-id-route"
import { buildRegionAdventureBooks } from "@/lib/library/library-books"
import type { AdventureRegionId } from "@/lib/library/adventure-regions"
import { GRADE_BAND_LABEL } from "@/lib/library/moe-catalog-2020"
import {
  CHALLENGE_REWARD_POLICY,
  DIRECT_CHALLENGE_DAILY_LIMIT,
  REGION_SHELF_CONFIG,
  resolveRegionIdByBookId,
  type StoryEntryMode,
} from "@/lib/adventure/config"
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react"
import type { BossChallengeSnapshot } from "@/lib/adventure/boss-eligibility"
import { getRegionBossConfig } from "@/lib/adventure/region-boss"

type AdventureProgressData = AdventureProgressSnapshot
type NavItem = "home" | "library" | "adventure" | "pets" | "profile"

interface LastReadContext {
  bookId: string
  sourceBookTitle: string
  sourceChapterLabel: string
}

const LAST_READ_STORAGE_KEY = "ak_last_read_context"

export default function RegionAdventurePage() {
  const params = useParams<{ regionId: string }>()
  const regionId = params.regionId
  const router = useRouter()
  const searchParams = useSearchParams()

  const [showRegionShelf, setShowRegionShelf] = useState(false)
  const [isStoryOpen, setIsStoryOpen] = useState(false)
  const [storyChapter, setStoryChapter] = useState<StoryChapter | null>(null)
  const [storyChapterId, setStoryChapterId] = useState("chapter_1")
  const [storySourceBookTitle, setStorySourceBookTitle] = useState("")
  const [storySourceChapterLabel, setStorySourceChapterLabel] = useState("")
  const [storyEntryMode, setStoryEntryMode] = useState<StoryEntryMode>("post_read")
  const [selectedChallengeBookId, setSelectedChallengeBookId] = useState<string | null>(null)
  const [isStoryLoading, setIsStoryLoading] = useState(false)
  const [storyError, setStoryError] = useState<string | null>(null)
  const [dataError, setDataError] = useState<string | null>(null)
  const [isCompletingChallenge, setIsCompletingChallenge] = useState(false)
  const [isUsageLoading, setIsUsageLoading] = useState(false)
  const [isProgressLoading, setIsProgressLoading] = useState(false)
  const [directChallengeUsedCount, setDirectChallengeUsedCount] = useState(0)
  const [lastRewardText, setLastRewardText] = useState<string | null>(null)
  const [adventureProgress, setAdventureProgress] = useState<AdventureProgressData>({
    totalStars: 0,
    worldProgress: 0,
    regionProgress: {},
  })
  const [bossSnapshot, setBossSnapshot] = useState<BossChallengeSnapshot | null>(null)
  const [isBossLoading, setIsBossLoading] = useState(false)
  const lastToastSignatureRef = useRef<string>("")

  const isValidRegion = regionId in REGION_SHELF_CONFIG
  const bossConfig = getRegionBossConfig(regionId)

  useEffect(() => {
    if (!isValidRegion) {
      router.replace("/adventure")
    }
  }, [isValidRegion, router])

  const refreshDirectChallengeUsage = async () => {
    try {
      setIsUsageLoading(true)
      const response = await fetch("/api/adventure/challenge/usage", { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? "获取挑战次数失败")
      const used = Number(payload?.data?.used ?? 0)
      setDirectChallengeUsedCount(Number.isFinite(used) ? Math.max(0, used) : 0)
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "获取挑战次数失败")
    } finally {
      setIsUsageLoading(false)
    }
  }

  const refreshAdventureProgress = async () => {
    try {
      setIsProgressLoading(true)
      const dashboard = await fetchAdventureDashboard()
      const data = dashboard.progress
      if (!data) throw new Error("获取冒险进度失败")
      setAdventureProgress({
        totalStars: data.totalStars,
        worldProgress: data.worldProgress,
        regionProgress: data.regionProgress,
      })
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "获取冒险进度失败")
    } finally {
      setIsProgressLoading(false)
    }
  }

  const refreshBossStatus = async () => {
    try {
      setIsBossLoading(true)
      const response = await fetch(`/api/adventure/boss?regionId=${encodeURIComponent(regionId)}`, {
        cache: "no-store",
      })
      const payload = await response.json()
      if (response.ok && payload?.ok && payload.data) {
        setBossSnapshot(payload.data as BossChallengeSnapshot)
      } else {
        setBossSnapshot(null)
      }
    } catch {
      setBossSnapshot(null)
    } finally {
      setIsBossLoading(false)
    }
  }

  useEffect(() => {
    if (!isValidRegion) return
    void refreshDirectChallengeUsage()
    void refreshAdventureProgress()
    void refreshBossStatus()
  }, [isValidRegion, regionId])

  useEffect(() => {
    const bossVictory = searchParams.get("bossVictory")
    if (!bossVictory || bossVictory !== regionId) return
    const bossName = getRegionBossConfig(bossVictory)?.name ?? "区域守护者"
    setLastRewardText(`击败 ${bossName}！区域挑战完成`)
    void refreshAdventureProgress()
    void refreshBossStatus()
  }, [searchParams, regionId])

  useEffect(() => {
    if (!lastRewardText) return
    const timer = window.setTimeout(() => setLastRewardText(null), 2500)
    return () => window.clearTimeout(timer)
  }, [lastRewardText])

  useEffect(() => {
    if (!dataError) return
    const timer = window.setTimeout(() => setDataError(null), 2600)
    return () => window.clearTimeout(timer)
  }, [dataError])

  const activeRegionName = REGION_SHELF_CONFIG[regionId]?.name ?? "冒险区域"
  const activeRegionProgress = adventureProgress.regionProgress[regionId]
  const activeRegionStars = activeRegionProgress?.stars ?? 0

  const readLastReadContext = (): LastReadContext | null => {
    if (typeof window === "undefined") return null
    const raw = window.localStorage.getItem(LAST_READ_STORAGE_KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as Partial<LastReadContext>
      if (!parsed.bookId || !parsed.sourceBookTitle || !parsed.sourceChapterLabel) return null
      return {
        bookId: parsed.bookId,
        sourceBookTitle: parsed.sourceBookTitle,
        sourceChapterLabel: parsed.sourceChapterLabel,
      }
    } catch {
      return null
    }
  }

  const resolveChapterIdFromLabel = (label: string) => {
    const match = label.match(/\d+/)
    const chapterNumber = match ? Number.parseInt(match[0], 10) : 1
    const normalized = Number.isFinite(chapterNumber) ? Math.min(5, Math.max(1, chapterNumber)) : 1
    return `chapter_${normalized}`
  }

  const regionBooks = useMemo(() => {
    if (!REGION_SHELF_CONFIG[regionId]) return []
    return buildRegionAdventureBooks(regionId as AdventureRegionId)
  }, [regionId])

  const mobileToast = useMemo(() => {
    if (isCompletingChallenge) return { text: "正在发放挑战奖励...", tone: "info" as const }
    if (dataError) return { text: dataError, tone: "error" as const }
    if (lastRewardText) return { text: lastRewardText, tone: "success" as const }
    return null
  }, [dataError, isCompletingChallenge, lastRewardText])

  useEffect(() => {
    if (!mobileToast) {
      lastToastSignatureRef.current = ""
      return
    }
    const signature = `${mobileToast.tone}:${mobileToast.text}`
    if (lastToastSignatureRef.current === signature) return
    lastToastSignatureRef.current = signature
  }, [mobileToast])

  const loadStoryById = async (chapterId: string) => {
    try {
      setIsStoryLoading(true)
      setStoryError(null)
      const chapter = await loadChapter(chapterId)
      setStoryChapter(chapter)
      setStoryChapterId(chapterId)
    } catch (error) {
      setStoryError(error instanceof Error ? error.message : "章节加载失败")
    } finally {
      setIsStoryLoading(false)
    }
  }

  const openStoryChallenge = async (params: {
    chapterId: string
    sourceBookTitle: string
    sourceChapterLabel: string
    bookId: string
    mode: StoryEntryMode
  }) => {
    setStorySourceBookTitle(params.sourceBookTitle)
    setStorySourceChapterLabel(params.sourceChapterLabel)
    setStoryEntryMode(params.mode)
    setSelectedChallengeBookId(params.bookId)
    setIsStoryOpen(true)
    await loadStoryById(params.chapterId)
  }

  useEffect(() => {
    if (!isValidRegion || searchParams.get("openAdventure") !== "1") return
    const context = readLastReadContext()
    if (!context) {
      setDataError("没有找到最近阅读记录，请先完成一章阅读后再挑战。")
      router.replace(`/adventure/${regionId}`)
      return
    }
    const chapterId = resolveChapterIdFromLabel(context.sourceChapterLabel)
    void openStoryChallenge({
      chapterId,
      sourceBookTitle: context.sourceBookTitle,
      sourceChapterLabel: context.sourceChapterLabel,
      bookId: context.bookId,
      mode: "post_read",
    })
    router.replace(`/adventure/${regionId}`)
  }, [isValidRegion, regionId, router, searchParams])

  const handleBossChallenge = () => {
    if (bossSnapshot?.status !== "ready") {
      setDataError(bossSnapshot?.requirementText ?? "尚未满足 BOSS 挑战条件")
      return
    }
    router.push(`/battle?boss=${encodeURIComponent(regionId)}&from=adventure`)
  }

  const handleStageSelect = (stageId: number) => {
    const totalStages = activeRegionProgress?.totalStages ?? 12
    if (stageId === totalStages) {
      handleBossChallenge()
      return
    }
    setShowRegionShelf(true)
  }

  const handleNavigation = (item: NavItem) => {
    if (item === "home") router.push("/")
    if (item === "library") router.push("/library")
    if (item === "pets") router.push("/pets")
    if (item === "profile") router.push("/profile")
  }

  const handleContinueReading = (bookId: string, contentAvailable: boolean) => {
    if (!contentAvailable) {
      setDataError("该书电子版即将上架，可先选择已上架图书阅读。")
      return
    }
    router.push(bookReadPath(bookId))
  }

  const handleDirectChallenge = async (
    bookId: string,
    challengeChapterId: string,
    bookTitle: string,
    contentAvailable: boolean,
  ) => {
    if (!contentAvailable) {
      setDataError("该书挑战内容即将上线，请先选择已上架图书。")
      return
    }
    if (directChallengeUsedCount >= DIRECT_CHALLENGE_DAILY_LIMIT) {
      setDataError(`今日直接挑战次数已达上限（${DIRECT_CHALLENGE_DAILY_LIMIT}次），可先选择继续阅读。`)
      return
    }
    setDataError(null)
    setShowRegionShelf(false)
    await openStoryChallenge({
      chapterId: challengeChapterId,
      sourceBookTitle: bookTitle,
      sourceChapterLabel: "第1章",
      bookId,
      mode: "direct",
    })
  }

  const handleCompleteChallenge = async () => {
    if (!selectedChallengeBookId) return
    try {
      setIsCompletingChallenge(true)
      setDataError(null)
      const response = await fetch("/api/reading/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: selectedChallengeBookId,
          entryMode: storyEntryMode,
          regionId: resolveRegionIdByBookId(selectedChallengeBookId) ?? regionId,
          challengeChapterId: storyChapterId,
          experienceGain: CHALLENGE_REWARD_POLICY[storyEntryMode].experienceGain,
          petExpGain: CHALLENGE_REWARD_POLICY[storyEntryMode].petExpGain,
          readingProgress: 100,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? "挑战奖励发放失败")
      const serverUsed = Number(payload?.data?.directChallenge?.used ?? NaN)
      if (Number.isFinite(serverUsed)) {
        setDirectChallengeUsedCount(Math.max(0, serverUsed))
      } else {
        await refreshDirectChallengeUsage()
      }
      const serverProgress = payload?.data?.adventureProgress as Partial<AdventureProgressData> | undefined
      if (serverProgress?.regionProgress) {
        setAdventureProgress({
          totalStars: Number.isFinite(serverProgress.totalStars) ? Number(serverProgress.totalStars) : 0,
          worldProgress: Number.isFinite(serverProgress.worldProgress) ? Number(serverProgress.worldProgress) : 0,
          regionProgress: serverProgress.regionProgress as AdventureProgressData["regionProgress"],
        })
      } else {
        await refreshAdventureProgress()
      }
      void refreshBossStatus()
      setLastRewardText(
        `挑战完成：+${CHALLENGE_REWARD_POLICY[storyEntryMode].stars} 星星，+${CHALLENGE_REWARD_POLICY[storyEntryMode].experienceGain} 经验`,
      )
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "挑战奖励发放失败")
    } finally {
      setIsCompletingChallenge(false)
    }
  }

  if (!isValidRegion || !bossConfig) {
    return null
  }

  return (
    <PlayerPageShell className="relative bg-gradient-to-b from-indigo-100/80 via-sky-50 to-emerald-50/50">
      <AdventureRegionHeader
        regionName={activeRegionName}
        regionStars={activeRegionStars}
        completedStages={activeRegionProgress?.completedStages ?? 0}
        totalStages={activeRegionProgress?.totalStages ?? 12}
      />

      <main className="relative z-10 pt-2">
        <section>
          <AdventurePath
            regionName={activeRegionName}
            totalStages={activeRegionProgress?.totalStages ?? 12}
            completedStages={activeRegionProgress?.completedStages ?? 0}
            regionStars={activeRegionStars}
            bossSnapshot={bossSnapshot}
            onStageSelect={handleStageSelect}
            onBossChallenge={handleBossChallenge}
          />
        </section>

        <section className="mt-4">
          <RegionBossPanel
            boss={bossConfig}
            bossSnapshot={bossSnapshot}
            isBossLoading={isBossLoading || isProgressLoading}
            onChallenge={handleBossChallenge}
          />
        </section>
      </main>

      <BottomNavigation activeItem="adventure" onNavigate={handleNavigation} />

      {showRegionShelf && (
        <div className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm">
          <div className={`absolute bottom-0 left-0 right-0 mx-auto w-full ${PLAYER_SHELL_MAX_CLASS} rounded-t-3xl border bg-background p-4 shadow-2xl`}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">区域书单</p>
                <h3 className="text-sm font-semibold">{activeRegionName}</h3>
              </div>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                onClick={() => setShowRegionShelf(false)}
              >
                关闭
              </button>
            </div>

            <p className="mb-3 text-xs text-muted-foreground">
              区域按主题闯关，与年级无关；书名旁标注为教育部目录推荐学段。未上架图书显示「即将上架」。
            </p>
            <p className="mb-3 text-xs text-amber-700">
              今日直接挑战：{directChallengeUsedCount}/{DIRECT_CHALLENGE_DAILY_LIMIT} 次
              {isUsageLoading ? "（同步中）" : ""}
            </p>
            <p className="mb-3 text-xs text-emerald-700">当前区域星星：{activeRegionStars}</p>

            <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
              {regionBooks.map((entry) => (
                <div key={`${regionId}-${entry.moeId}`} className="rounded-2xl border p-3">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-snug">
                      {entry.cover} {entry.title}
                    </p>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {entry.gradeBand ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          推荐 {GRADE_BAND_LABEL[entry.gradeBand]}
                        </span>
                      ) : null}
                      {!entry.contentAvailable ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          即将上架
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p className="mb-2 line-clamp-1 text-[11px] text-muted-foreground">{entry.author}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      disabled={!entry.contentAvailable}
                      onClick={() => handleContinueReading(entry.bookId, entry.contentAvailable)}
                    >
                      继续阅读
                    </Button>
                    <Button
                      disabled={
                        !entry.contentAvailable ||
                        directChallengeUsedCount >= DIRECT_CHALLENGE_DAILY_LIMIT
                      }
                      onClick={() =>
                        handleDirectChallenge(
                          entry.bookId,
                          entry.challengeChapterId,
                          entry.title,
                          entry.contentAvailable,
                        )
                      }
                    >
                      直接挑战
                    </Button>
                  </div>
                </div>
              ))}
              {regionBooks.length === 0 && (
                <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                  当前区域暂无可用书籍。
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <StoryAdventurePanel
        open={isStoryOpen}
        chapter={storyChapter}
        loading={isStoryLoading}
        error={storyError}
        sourceBookTitle={storySourceBookTitle}
        sourceChapterLabel={storySourceChapterLabel}
        entryMode={storyEntryMode}
        onClose={() => setIsStoryOpen(false)}
        onCompleteChapter={handleCompleteChallenge}
        onChooseNext={loadStoryById}
      />

      {mobileToast && (
        <div className="fixed bottom-24 left-1/2 z-[70] w-[88%] max-w-sm -translate-x-1/2 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
          <div
            className={[
              "flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-medium shadow-xl backdrop-blur-md",
              mobileToast.tone === "error" ? "bg-red-500/90 text-white" : "",
              mobileToast.tone === "warning" ? "bg-amber-500/90 text-white" : "",
              mobileToast.tone === "success" ? "bg-emerald-500/90 text-white" : "",
              mobileToast.tone === "info" ? "bg-slate-800/90 text-white" : "",
            ].join(" ")}
          >
            {mobileToast.tone === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {mobileToast.tone === "warning" && <AlertTriangle className="h-4 w-4 shrink-0" />}
            {mobileToast.tone === "error" && <XCircle className="h-4 w-4 shrink-0" />}
            {mobileToast.tone === "info" && <Info className="h-4 w-4 shrink-0" />}
            <span className="flex-1 text-center">{mobileToast.text}</span>
          </div>
        </div>
      )}
    </PlayerPageShell>
  )
}

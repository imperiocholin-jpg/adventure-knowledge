"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { UserHeader } from "@/components/game/user-header"
import { AdventureBanner } from "@/components/game/adventure-banner"
import { PetCompanionCard } from "@/components/game/pet-companion-card"
import { PetDeathDialog } from "@/components/pets/pet-death-dialog"
import { DailyMissions } from "@/components/game/daily-missions"
import { ReadingLibrary } from "@/components/game/reading-library"
import { PKChallenge } from "@/components/game/pk-challenge"
import { BottomNavigation } from "@/components/game/bottom-navigation"
import { PlayerPageShell } from "@/components/layout/player-page-shell"
import { StoryAdventurePanel } from "@/components/game/story-adventure-panel"
import { loadChapter } from "@/lib/story/load-chapter"
import { bookReadPath } from "@/lib/library/book-id-route"
import { inferPetProfileCompleted } from "@/lib/auth/onboarding"
import { mergePetProfile, parsePetRecord, readLocalPetProfilePatch } from "@/lib/pets/pet-profile"
import {
  getHomePetMood,
  getPetLevelProgressPercent,
  parsePetVitalsFromRecord,
} from "@/lib/pets/state"
import { useUserProfile } from "@/hooks/use-user-profile"
import { resolveAdventureLevelFromRow } from "@/lib/user/user-profile"
import { readCachedPetProfile, writeCachedPetProfile } from "@/lib/profile/session-cache"
import {
  deriveHomeAdventureBanner,
  fetchAdventureDashboard,
  fetchAdventureProgress,
  resolveAdventurerTitleLabel,
  type AdventureProgressSnapshot,
  type AdventureUserSnapshot,
} from "@/lib/adventure/adventure-dashboard-client"
import type { StoryChapter } from "@/lib/story/types"

type NavItem = "home" | "library" | "adventure" | "pets" | "profile"

type GenericRow = Record<string, unknown>
const LAST_READ_STORAGE_KEY = "ak_last_read_context"

interface LastReadContext {
  bookId: string
  sourceBookTitle: string
  sourceChapterLabel: string
}

interface ReadingLibraryBook {
  id: string
  title: string
  cover: string
  progress?: number
  isCurrentlyReading?: boolean
  rarity?: "common" | "rare" | "epic"
  completed?: boolean
}

interface DailyMissionItem {
  id: string
  title: string
  description: string
  icon: "book" | "question" | "challenge" | "pet"
  xpReward: number
  coinReward: number
  petReward?: number
  progress: number
  maxProgress: number
  completed: boolean
  status: "incomplete" | "claimable" | "claimed"
}

interface ApiListResponse<T> {
  ok?: boolean
  data?: T[]
  error?: {
    message?: string
  }
}

const DEFAULT_USER = {
  username: "小冒险家",
  level: 12,
  coins: 2680,
  energy: 45,
  maxEnergy: 60,
  dailyStreak: 0,
  adventureLevel: 1,
  worldProgress: 42,
}

const DEFAULT_PET = {
  id: "",
  name: "毛毛",
  level: 12,
  mood: "happy" as "happy" | "neutral" | "hungry",
  emoji: "🐕",
  happiness: 85,
  energy: 70,
  rarity: "epic" as "common" | "rare" | "epic" | "legendary",
}

const DEFAULT_CURRENT_BOOK: ReadingLibraryBook = {
  id: "1",
  title: "小王子",
  cover: "📗",
  progress: 45,
  isCurrentlyReading: true,
  rarity: "rare",
}

function getNumberValue(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function getStringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback
}

function resolveField(row: GenericRow, candidates: string[]) {
  return candidates.find((field) => field in row)
}

function parseApiErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback
  const maybeMessage = (payload as { error?: { message?: unknown } }).error?.message
  return typeof maybeMessage === "string" && maybeMessage ? maybeMessage : fallback
}

function normalizeTaskStatus(rawStatus: unknown, progress: number, maxProgress: number, claimed: boolean) {
  if (claimed) return "claimed" as const
  if (typeof rawStatus === "string") {
    const lower = rawStatus.toLowerCase()
    if (["claimed", "done"].includes(lower)) return "claimed" as const
    if (["claimable", "completed", "ready_to_claim"].includes(lower)) return "claimable" as const
    if (["incomplete", "pending", "todo", "not_started"].includes(lower)) return "incomplete" as const
  }
  return progress >= maxProgress ? ("claimable" as const) : ("incomplete" as const)
}

function mapTaskIcon(row: GenericRow): "book" | "question" | "challenge" | "pet" {
  const text = [
    row[resolveField(row, ["task_type", "type", "category"]) ?? ""],
    row[resolveField(row, ["title", "name"]) ?? ""],
    row[resolveField(row, ["description", "task_description"]) ?? ""],
  ]
    .map((item) => (typeof item === "string" ? item.toLowerCase() : ""))
    .join(" ")

  if (["read", "book", "reading", "阅读", "章节"].some((key) => text.includes(key))) return "book"
  if (["question", "quiz", "答题", "问答"].some((key) => text.includes(key))) return "question"
  if (["battle", "pk", "challenge", "挑战"].some((key) => text.includes(key))) return "challenge"
  return "pet"
}

export default function HomePage() {
  const [activeNav, setActiveNav] = useState<NavItem>("home")
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isSubmittingReading, setIsSubmittingReading] = useState(false)
  const [isClaimingTask, setIsClaimingTask] = useState(false)
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [adventureProgressSnapshot, setAdventureProgressSnapshot] =
    useState<AdventureProgressSnapshot | null>(null)
  const [adventureUserSnapshot, setAdventureUserSnapshot] = useState<AdventureUserSnapshot | null>(null)
  const [dataError, setDataError] = useState<string | null>(null)
  const [userRows, setUserRows] = useState<GenericRow[]>([])
  const [petRows, setPetRows] = useState<GenericRow[]>([])
  const [bookRows, setBookRows] = useState<GenericRow[]>([])
  const [taskRows, setTaskRows] = useState<GenericRow[]>([])
  const [isStoryOpen, setIsStoryOpen] = useState(false)
  const [storyChapterId, setStoryChapterId] = useState("chapter_1")
  const [storyChapter, setStoryChapter] = useState<StoryChapter | null>(null)
  const [isStoryLoading, setIsStoryLoading] = useState(false)
  const [storyError, setStoryError] = useState<string | null>(null)
  const [storySourceBookTitle, setStorySourceBookTitle] = useState("")
  const [storySourceChapterLabel, setStorySourceChapterLabel] = useState("")
  const router = useRouter()
  const { profile: userProfile, isDisplayReady: isUserDisplayReady } = useUserProfile()
  const cachedPetProfile = useMemo(() => readCachedPetProfile(), [])

  const fetchApiData = async <T,>(url: string) => {
    const response = await fetch(url, { cache: "no-store" })
    const payload = (await response.json()) as ApiListResponse<T>
    if (!response.ok) {
      if (response.status === 401) {
        router.push("/auth")
      }
      throw new Error(parseApiErrorMessage(payload, `Request failed: ${url} (${response.status})`))
    }
    return Array.isArray(payload?.data) ? payload.data : []
  }

  const checkSession = async () => {
    const response = await fetch("/api/auth/session", { cache: "no-store" })
    const payload = await response.json()
    if (!response.ok) {
      router.push("/auth")
      throw new Error(parseApiErrorMessage(payload, "用户未登录"))
    }
  }

  const loadDashboardData = async (isMountedGuard = true) => {
    if (isMountedGuard) {
      setIsLoadingData(true)
      setDataError(null)
    }

    try {
      const [books, pets, users, tasks, adventureDashboard] = await Promise.all([
        fetchApiData<GenericRow>("/api/books"),
        fetchApiData<GenericRow>("/api/pets"),
        fetchApiData<GenericRow>("/api/users"),
        fetchApiData<GenericRow>("/api/tasks"),
        fetchAdventureDashboard(),
      ])
      if (isMountedGuard && adventureDashboard) {
        if (adventureDashboard.progress) {
          setAdventureProgressSnapshot(adventureDashboard.progress)
        }
        if (adventureDashboard.user) {
          setAdventureUserSnapshot(adventureDashboard.user)
        }
      }
      if (isMountedGuard) {
        setBookRows(books)
        setPetRows(pets)
        setUserRows(users)
        setTaskRows(tasks)
      }
      return { books, pets, users, tasks }
    } catch (error) {
      if (isMountedGuard) {
        setDataError(error instanceof Error ? error.message : "数据加载失败，已显示默认页面")
      }
      return null
    } finally {
      if (isMountedGuard) {
        setIsLoadingData(false)
      }
    }
  }

  useEffect(() => {
    let isMounted = true

    ;(async () => {
      try {
        await checkSession()
        void fetch("/api/pets/daily-decay", { method: "POST" }).catch(() => {})
        void fetch("/api/users/daily-activity", { method: "POST" }).catch(() => {})
        await loadDashboardData(isMounted)
      } catch (error) {
        if (isMounted) {
          setDataError(error instanceof Error ? error.message : "用户鉴权失败")
        }
      } finally {
        if (isMounted) {
          setIsAuthChecking(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  const currentUserRow = userRows[0] ?? {}
  const currentPetRow = petRows[0] ?? {}
  const userIdField = resolveField(currentUserRow, ["id", "user_id"])
  const petIdField = resolveField(currentPetRow, ["id", "pet_id"])

  const currentUser = {
    id: userIdField ? getStringValue(currentUserRow[userIdField], "") : "",
    username: isUserDisplayReady
      ? userProfile.username ||
        getStringValue(
          currentUserRow[resolveField(currentUserRow, ["username", "name", "nickname"]) ?? ""],
          "",
        )
      : "",
    avatarSrc: userProfile.avatarSrc,
    level: getNumberValue(
      currentUserRow[resolveField(currentUserRow, ["level", "user_level"]) ?? ""],
      DEFAULT_USER.level,
    ),
    coins: getNumberValue(
      currentUserRow[resolveField(currentUserRow, ["coins", "gold", "coin_balance"]) ?? ""],
      DEFAULT_USER.coins,
    ),
    energy: getNumberValue(
      currentUserRow[resolveField(currentUserRow, ["energy", "current_energy"]) ?? ""],
      DEFAULT_USER.energy,
    ),
    maxEnergy: getNumberValue(
      currentUserRow[resolveField(currentUserRow, ["max_energy", "energy_cap"]) ?? ""],
      DEFAULT_USER.maxEnergy,
    ),
    dailyStreak: getNumberValue(
      currentUserRow[resolveField(currentUserRow, ["daily_streak", "streak", "reading_streak"]) ?? ""],
      DEFAULT_USER.dailyStreak,
    ),
    adventureLevel: resolveAdventureLevelFromRow(userRows.length ? currentUserRow : null),
    worldProgress: getNumberValue(
      currentUserRow[resolveField(currentUserRow, ["world_progress", "exploration_percent"]) ?? ""],
      DEFAULT_USER.worldProgress,
    ),
  }

  const petProfile = useMemo(() => {
    const serverComplete = inferPetProfileCompleted(currentPetRow)
    const localPatch = serverComplete ? null : readLocalPetProfilePatch()
    const parsed = parsePetRecord(currentPetRow)
    if (!petRows.length && cachedPetProfile) return cachedPetProfile
    return mergePetProfile(parsed, localPatch, currentPetRow)
  }, [currentPetRow, petRows.length, cachedPetProfile])

  const isPetDisplayReady = (!isLoadingData && petRows.length > 0) || Boolean(cachedPetProfile)

  useEffect(() => {
    if (isPetDisplayReady && petProfile.name) {
      writeCachedPetProfile(petProfile)
    }
  }, [isPetDisplayReady, petProfile])

  const petVitals = useMemo(() => parsePetVitalsFromRecord(currentPetRow), [currentPetRow])
  const petHomeMood = useMemo(() => getHomePetMood(petVitals), [petVitals])
  const petLevelProgress = useMemo(() => getPetLevelProgressPercent(currentPetRow), [currentPetRow])
  const companionDays = useMemo(() => {
    const createdField = resolveField(currentPetRow, ["created_at", "pet_created_at"])
    const createdRaw = createdField ? currentPetRow[createdField] : null
    if (typeof createdRaw === "string") {
      const createdAt = new Date(createdRaw)
      if (!Number.isNaN(createdAt.getTime())) {
        return Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / 86_400_000))
      }
    }
    return 28
  }, [currentPetRow])

  const currentPet = {
    id: petIdField ? getStringValue(currentPetRow[petIdField], "") : "",
    name: getStringValue(
      currentPetRow[resolveField(currentPetRow, ["name", "pet_name"]) ?? ""],
      DEFAULT_PET.name,
    ),
    level: getNumberValue(
      currentPetRow[resolveField(currentPetRow, ["pet_level", "level"]) ?? ""],
      DEFAULT_PET.level,
    ),
    mood: getStringValue(
      currentPetRow[resolveField(currentPetRow, ["mood", "pet_mood"]) ?? ""],
      DEFAULT_PET.mood,
    ) as "happy" | "neutral" | "hungry",
    emoji: getStringValue(
      currentPetRow[resolveField(currentPetRow, ["emoji", "pet_emoji"]) ?? ""],
      DEFAULT_PET.emoji,
    ),
    happiness: getNumberValue(
      currentPetRow[resolveField(currentPetRow, ["happiness", "affection_level", "mood_score"]) ?? ""],
      DEFAULT_PET.happiness,
    ),
    energy: getNumberValue(
      currentPetRow[resolveField(currentPetRow, ["energy", "pet_energy"]) ?? ""],
      DEFAULT_PET.energy,
    ),
    rarity: getStringValue(
      currentPetRow[resolveField(currentPetRow, ["rarity", "pet_rarity"]) ?? ""],
      DEFAULT_PET.rarity,
    ) as "common" | "rare" | "epic" | "legendary",
  }

  const mappedBooks: ReadingLibraryBook[] = bookRows.map((row, index) => {
    const idField = resolveField(row, ["id", "book_id"])
    return {
      id: getStringValue(idField ? row[idField] : "", String(index + 1)),
      title: getStringValue(row[resolveField(row, ["title", "name", "book_title"]) ?? ""], "未命名书籍"),
      cover: getStringValue(row[resolveField(row, ["cover", "emoji", "icon"]) ?? ""], "📘"),
      progress: Math.min(
        100,
        Math.max(0, getNumberValue(row[resolveField(row, ["progress", "reading_progress"]) ?? ""], 0)),
      ),
      rarity: (getStringValue(
        row[resolveField(row, ["rarity"]) ?? ""],
        "common",
      ) || "common") as "common" | "rare" | "epic",
      completed: Boolean(row[resolveField(row, ["completed", "is_completed"]) ?? ""]),
      isCurrentlyReading: Boolean(row[resolveField(row, ["is_currently_reading", "current"]) ?? ""]),
    }
  })

  const currentBook =
    mappedBooks.find((book) => book.isCurrentlyReading) ??
    mappedBooks.find((book) => (book.progress ?? 0) > 0 && (book.progress ?? 0) < 100) ??
    mappedBooks[0] ??
    DEFAULT_CURRENT_BOOK

  const homeAdventureBanner = useMemo(
    () =>
      deriveHomeAdventureBanner(adventureProgressSnapshot, {
        currentBookTitle: currentBook.title,
        readingProgressPercent: currentBook.progress,
      }),
    [adventureProgressSnapshot, currentBook.title, currentBook.progress],
  )

  const adventureTitleLabel = useMemo(() => {
    const level =
      adventureUserSnapshot?.adventureLevel ??
      currentUser.adventureLevel ??
      1
    return resolveAdventurerTitleLabel(level)
  }, [adventureUserSnapshot?.adventureLevel, currentUser.adventureLevel])

  const recommendedBooks =
    mappedBooks
      .filter((book) => book.id !== currentBook.id)
      .slice(0, 4)
      .map((book) => ({ ...book, completed: (book.progress ?? 0) >= 100 })) ?? []

  const missions: DailyMissionItem[] = taskRows.map((row, index) => {
    const idField = resolveField(row, ["id", "task_id"])
    const progress = Math.max(
      0,
      getNumberValue(row[resolveField(row, ["progress", "current_progress", "completed_count"]) ?? ""], 0),
    )
    const maxProgress = Math.max(
      1,
      getNumberValue(row[resolveField(row, ["max_progress", "target", "target_count"]) ?? ""], 1),
    )
    const claimed = Boolean(row[resolveField(row, ["claimed", "is_claimed"]) ?? ""])
    const status = normalizeTaskStatus(
      row[resolveField(row, ["status", "state"]) ?? ""],
      progress,
      maxProgress,
      claimed,
    )
    return {
      id: getStringValue(idField ? row[idField] : "", String(index + 1)),
      title: getStringValue(row[resolveField(row, ["title", "name"]) ?? ""], `任务 ${index + 1}`),
      description: getStringValue(row[resolveField(row, ["description", "task_description"]) ?? ""], "完成任务"),
      icon: mapTaskIcon(row),
      xpReward: getNumberValue(
        row[resolveField(row, ["xp_reward", "experience_reward", "reward_exp"]) ?? ""],
        0,
      ),
      coinReward: getNumberValue(
        row[resolveField(row, ["coin_reward", "coins_reward", "gold_reward"]) ?? ""],
        0,
      ),
      petReward: getNumberValue(
        row[resolveField(row, ["pet_reward", "pet_exp_reward", "reward_pet_exp"]) ?? ""],
        0,
      ),
      progress,
      maxProgress,
      completed: status !== "incomplete",
      status,
    }
  })

  const handleCompleteReading = async () => {
    try {
      setIsSubmittingReading(true)
      setDataError(null)

      const response = await fetch("/api/reading/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petId: currentPet.id || undefined,
          bookId: currentBook.id || undefined,
          experienceGain: 20,
          petExpGain: 12,
          readingProgress: 100,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(parseApiErrorMessage(payload, "阅读记录写入失败"))
      }

      await loadDashboardData(true)
      const dashboard = await fetchAdventureDashboard()
      if (dashboard.progress) setAdventureProgressSnapshot(dashboard.progress)
      if (dashboard.user) setAdventureUserSnapshot(dashboard.user)
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "阅读记录写入失败")
    } finally {
      setIsSubmittingReading(false)
    }
  }

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

  const openStoryChallengeFromRead = async () => {
    const context = readLastReadContext()
    if (!context) {
      setDataError("请先在书架完成一个章节阅读，再解锁读后冒险挑战。")
      return
    }
    setStorySourceBookTitle(context.sourceBookTitle)
    setStorySourceChapterLabel(context.sourceChapterLabel)
    setIsStoryOpen(true)
    await loadStoryById(storyChapterId)
  }

  const handleStartReading = () => {
    router.push(bookReadPath(currentBook.id || "1"))
  }

  const handleContinueAdventure = () => {
    const regionId = homeAdventureBanner.activeRegionId
    router.push(regionId ? `/adventure/${regionId}` : "/adventure")
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const url = new URL(window.location.href)
    if (url.searchParams.get("openAdventure") !== "1") return
    void openStoryChallengeFromRead()
    url.searchParams.delete("openAdventure")
    const next = `${url.pathname}${url.search}`
    window.history.replaceState({}, "", next)
  }, [])

  const handleChooseNextChapter = async (nextChapterId: string) => {
    await loadStoryById(nextChapterId)
  }

  const handleClaimReward = async (missionId: string) => {
    try {
      setIsClaimingTask(true)
      setDataError(null)

      const response = await fetch("/api/tasks/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId,
          petId: currentPet.id || undefined,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(parseApiErrorMessage(payload, "任务奖励领取失败"))
      }

      await loadDashboardData(true)
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "任务奖励领取失败")
    } finally {
      setIsClaimingTask(false)
    }
  }

  const handleNavigation = (item: NavItem) => {
    setActiveNav(item)
    if (item === "adventure") {
      router.push("/adventure")
    }
    if (item === "library") {
      router.push("/library")
    }
    if (item === "pets") {
      router.push("/pets")
    }
    if (item === "profile") {
      router.push("/profile")
    }
  }

  return (
    <PlayerPageShell bottomPad="nav-md" withGutter className="relative overflow-hidden bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-ambient-float"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              backgroundColor: i % 3 === 0 
                ? 'rgba(34, 197, 94, 0.15)' 
                : i % 3 === 1 
                ? 'rgba(251, 191, 36, 0.12)' 
                : 'rgba(168, 85, 247, 0.1)',
              left: `${5 + (i * 6)}%`,
              top: `${10 + (i % 5) * 18}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${8 + (i % 4) * 2}s`,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 py-4">
        {process.env.NODE_ENV === "development" && isAuthChecking && (
          <p className="text-xs text-muted-foreground">正在验证登录状态...</p>
        )}
        {isLoadingData && <p className="text-xs text-muted-foreground">Loading data...</p>}
        {isSubmittingReading && (
          <p className="text-xs text-muted-foreground">正在同步阅读记录...</p>
        )}
        {isClaimingTask && <p className="text-xs text-muted-foreground">正在领取任务奖励...</p>}
        {dataError && <p className="text-xs text-amber-600">{dataError}</p>}

        {/* User Header with progression */}
        <UserHeader
          username={currentUser.username}
          isUsernameLoading={!isUserDisplayReady}
          adventureLevel={
            adventureUserSnapshot?.adventureLevel ?? currentUser.adventureLevel ?? 1
          }
          coins={currentUser.coins}
          avatarUrl={currentUser.avatarSrc}
          dailyStreak={currentUser.dailyStreak}
          adventureTitle={adventureTitleLabel}
          worldProgress={adventureProgressSnapshot?.worldProgress}
        />

        {/* Adventure Banner - world exploration portal */}
        <div className="mt-4">
          <AdventureBanner
            currentChapter={homeAdventureBanner.currentChapter}
            currentWorld={homeAdventureBanner.currentWorld}
            progress={homeAdventureBanner.regionProgressPercent}
            worldProgressPercent={homeAdventureBanner.worldProgressPercent}
            discoveredRegions={homeAdventureBanner.discoveredRegions}
            totalRegions={homeAdventureBanner.totalRegions}
            onStartAdventure={handleContinueAdventure}
          />
        </div>

        {/* Content grid */}
        <div className="mt-4 grid gap-4">
          {/* Pet Companion Card - emotional companion */}
          <PetCompanionCard
            petName={isPetDisplayReady ? petProfile.name : undefined}
            isPetNameLoading={!isPetDisplayReady}
            petLevel={petProfile.level}
            petMood={petHomeMood}
            isDead={petVitals.isDead}
            petEmoji={petProfile.emoji || currentPet.emoji}
            petAvatarSrc={petProfile.avatarSrc}
            satiety={petVitals.satiety}
            bond={petVitals.bond}
            spirit={petVitals.spirit}
            levelProgress={petLevelProgress}
            companionDays={companionDays}
            onClick={() => router.push("/pets")}
          />

          {/* Daily Missions - achievement system */}
          <DailyMissions 
            missions={missions}
            onClaimReward={handleClaimReward}
          />

          {/* Reading Library - collectible archive */}
          <ReadingLibrary
            currentBook={currentBook}
            recommendedBooks={recommendedBooks}
            onContinueReading={handleStartReading}
            onViewLibrary={() => router.push("/library")}
          />

          {/* PK Challenge - competitive element */}
          <PKChallenge
            remainingChallenges={3}
            maxChallenges={5}
            currentRank={15}
            winStreak={3}
            onChallenge={() => router.push("/battle")}
            onViewRanking={() => router.push("/leaderboard")}
          />
        </div>
      </div>

      {/* Bottom Navigation - floating game style */}
      <BottomNavigation
        activeItem={activeNav}
        onNavigate={handleNavigation}
      />

      <StoryAdventurePanel
        open={isStoryOpen}
        chapter={storyChapter}
        loading={isStoryLoading}
        error={storyError}
        sourceBookTitle={storySourceBookTitle}
        sourceChapterLabel={storySourceChapterLabel}
        onClose={() => setIsStoryOpen(false)}
        onCompleteChapter={handleCompleteReading}
        onChooseNext={handleChooseNextChapter}
      />
      
      {/* Global animation styles */}
      <style jsx global>{`
        @keyframes ambient-float {
          0% { 
            transform: translateY(0) translateX(0) scale(1); 
            opacity: 0.1; 
          }
          25% { 
            transform: translateY(-30px) translateX(10px) scale(1.2); 
            opacity: 0.3; 
          }
          50% { 
            transform: translateY(-60px) translateX(-5px) scale(1); 
            opacity: 0.2; 
          }
          75% { 
            transform: translateY(-90px) translateX(15px) scale(1.1); 
            opacity: 0.15; 
          }
          100% { 
            transform: translateY(-120px) translateX(0) scale(0.8); 
            opacity: 0; 
          }
        }
        .animate-ambient-float {
          animation: ambient-float linear infinite;
        }
      `}</style>

      <PetDeathDialog
        open={!isLoadingData && petVitals.isDead}
        petName={petProfile.name || currentPet.name}
        species={petProfile.species}
      />
    </PlayerPageShell>
  )
}

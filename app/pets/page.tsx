"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  ChevronLeft, Bell, Settings, Heart, LogOut, CheckCircle2,
  BookOpen, Crown, Swords, Trophy, ChevronRight, Coins, Package
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PetShowcase } from "@/components/pets/pet-showcase"
import { PetEquipment } from "@/components/pets/pet-equipment"
import { PetCollection } from "@/components/pets/pet-collection"
import { BottomNavigation } from "@/components/game/bottom-navigation"
import { PlayerPageShell, PlayerStickyHeader } from "@/components/layout/player-page-shell"
import { PET_SPECIES_EMOJI } from "@/lib/pets/catalog"
import { resolvePetMediaAssets, type PetImageAction } from "@/lib/pets/avatar-registry"
import { calcBattleStats } from "@/lib/battle/rules"
import { findShopItem, listItemsByCategory, PET_SHOP_ITEMS, SHOP_ACTION_REQUIREMENTS, type PetInteractAction } from "@/lib/pets/shop"
import { PetDeathDialog } from "@/components/pets/pet-death-dialog"
import { PetInventoryPickerDialog } from "@/components/pets/pet-inventory-picker-dialog"
import { levelFromTotalExp, progressInLevel } from "@/lib/pets/level-progress"
import {
  canEnterBattle,
  getHomePetMood,
  mapHomeMoodToSceneMood,
  normalizeInventory,
  normalizePetState,
  type PetInventoryMap,
  type PetVitalState,
} from "@/lib/pets/state"
import { usePetProfile } from "@/hooks/use-pet-profile"

type PetMoodState = "happy" | "cute" | "excited" | "sleepy" | "hungry" | "sad" | "listless"

type PurchaseSuccessInfo = {
  itemName: string
  itemIcon: string
  quantity: number
  totalCost: number
  remainingPoints: number
  ownedCount: number
}

export default function PetsPage() {
  const router = useRouter()
  const { profile: syncedPetProfile, refresh: refreshPetProfile } = usePetProfile()
  const actionTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([])
  const [activeTab, setActiveTab] = useState<"home" | "equipment" | "collection">("home")
  const [showReward, setShowReward] = useState<{ type: string; amount: number } | null>(null)
  const petName = syncedPetProfile.name
  const petType = syncedPetProfile.petType
  const petSpecies = syncedPetProfile.species
  const petBreed = syncedPetProfile.breed
  const [petMood, setPetMood] = useState<PetMoodState>("cute")
  const [petLevel, setPetLevel] = useState(12)
  const [petExp, setPetExp] = useState(25)
  const [shopPoints, setShopPoints] = useState(0)
  const [inventory, setInventory] = useState<PetInventoryMap>({})
  const [petVitals, setPetVitals] = useState<PetVitalState>(() => normalizePetState(null))
  const [shopHint, setShopHint] = useState<string | null>(null)
  const [purchaseSuccess, setPurchaseSuccess] = useState<PurchaseSuccessInfo | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [pickerAction, setPickerAction] = useState<PetInteractAction | null>(null)
  const [sceneAction, setSceneAction] = useState<PetImageAction>("idle")
  const [sceneActionTick, setSceneActionTick] = useState(0)
  const [sceneHoldLastFrame, setSceneHoldLastFrame] = useState(false)
  const [readingLevelHint, setReadingLevelHint] = useState<string | null>(null)
  const [lastCareActionAt, setLastCareActionAt] = useState<number>(() => Date.now())
  const [lastFunActionAt, setLastFunActionAt] = useState<number>(() => Date.now())
  const [companionDays] = useState(28)

  const flashHint = (text: string, durationMs = 2200) => {
    setShopHint(text)
    setTimeout(() => setShopHint(null), durationMs)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } finally {
      router.push("/auth")
    }
  }

  useEffect(() => {
    setPetLevel(syncedPetProfile.level)
  }, [syncedPetProfile.level])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshPetProfile()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [refreshPetProfile])

  useEffect(() => {
    ;(async () => {
      try {
        const response = await fetch("/api/pets", { cache: "no-store" })
        const payload = await response.json()
        const pet = Array.isArray(payload?.data) ? payload.data[0] : null
        if (!pet || typeof pet !== "object") return

        const resolveField = (candidates: string[]) => candidates.find((field) => field in pet)
        const expField = resolveField(["pet_exp", "exp"])
        const happinessField = resolveField(["happiness"])

        if (expField) {
          const next = Number(pet[expField])
          if (Number.isFinite(next) && next >= 0) {
            const total = Math.floor(next)
            setPetExp(total)
            setPetLevel(levelFromTotalExp(total))
          }
        }
        if (happinessField) {
          const next = Number(pet[happinessField])
          if (Number.isFinite(next)) {
            setPetVitals((prev) => normalizePetState({ ...prev, bond: Math.max(0, Math.min(100, Math.floor(next))) }))
          }
        }
      } catch {
        // keep local fallback
      }
    })()
  }, [])

  const refreshPetVitalsFromServer = async () => {
    try {
      await fetch("/api/pets/daily-decay", { method: "POST" })
    } catch {
      // 忽略每日衰减失败，继续拉取状态
    }
    try {
      const [petResponse, userResponse] = await Promise.all([
        fetch("/api/pets", { cache: "no-store" }),
        fetch("/api/users", { cache: "no-store" }),
      ])
      const petPayload = await petResponse.json()
      const userPayload = await userResponse.json()

      if (petResponse.ok && petPayload?.ok) {
        if (petPayload.summary?.state) {
          setPetVitals(normalizePetState(petPayload.summary.state))
        }
        if (typeof petPayload.summary?.petExp === "number") {
          setPetExp(Math.max(0, Math.floor(petPayload.summary.petExp)))
        }
        if (typeof petPayload.summary?.level === "number") {
          setPetLevel(Math.max(1, Math.floor(petPayload.summary.level)))
        }
        if (petPayload.summary?.inventory) {
          setInventory(normalizeInventory(petPayload.summary.inventory))
        }
      }

      if (userResponse.ok && userPayload?.ok && Array.isArray(userPayload.data) && userPayload.data[0]) {
        const row = userPayload.data[0] as Record<string, unknown>
        const pointsRaw = Number(row.points ?? row.score ?? row.coins ?? row.gold ?? row.coin_balance ?? 0)
        if (Number.isFinite(pointsRaw)) setShopPoints(Math.max(0, Math.floor(pointsRaw)))
      }
    } catch {
      // keep local fallback
    }
  }

  useEffect(() => {
    void refreshPetVitalsFromServer()
  }, [])

  useEffect(() => {
    const raw = window.localStorage.getItem("ak_pet_activity_v1")
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as Partial<{ careAt: number; funAt: number }>
      if (typeof parsed.careAt === "number" && Number.isFinite(parsed.careAt)) {
        setLastCareActionAt(parsed.careAt)
      }
      if (typeof parsed.funAt === "number" && Number.isFinite(parsed.funAt)) {
        setLastFunActionAt(parsed.funAt)
      }
    } catch {
      // ignore parse error
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(
      "ak_pet_activity_v1",
      JSON.stringify({
        careAt: lastCareActionAt,
        funAt: lastFunActionAt,
      }),
    )
  }, [lastCareActionAt, lastFunActionAt])

  useEffect(() => {
    const CARE_TIMEOUT_MS = 1000 * 60 * 20
    const FUN_TIMEOUT_MS = 1000 * 60 * 25
    const interval = window.setInterval(() => {
      const now = Date.now()
      const isCareExpired = now - lastCareActionAt > CARE_TIMEOUT_MS
      const isFunExpired = now - lastFunActionAt > FUN_TIMEOUT_MS
      if (isCareExpired) {
        setPetMood("listless")
        return
      }
      if (isFunExpired) {
        setPetMood("sad")
      }
    }, 10000)
    return () => window.clearInterval(interval)
  }, [lastCareActionAt, lastFunActionAt])

  useEffect(() => {
    return () => {
      actionTimersRef.current.forEach((timer) => clearTimeout(timer))
      actionTimersRef.current = []
    }
  }, [])

  const homePetMood = useMemo(() => getHomePetMood(petVitals), [petVitals])
  const sceneMood = useMemo(
    () => (petVitals.isDead ? "sleepy" : mapHomeMoodToSceneMood(homePetMood)) as PetMoodState,
    [petVitals.isDead, homePetMood],
  )

  useEffect(() => {
    setPetMood(sceneMood)
  }, [sceneMood])

  const petEmojiMap: Record<string, string> = {
    tusong: "🐕",
    corgi: "🐕",
    husky: "🐕",
    bulldog: "🐕",
    teddy: "🐕",
    americanShorthair: "🐱",
    lihua: "🐱",
    ragdoll: "🐱",
    parrot: "🐦",
    mapTurtle: "🐢",
    gecko: "🦎",
    hamster: "🐹",
    chinchilla: "🐹",
    dwarfRabbit: "🐰",
    longhairLop: "🐰",
    scentedPig: "🐷",
  }
  const petBattleStats = useMemo(() => calcBattleStats(petLevel, []), [petLevel])
  const shopItems = useMemo(
    () =>
      PET_SHOP_ITEMS.map((item) => ({
        ...item,
        owned: inventory[item.id] ?? 0,
      })),
    [inventory],
  )
  const lifeStage = petBattleStats.lifeStage
  const petMediaAssets = useMemo(
    () =>
      resolvePetMediaAssets({
        species: petSpecies,
        breed: petBreed,
        lifeStage,
      }),
    [petSpecies, petBreed, lifeStage],
  )
  const petAvatarSrc = petMediaAssets.images.base
  const petActionImages = petMediaAssets.images.byAction
  const petActionVideos = petMediaAssets.videos.byAction
  const expProgressPercent = progressInLevel(petExp)
  const battleGate = useMemo(() => canEnterBattle(petVitals), [petVitals])
  const categoryStock = useMemo(() => {
    const hasAny = (category: "food" | "training" | "rest" | "toy") =>
      PET_SHOP_ITEMS.some((item) => item.category === category && (inventory[item.id] ?? 0) > 0)
    return {
      food: hasAny("food"),
      training: hasAny("training"),
      rest: hasAny("rest"),
      toy: hasAny("toy"),
    }
  }, [inventory])
  const inventorySummary = useMemo(
    () =>
      PET_SHOP_ITEMS.filter((item) => (inventory[item.id] ?? 0) > 0).map((item) => ({
        id: item.id,
        icon: item.icon,
        name: item.name,
        count: inventory[item.id] ?? 0,
      })),
    [inventory],
  )
  const floatingHintText = useMemo(() => {
    if (shopHint) return shopHint
    if (!showReward) return null
    if (showReward.type === "heart") return "亲密度 +5"
    if (showReward.type === "joy") return "快乐值 +10"
    if (showReward.type === "energy") return "精力 +20"
    return "等级进度 +15"
  }, [showReward, shopHint])

  const triggerSceneAction = (action: PetImageAction) => {
    setSceneHoldLastFrame(false)
    setSceneAction(action)
    setSceneActionTick((prev) => prev + 1)
  }

  const startActionFlow = (action: "eating" | "playing" | "sleeping" | "training") => {
    const ACTION_VIDEO_MS = 4000
    const AFTER_MAIN_DELAY_MS = 1000
    const AFTER_EXCITED_DELAY_MS = 1500
    actionTimersRef.current.forEach((timer) => clearTimeout(timer))
    actionTimersRef.current = []
    setSceneHoldLastFrame(false)

    triggerSceneAction(action)
    const holdTimer = setTimeout(() => {
      setSceneHoldLastFrame(true)
    }, ACTION_VIDEO_MS)
    const excitedTimer = setTimeout(() => {
      setPetMood("excited")
      triggerSceneAction("excited")
    }, ACTION_VIDEO_MS + AFTER_MAIN_DELAY_MS)
    const calmTimer = setTimeout(() => {
      setPetMood(sceneMood)
      triggerSceneAction("idle")
    }, ACTION_VIDEO_MS + AFTER_MAIN_DELAY_MS + ACTION_VIDEO_MS + AFTER_EXCITED_DELAY_MS)

    actionTimersRef.current.push(holdTimer, excitedTimer, calmTimer)
  }

  const gainExp = (gain: number, reason: "feed" | "play" | "train" | "reading") => {
    setPetExp((prev) => {
      const next = prev + gain
      const prevLevel = levelFromTotalExp(prev)
      const nextLevel = levelFromTotalExp(next)
      if (nextLevel > prevLevel) {
        setPetLevel(nextLevel)
        setReadingLevelHint("恭喜升级！欢呼旋转表现已增强")
        actionTimersRef.current.forEach((timer) => clearTimeout(timer))
        actionTimersRef.current = []
        triggerSceneAction("levelUp")
        setShowReward({ type: "exp", amount: gain })
        if (reason === "reading") {
          setTimeout(() => setReadingLevelHint(null), 2600)
        }
      }
      return next
    })
  }

  const handleNavigation = (item: string) => {
    if (item === "home") router.push("/")
    if (item === "library") router.push("/library")
    if (item === "adventure") router.push("/adventure")
  }

  const handlePurchase = async (itemId: string) => {
    if (petVitals.isDead) {
      flashHint("宠物已离世，请重新领养。", 3500)
      return
    }
    if (isPurchasing) return
    const shopItem = findShopItem(itemId)
    setIsPurchasing(true)
    try {
      const response = await fetch("/api/pets/shop/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity: 1 }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.ok) {
        flashHint(payload?.error?.message ?? "购买失败，请稍后重试。", 3500)
        return
      }
      const nextInventory = payload.data?.inventory
        ? normalizeInventory(payload.data.inventory)
        : inventory
      const remainingPoints =
        typeof payload.data?.points === "number"
          ? Math.max(0, Math.floor(payload.data.points))
          : shopPoints
      if (payload.data?.inventory) setInventory(nextInventory)
      setShopPoints(remainingPoints)

      const purchased = payload.data?.purchased as { quantity?: number; totalCost?: number } | undefined
      setPurchaseSuccess({
        itemName: shopItem?.name ?? "道具",
        itemIcon: shopItem?.icon ?? "🎁",
        quantity: purchased?.quantity ?? 1,
        totalCost: purchased?.totalCost ?? shopItem?.price ?? 0,
        remainingPoints,
        ownedCount: nextInventory[itemId] ?? 0,
      })
    } catch {
      flashHint("购买失败，请稍后重试。", 3500)
    } finally {
      setIsPurchasing(false)
    }
  }

  const runInteract = async (action: PetInteractAction, itemId: string) => {
    if (petVitals.isDead) {
      flashHint("宠物已离世，请重新领养。")
      return false
    }
    try {
      const prevState = petVitals
      const response = await fetch("/api/pets/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, itemId }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.ok) {
        flashHint(payload?.error?.message ?? "互动失败，请稍后重试。")
        return false
      }
      if (payload.data?.inventory) setInventory(normalizeInventory(payload.data.inventory))
      if (payload.data?.state) {
        const nextState = normalizePetState(payload.data.state)
        setPetVitals(nextState)
        const satietyGain = Math.max(0, nextState.satiety - prevState.satiety)
        const spiritGain = Math.max(0, nextState.spirit - prevState.spirit)
        const bondGain = Math.max(0, nextState.bond - prevState.bond)
        const gainSegments = [
          satietyGain > 0 ? `饱食度+${satietyGain}` : null,
          spiritGain > 0 ? `精神+${spiritGain}` : null,
          bondGain > 0 ? `亲密+${bondGain}` : null,
        ].filter(Boolean)
        if (gainSegments.length > 0) {
          flashHint(gainSegments.join(" · "))
        } else if (payload.data?.hint) {
          flashHint(String(payload.data.hint))
        }
      } else if (payload.data?.hint) {
        flashHint(String(payload.data.hint))
      }
      return true
    } catch {
      flashHint("互动失败，请稍后重试。")
      return false
    }
  }

  const LAST_ITEM_KEY = "ak_pet_last_item_v1"

  const rememberItem = (action: PetInteractAction, itemId: string) => {
    try {
      const raw = window.localStorage.getItem(LAST_ITEM_KEY)
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {}
      map[action] = itemId
      window.localStorage.setItem(LAST_ITEM_KEY, JSON.stringify(map))
    } catch {
      // ignore
    }
  }

  const beginInteract = (action: PetInteractAction) => {
    const category = SHOP_ACTION_REQUIREMENTS[action]
    const owned = listItemsByCategory(category).filter((item) => (inventory[item.id] ?? 0) > 0)
    if (owned.length === 0) {
      flashHint(
        action === "feed"
          ? "请从商店购买宠物食物"
          : action === "train"
            ? "请从商店购买训练工具"
            : action === "sleep"
              ? "请从商店购买休息道具"
              : "请从商店购买宠物玩具",
      )
      return
    }
    if (owned.length === 1) {
      void runInteract(action, owned[0].id).then((ok) => {
        if (ok) rememberItem(action, owned[0].id)
        if (ok && action === "feed") void afterFeed()
        if (ok && action === "play") void afterPlay()
        if (ok && action === "sleep") void afterSleep()
        if (ok && action === "train") void afterTrain()
      })
      return
    }
    setPickerAction(action)
  }

  const handlePickerSelect = async (itemId: string) => {
    if (!pickerAction) return
    const action = pickerAction
    setPickerAction(null)
    const ok = await runInteract(action, itemId)
    if (!ok) return
    rememberItem(action, itemId)
    if (action === "feed") await afterFeed()
    if (action === "play") await afterPlay()
    if (action === "sleep") await afterSleep()
    if (action === "train") await afterTrain()
  }

  const afterFeed = async () => {
    setShowReward({ type: "heart", amount: 5 })
    setLastCareActionAt(Date.now())
    startActionFlow("eating")
    setTimeout(() => setShowReward(null), 1500)
  }

  const afterPlay = async () => {
    setShowReward({ type: "joy", amount: 10 })
    setLastFunActionAt(Date.now())
    startActionFlow("playing")
    setTimeout(() => setShowReward(null), 1500)
  }

  const afterSleep = async () => {
    setShowReward({ type: "energy", amount: 20 })
    setLastCareActionAt(Date.now())
    startActionFlow("sleeping")
    setTimeout(() => setShowReward(null), 1500)
  }

  const afterTrain = async () => {
    setShowReward({ type: "exp", amount: 15 })
    setLastFunActionAt(Date.now())
    startActionFlow("training")
    gainExp(15, "train")
    setTimeout(() => setShowReward(null), 1500)
  }

  const handleFeed = () => beginInteract("feed")
  const handlePlay = () => beginInteract("play")
  const handleSleep = () => beginInteract("sleep")
  const handleTrain = () => beginInteract("train")

  return (
    <PlayerPageShell bottomPad="nav-lg" className="relative overflow-hidden bg-background">
      <PlayerStickyHeader className="border-b border-border/30 bg-background">
        <div className="flex items-center justify-between px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => router.push("/")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">我的伙伴</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              title="退出登录"
              aria-label="退出登录"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </PlayerStickyHeader>

      <main className="relative z-10 space-y-4 px-4 py-4">
        {/* Pet showcase - large and immersive */}
        <PetShowcase
          petEmoji={petEmojiMap[petType] ?? PET_SPECIES_EMOJI[petSpecies]}
          petName={petName || "毛毛"}
          level={petLevel}
          mood={petMood}
          petType={petType}
          petBreed={petBreed}
          lifeStage={lifeStage}
          petAvatarSrc={petAvatarSrc}
          actionImages={petActionImages}
          actionVideos={petActionVideos}
          satietyValue={petVitals.satiety}
          spiritValue={petVitals.spirit}
          bondValue={petVitals.bond}
          isDead={petVitals.isDead}
          levelProgress={expProgressPercent}
          canFeed={categoryStock.food}
          canPlay={categoryStock.toy}
          canSleep={categoryStock.rest}
          canTrain={categoryStock.training}
          companionDays={companionDays}
          sceneAction={sceneAction}
          sceneActionTick={sceneActionTick}
          sceneHoldLastFrame={sceneHoldLastFrame}
          readingLevelHint={readingLevelHint}
          floatingHintText={floatingHintText}
          onPetTap={() => {
            setPetMood(resolveCalmMood())
            triggerSceneAction("tap")
          }}
          onFeed={handleFeed}
          onPlay={handlePlay}
          onSleep={handleSleep}
          onTrain={handleTrain}
        />

        {/* Tab navigation - simplified */}
        <div className="flex gap-2 bg-muted/50 rounded-2xl p-1.5">
          {[
            { id: "home", label: "主页", icon: Heart },
            { id: "equipment", label: "商城", icon: Crown },
            { id: "collection", label: "档案", icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  activeTab === tab.id 
                    ? "bg-white text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="space-y-4">
          {activeTab === "home" && (
            <div className="space-y-4">
              {!battleGate.ok && <p className="text-xs text-rose-600">{battleGate.reason}</p>}
              <div className="rounded-2xl border border-border/50 bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">仓库</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">已购道具与数量</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("equipment")}
                      className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/15 transition-colors"
                    >
                      去商城补货
                    </button>
                  </div>
                </div>
                {inventorySummary.length === 0 ? (
                  <p className="text-xs text-muted-foreground">当前仓库为空，先去商城购买道具吧。</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {inventorySummary.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between rounded-xl bg-muted/50 px-2.5 py-2">
                        <div className="flex items-center gap-1.5">
                          <span>{entry.icon}</span>
                          <span className="text-xs text-foreground">{entry.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-emerald-700">x{entry.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pet Battle Entry - prominent CTA */}
              <button 
                onClick={() => battleGate.ok && router.push("/battle")}
                disabled={!battleGate.ok}
                className="w-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-2xl p-4 text-left shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
              >
                {/* Background decoration */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.3),transparent_60%)]" />
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Swords className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                        宠物知识大赛
                        <Trophy className="h-4 w-4 text-amber-200" />
                      </h3>
                      <p className="text-xs text-white/80">和{petName || "毛毛"}一起参加答题挑战!</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1.5">
                    <span className="text-xs font-medium text-white">{battleGate.ok ? "开始挑战" : "当前不可战斗"}</span>
                    <ChevronRight className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                {/* Stats preview */}
                <div className="relative mt-3 flex items-center gap-4 text-white/90">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">今日剩余</span>
                    <span className="text-sm font-bold">3/5</span>
                  </div>
                  <div className="h-3 w-px bg-white/30" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs">连胜</span>
                    <span className="text-sm font-bold text-amber-200">3场</span>
                  </div>
                  <div className="h-3 w-px bg-white/30" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs">排名</span>
                    <span className="text-sm font-bold">#15</span>
                  </div>
                </div>
              </button>

              {/* Today's reading progress - emotional connection to reading */}
              <div className="bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-2xl p-4 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">今日阅读</p>
                      <p className="text-xs text-muted-foreground">和{petName || "毛毛"}一起读书吧</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">3</p>
                    <p className="text-[10px] text-muted-foreground">篇文章</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-white/50 overflow-hidden">
                    <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-primary to-emerald-500" />
                  </div>
                  <span className="text-xs text-muted-foreground">3/5</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">再读2篇，{petName || "毛毛"}可以获得特别奖励!</p>
              </div>
            </div>
          )}

          {activeTab === "equipment" && (
            <PetEquipment
              points={shopPoints}
              items={shopItems}
              onPurchase={handlePurchase}
            />
          )}

          {activeTab === "collection" && (
            <PetCollection
              petName={petName || "毛毛"}
              petEmoji={petEmojiMap[petType] ?? PET_SPECIES_EMOJI[petSpecies]}
              petAvatarSrc={petAvatarSrc}
              petBreed={petBreed}
              lifeStage={lifeStage}
              level={petLevel}
              affectionLevel={petVitals.bond}
              companionDays={companionDays}
              attack={petBattleStats.attack}
              maxHealth={petBattleStats.maxHealth}
              battlePower={Math.floor(petBattleStats.attack * 1.2 + petBattleStats.maxHealth * 0.35)}
            />
          )}
        </div>
      </main>

      {/* Bottom navigation */}
      <BottomNavigation
        activeItem="pets"
        onNavigate={handleNavigation}
      />

      <Dialog
        open={purchaseSuccess !== null}
        onOpenChange={(open) => {
          if (!open) setPurchaseSuccess(null)
        }}
      >
        <DialogContent className="max-w-sm rounded-2xl border-amber-100 sm:max-w-sm">
          {purchaseSuccess && (
            <>
              <DialogHeader className="items-center space-y-3 text-center sm:text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <DialogTitle className="text-lg">购买成功</DialogTitle>
                <DialogDescription asChild>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>商品已放入背包，可在主页仓库或对应互动中使用。</p>
                    <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-left">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{purchaseSuccess.itemIcon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground">{purchaseSuccess.itemName}</p>
                          <p className="text-xs">购买数量 ×{purchaseSuccess.quantity}</p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1.5 text-xs">
                        <p className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 text-amber-700">
                            <Coins className="h-3.5 w-3.5" />
                            本次花费
                          </span>
                          <span className="font-semibold tabular-nums text-foreground">
                            -{purchaseSuccess.totalCost} 积分
                          </span>
                        </p>
                        <p className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 text-violet-700">
                            <Coins className="h-3.5 w-3.5" />
                            剩余积分
                          </span>
                          <span className="font-semibold tabular-nums text-foreground">
                            {purchaseSuccess.remainingPoints}
                          </span>
                        </p>
                        <p className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 text-emerald-700">
                            <Package className="h-3.5 w-3.5" />
                            当前库存
                          </span>
                          <span className="font-semibold tabular-nums text-foreground">
                            {purchaseSuccess.ownedCount} 个
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  className="w-full rounded-xl"
                  onClick={() => {
                    setPurchaseSuccess(null)
                    setActiveTab("home")
                  }}
                >
                  查看仓库
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() => setPurchaseSuccess(null)}
                >
                  继续购物
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PetDeathDialog
        open={petVitals.isDead}
        petName={syncedPetProfile.name || "小伙伴"}
        species={syncedPetProfile.species}
      />

      {pickerAction && (
        <PetInventoryPickerDialog
          open={Boolean(pickerAction)}
          action={pickerAction}
          items={listItemsByCategory(SHOP_ACTION_REQUIREMENTS[pickerAction])}
          inventory={inventory}
          onClose={() => setPickerAction(null)}
          onSelect={(itemId) => void handlePickerSelect(itemId)}
        />
      )}
    </PlayerPageShell>
  )
}

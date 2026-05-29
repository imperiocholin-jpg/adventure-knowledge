"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  ChevronLeft, Bell, Settings, Sparkles, Trophy, Users, 
  Swords, Star, Heart, Zap, Crown, Medal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BattleArena } from "@/components/battle/battle-arena"
import { QuestionPanel } from "@/components/battle/question-panel"
import { BattleRewards } from "@/components/battle/battle-rewards"
import { MatchModes } from "@/components/battle/match-modes"
import { BattleCostDialog } from "@/components/battle/battle-cost-dialog"
import { BattleItemPicker } from "@/components/battle/battle-item-picker"
import { BottomNavigation } from "@/components/game/bottom-navigation"
import { PlayerPageShell } from "@/components/layout/player-page-shell"
import { PetDeathDialog } from "@/components/pets/pet-death-dialog"
import { PetAvatar } from "@/components/pets/pet-avatar"
import { battleConstants, calcBattleDamage, calcBattleStats, resolveBattleRewards, type BattleEquipmentBonus } from "@/lib/battle/rules"
import {
  createBattleItemRuntime,
  getBattleItemConfig,
  listOwnedBattleItems,
  type BattleItemRuntimeState,
} from "@/lib/pets/battle-items"
import {
  PET_EQUIPMENT_STORAGE_KEY,
  getDefaultEquippedIds,
  parseEquippedIds,
  resolveBattleBonusesFromEquipment,
} from "@/lib/pets/equipment"
import { levelFromTotalExp } from "@/lib/pets/level-progress"
import {
  BATTLE_SATIETY_COST,
  BATTLE_SPIRIT_COST,
  canEnterBattle,
  normalizeInventory,
  normalizePetState,
  type PetInventoryMap,
  type PetVitalState,
} from "@/lib/pets/state"
import { buildPetProfile } from "@/lib/pets/pet-profile"
import { usePetProfile } from "@/hooks/use-pet-profile"
import { useUserProfile } from "@/hooks/use-user-profile"
import { LeaderboardPreview } from "@/components/social/leaderboard-preview"
import { resolveUserAvatarSrc } from "@/lib/user/avatar-catalog"
import { getRegionBossConfig } from "@/lib/adventure/region-boss"

type GameState = "lobby" | "matching" | "battle" | "result"
type BattlePhase = "idle" | "question" | "skill" | "result"
type BattleResult = "win" | "lose" | "draw" | null

const MATCH_MODE_TITLES: Record<string, string> = {
  friend: "好友挑战",
  random: "随机匹配",
  tournament: "赛季锦标赛",
}

// Sample questions for demo
const sampleQuestions = [
  {
    question: "《小王子》中,小王子来自哪颗星球?",
    options: ["B-612小行星", "月球", "火星", "土星"],
    correctIndex: 0,
  },
  {
    question: "《西游记》中,孙悟空的金箍棒原本是什么?",
    options: ["定海神针", "如意金箍棒", "天蓬元帅的武器", "太上老君的法宝"],
    correctIndex: 0,
  },
  {
    question: "哪位作家创作了《安徒生童话》?",
    options: ["格林兄弟", "安徒生", "伊索", "王尔德"],
    correctIndex: 1,
  },
]

export default function BattlePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bossRegionId = searchParams.get("boss")
  const bossConfig = useMemo(() => (bossRegionId ? getRegionBossConfig(bossRegionId) : null), [bossRegionId])
  const isBossBattle = Boolean(bossConfig)
  const { profile: petProfile } = usePetProfile()
  const { profile: userProfile } = useUserProfile()
  const [gameState, setGameState] = useState<GameState>("lobby")
  const [battlePhase, setBattlePhase] = useState<BattlePhase>("idle")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [playerLevel, setPlayerLevel] = useState(12)
  const [equippedEquipmentIds, setEquippedEquipmentIds] = useState<string[]>(() => getDefaultEquippedIds())
  const [petVitals, setPetVitals] = useState<PetVitalState>(() => normalizePetState(null))
  const [inventory, setInventory] = useState<PetInventoryMap>({})
  const [selectedBattleItemIds, setSelectedBattleItemIds] = useState<string[]>([])
  const [battleItemNotice, setBattleItemNotice] = useState<string | null>(null)
  const [opponentLevel, setOpponentLevel] = useState(10)
  const [opponentPetName, setOpponentPetName] = useState("咪咪")
  const [opponentPetEmoji, setOpponentPetEmoji] = useState("🐱")
  const [playerHealth, setPlayerHealth] = useState(336)
  const [opponentHealth, setOpponentHealth] = useState(300)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [turnCount, setTurnCount] = useState(1)
  const [playerComboStreak, setPlayerComboStreak] = useState(0)
  const [opponentComboStreak, setOpponentComboStreak] = useState(0)
  const [battleResult, setBattleResult] = useState<BattleResult>(null)
  const [firstWinBonusExp, setFirstWinBonusExp] = useState(0)
  const [settlementError, setSettlementError] = useState<string | null>(null)
  const [showRewards, setShowRewards] = useState(false)
  const [lastSkillUsed, setLastSkillUsed] = useState<string>()
  const [skillTarget, setSkillTarget] = useState<"player" | "opponent">()
  const [score, setScore] = useState(0)
  const [matchingProgress, setMatchingProgress] = useState(0)
  const [battleCostDialogOpen, setBattleCostDialogOpen] = useState(false)
  const [pendingModeId, setPendingModeId] = useState<string | null>(null)
  const [isEnteringBattle, setIsEnteringBattle] = useState(false)

  const playerHealthRef = useRef(playerHealth)
  const opponentHealthRef = useRef(opponentHealth)
  const turnCountRef = useRef(turnCount)
  const battleSettledRef = useRef(false)
  const battleItemsRef = useRef<BattleItemRuntimeState[]>([])
  const consumedItemIdsRef = useRef<string[]>([])
  const vitalsDeductedForBattleRef = useRef(false)
  const playerMaxHealthRef = useRef(336)

  useEffect(() => {
    playerHealthRef.current = playerHealth
  }, [playerHealth])

  useEffect(() => {
    opponentHealthRef.current = opponentHealth
  }, [opponentHealth])

  useEffect(() => {
    turnCountRef.current = turnCount
  }, [turnCount])

  const playerEquipmentBonuses = useMemo<BattleEquipmentBonus[]>(
    () => resolveBattleBonusesFromEquipment(equippedEquipmentIds),
    [equippedEquipmentIds],
  )
  const opponentEquipmentBonuses = useMemo<BattleEquipmentBonus[]>(
    () => [
      { slot: "accessory", atkPct: 0.04 },
    ],
    [],
  )
  const playerStats = useMemo(() => calcBattleStats(playerLevel, playerEquipmentBonuses), [playerLevel, playerEquipmentBonuses])
  const opponentStats = useMemo(
    () => calcBattleStats(opponentLevel, opponentEquipmentBonuses),
    [opponentLevel, opponentEquipmentBonuses],
  )
  const activeQuestion = sampleQuestions[currentQuestionIndex] ?? sampleQuestions[0]
  const battleGate = useMemo(() => canEnterBattle(petVitals), [petVitals])
  const ownedBattleItems = useMemo(() => listOwnedBattleItems(inventory), [inventory])
  const battleItemPickerOptions = useMemo(
    () =>
      ownedBattleItems.map((item) => ({
        itemId: item.itemId,
        name: item.shopItem.name,
        icon: item.shopItem.icon,
        owned: item.owned,
        triggerHint: item.triggerHint,
        battleHint: item.shopItem.battleHint,
      })),
    [ownedBattleItems],
  )

  useEffect(() => {
    playerMaxHealthRef.current = playerStats.maxHealth
  }, [playerStats.maxHealth])

  useEffect(() => {
    setSelectedBattleItemIds((prev) => prev.filter((id) => (inventory[id] ?? 0) > 0))
  }, [inventory])

  useEffect(() => {
    if (petProfile.level > 0) {
      setPlayerLevel(petProfile.level)
    }
  }, [petProfile.level])

  useEffect(() => {
    const rawEquipment = window.localStorage.getItem(PET_EQUIPMENT_STORAGE_KEY)
    const localEquipmentIds = rawEquipment
      ? (() => {
          try {
            return parseEquippedIds(JSON.parse(rawEquipment) as unknown)
          } catch {
            return getDefaultEquippedIds()
          }
        })()
      : getDefaultEquippedIds()
    setEquippedEquipmentIds(localEquipmentIds)

    ;(async () => {
      try {
        const response = await fetch("/api/pets/equipment", { cache: "no-store" })
        const payload = await response.json()
        if (!response.ok || !payload?.ok || !payload?.data) return
        const serverIds = parseEquippedIds(payload.data.equippedIds)
        setEquippedEquipmentIds(serverIds)
      } catch {
        // keep local fallback
      }
    })()

    ;(async () => {
      try {
        await fetch("/api/pets/daily-decay", { method: "POST" })
      } catch {
        // 忽略每日衰减失败
      }
      try {
        const response = await fetch("/api/pets", { cache: "no-store" })
        const payload = await response.json()
        const pet = Array.isArray(payload?.data) ? payload.data[0] : null
        if (!pet || typeof pet !== "object") return
        if (payload?.summary?.state) {
          setPetVitals(normalizePetState(payload.summary.state))
        }
        if (typeof payload.summary?.level === "number") {
          setPlayerLevel(Math.max(1, Math.floor(payload.summary.level)))
        } else if (typeof payload.summary?.petExp === "number") {
          setPlayerLevel(levelFromTotalExp(payload.summary.petExp))
        }
        if (payload?.summary?.inventory) {
          setInventory(normalizeInventory(payload.summary.inventory))
        }
      } catch {
        // keep fallback values
      }
    })()
  }, [])

  // Player and opponent data
  const opponentPetProfile = useMemo(
    () => buildPetProfile({ species: "cat", breed: "狸花", level: opponentLevel, name: opponentPetName, emoji: opponentPetEmoji }),
    [opponentLevel, opponentPetName, opponentPetEmoji],
  )

  const opponentUserAvatarSrc = resolveUserAvatarSrc("girl-01")

  const playerData = {
    name: userProfile.username,
    avatarSrc: userProfile.avatarSrc,
    pet: {
      emoji: petProfile.emoji,
      avatarSrc: petProfile.avatarSrc,
      name: petProfile.name,
      level: playerStats.level,
      attack: playerStats.attack,
      health: playerHealth,
      maxHealth: playerStats.maxHealth,
    },
  }

  const opponentData = {
    name: "小书虫",
    avatarSrc: opponentUserAvatarSrc,
    pet: {
      emoji: opponentPetEmoji,
      avatarSrc: opponentPetProfile.avatarSrc,
      name: opponentPetName,
      level: opponentStats.level,
      attack: opponentStats.attack,
      health: opponentHealth,
      maxHealth: opponentStats.maxHealth,
    },
  }

  const randomQuestionIndex = () => Math.floor(Math.random() * sampleQuestions.length)

  const getTodayStamp = () => new Date().toISOString().slice(0, 10)

  const consumeFirstWinBonusIfNeeded = () => {
    const stamp = getTodayStamp()
    const key = `ak_pet_battle_first_win_${stamp}`
    const hasConsumed = window.localStorage.getItem(key) === "1"
    if (hasConsumed) return 0
    window.localStorage.setItem(key, "1")
    return 10
  }

  const getPendingBattleItem = (effectType: BattleItemRuntimeState["effectType"]) =>
    battleItemsRef.current.find((item) => item.effectType === effectType && !item.triggered) ?? null

  const consumeBattleItem = (itemId: string, notice: string) => {
    battleItemsRef.current = battleItemsRef.current.map((item) =>
      item.itemId === itemId ? { ...item, triggered: true, consumed: true } : item,
    )
    if (!consumedItemIdsRef.current.includes(itemId)) {
      consumedItemIdsRef.current.push(itemId)
    }
    setBattleItemNotice(notice)
    setLastSkillUsed(notice)
  }

  const persistConsumedBattleItems = async () => {
    const ids = [...consumedItemIdsRef.current]
    if (ids.length === 0) return
    try {
      const response = await fetch("/api/battle/consume-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: ids }),
      })
      const payload = await response.json()
      if (response.ok && payload?.ok && payload.data?.inventory) {
        setInventory(normalizeInventory(payload.data.inventory))
      }
    } catch {
      // keep local battle result even if inventory sync fails
    }
  }

  const resetBattleRuntime = () => {
    setCurrentQuestionIndex(randomQuestionIndex())
    setPlayerHealth(playerStats.maxHealth)
    playerHealthRef.current = playerStats.maxHealth
    setOpponentHealth(opponentStats.maxHealth)
    opponentHealthRef.current = opponentStats.maxHealth
    setTurnCount(1)
    turnCountRef.current = 1
    setPlayerComboStreak(0)
    setOpponentComboStreak(0)
    setScore(0)
    setBattleResult(null)
    setFirstWinBonusExp(0)
    setSettlementError(null)
    battleSettledRef.current = false
    setLastSkillUsed(undefined)
    setSkillTarget(undefined)
    setIsPlayerTurn(true)
    setBattleItemNotice(null)
    battleItemsRef.current = createBattleItemRuntime(selectedBattleItemIds)
    consumedItemIdsRef.current = []
  }

  const endBattle = (result: Exclude<BattleResult, null>) => {
    if (battleSettledRef.current) return
    battleSettledRef.current = true

    setBattleResult(result)
    let bonusExp = 0
    if (result === "win") {
      bonusExp = consumeFirstWinBonusIfNeeded()
      setFirstWinBonusExp(bonusExp)
    } else {
      setFirstWinBonusExp(0)
    }
    const rewardSnapshot = resolveBattleRewards(result, bonusExp > 0)
    const totalPetExpGain = rewardSnapshot.petExp + rewardSnapshot.firstWinBonusExp
    const shouldUseBossComplete = isBossBattle && result === "win" && bossRegionId
    void persistConsumedBattleItems()
    ;(async () => {
      try {
        const response = await fetch("/api/battle/settle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            result,
            petExpGain: shouldUseBossComplete ? 0 : totalPetExpGain,
            ownerCoinsGain: shouldUseBossComplete ? 0 : rewardSnapshot.ownerPoints,
            hasFirstWinBonus: shouldUseBossComplete ? false : bonusExp > 0,
            consumeSatiety: vitalsDeductedForBattleRef.current ? 0 : BATTLE_SATIETY_COST,
            consumeSpirit: vitalsDeductedForBattleRef.current ? 0 : BATTLE_SPIRIT_COST,
            skipVitalCost: vitalsDeductedForBattleRef.current,
          }),
        })
        const payload = await response.json()
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error?.message ?? "对战结算保存失败")
        }
        const applied = payload?.data?.applied
        if (
          applied?.satietyAfter !== undefined &&
          applied?.satietyAfter !== null &&
          applied?.spiritAfter !== undefined &&
          applied?.spiritAfter !== null
        ) {
          setPetVitals(
            normalizePetState({
              ...petVitals,
              satiety: Number(applied.satietyAfter),
              spirit: Number(applied.spiritAfter),
              isDead: Boolean(applied.isDeadAfter),
            }),
          )
        }

        if (shouldUseBossComplete) {
          const bossResponse = await fetch("/api/adventure/boss/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ regionId: bossRegionId, result: "win" }),
          })
          const bossPayload = await bossResponse.json()
          if (!bossResponse.ok || !bossPayload?.ok) {
            throw new Error(bossPayload?.error?.message ?? "BOSS 挑战结算失败")
          }
        }
      } catch (error) {
        setSettlementError(error instanceof Error ? error.message : "对战结算保存失败")
      }
    })()
    setBattlePhase("result")
    setGameState("result")
    setShowRewards(true)
  }

  const proceedNextTurn = (nextIsPlayerTurn: boolean) => {
    const limitReached = turnCountRef.current >= battleConstants.roundLimit
    if (limitReached) {
      const playerRemain = playerHealthRef.current
      const opponentRemain = opponentHealthRef.current
      if (playerRemain > opponentRemain) endBattle("win")
      else if (playerRemain < opponentRemain) endBattle("lose")
      else endBattle("draw")
      return
    }
    setTurnCount((prev) => prev + 1)
    turnCountRef.current += 1
    setIsPlayerTurn(nextIsPlayerTurn)
    setCurrentQuestionIndex(randomQuestionIndex())
    setBattlePhase("question")
  }

  const resolveAttackTurn = (actor: "player" | "opponent", isCorrect: boolean, timeBonus = 0) => {
    if (!isCorrect) {
      if (actor === "player") {
        setPlayerComboStreak(0)
      } else {
        setOpponentComboStreak(0)
      }
      setBattlePhase("idle")
      setTimeout(() => proceedNextTurn(actor !== "player"), 550)
      return
    }

    const nextCombo = actor === "player" ? playerComboStreak + 1 : opponentComboStreak + 1
    if (actor === "player") {
      setPlayerComboStreak(nextCombo)
      setOpponentComboStreak(0)
      setScore((prev) => prev + 100 + timeBonus)
    } else {
      setOpponentComboStreak(nextCombo)
      setPlayerComboStreak(0)
    }

    const attackerStats = actor === "player" ? playerStats : opponentStats
    const defenderStats = actor === "player" ? opponentStats : playerStats

    let comboForCalc = nextCombo
    let extraDamagePct = 0
    let flatBonusDamage = 0

    if (actor === "player") {
      const comboItem = getPendingBattleItem("combo_boost")
      if (comboItem) {
        comboForCalc += 1
        consumeBattleItem(comboItem.itemId, "连击推进器：连击 +1")
      }
      const pierceItem = getPendingBattleItem("armor_pierce")
      if (pierceItem) {
        const config = getBattleItemConfig(pierceItem.itemId)
        extraDamagePct += config?.piercePct ?? 0.3
        consumeBattleItem(pierceItem.itemId, "破甲符文：无视 30% 防护")
      }
      const atkItem = getPendingBattleItem("bonus_attack")
      if (atkItem) {
        const config = getBattleItemConfig(atkItem.itemId)
        flatBonusDamage += config?.bonusAttack ?? 50
        consumeBattleItem(atkItem.itemId, "强攻护符：攻击 +50")
      }
    }

    const result = calcBattleDamage({
      attackerAttack: attackerStats.attack,
      attackerLevel: attackerStats.level,
      defenderLevel: defenderStats.level,
      comboStreak: comboForCalc,
      extraDamagePct,
    })
    let finalDamage = result.damage + flatBonusDamage

    setBattlePhase("skill")
    setLastSkillUsed(actor === "player" ? "知识冲击" : "智慧反击")
    setSkillTarget(actor === "player" ? "opponent" : "player")

    setTimeout(() => {
      if (actor === "player") {
        const nextOpponentHealth = Math.max(0, opponentHealthRef.current - finalDamage)
        setOpponentHealth(nextOpponentHealth)
        opponentHealthRef.current = nextOpponentHealth
        if (nextOpponentHealth <= 0) {
          endBattle("win")
          return
        }
        setBattlePhase("idle")
        setTimeout(() => proceedNextTurn(false), 600)
      } else {
        const blockItem = getPendingBattleItem("block_hit")
        if (blockItem && finalDamage > 0) {
          finalDamage = 0
          consumeBattleItem(blockItem.itemId, "守护护盾：抵挡本次攻击")
        }

        let reflectDamage = 0
        const reflectItem = getPendingBattleItem("counter_reflect")
        if (reflectItem && finalDamage > 0) {
          const config = getBattleItemConfig(reflectItem.itemId)
          reflectDamage = Math.max(1, Math.floor(finalDamage * (config?.reflectPct ?? 0.25)))
          consumeBattleItem(reflectItem.itemId, "反击棱镜：反弹伤害")
        }

        const nextPlayerHealthRaw = Math.max(0, playerHealthRef.current - finalDamage)
        let nextPlayerHealth = nextPlayerHealthRaw
        setPlayerHealth(nextPlayerHealth)
        playerHealthRef.current = nextPlayerHealth

        if (reflectDamage > 0) {
          const nextOpponentHealth = Math.max(0, opponentHealthRef.current - reflectDamage)
          setOpponentHealth(nextOpponentHealth)
          opponentHealthRef.current = nextOpponentHealth
          if (nextOpponentHealth <= 0) {
            endBattle("win")
            return
          }
        }

        const healItem = getPendingBattleItem("heal_instant")
        const maxHp = playerMaxHealthRef.current
        if (
          healItem &&
          nextPlayerHealth > 0 &&
          nextPlayerHealth <= Math.floor(maxHp * 0.5)
        ) {
          const config = getBattleItemConfig(healItem.itemId)
          const healAmount = config?.healAmount ?? 80
          nextPlayerHealth = Math.min(maxHp, nextPlayerHealth + healAmount)
          setPlayerHealth(nextPlayerHealth)
          playerHealthRef.current = nextPlayerHealth
          consumeBattleItem(healItem.itemId, `应急药剂：恢复 ${healAmount} 生命`)
        }

        if (nextPlayerHealth <= 0) {
          endBattle("lose")
          return
        }
        setBattlePhase("idle")
        setTimeout(() => proceedNextTurn(true), 600)
      }
    }, 1200)
  }

  // Matching animation
  useEffect(() => {
    if (gameState === "matching") {
      const interval = setInterval(() => {
        setMatchingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setTimeout(() => {
              resetBattleRuntime()
              setGameState("battle")
              setBattlePhase("question")
            }, 500)
            return 100
          }
          return prev + 5
        })
      }, 100)
      return () => clearInterval(interval)
    }
  }, [gameState])

  const beginMatching = () => {
    if (bossConfig) {
      setOpponentLevel(Math.max(5, playerLevel + bossConfig.levelOffset))
      setOpponentPetName(bossConfig.name)
      setOpponentPetEmoji(bossConfig.opponentEmoji)
    } else {
      const levelOffset = Math.floor(Math.random() * 7) - 3
      const nextOpponentLevel = Math.max(1, playerLevel + levelOffset)
      const opponentPool = [
        { petName: "咪咪", emoji: "🐱" },
        { petName: "团团", emoji: "🐰" },
        { petName: "泡泡", emoji: "🐹" },
        { petName: "啾啾", emoji: "🐦" },
        { petName: "旺旺", emoji: "🐕" },
      ]
      const picked = opponentPool[Math.floor(Math.random() * opponentPool.length)]
      setOpponentLevel(nextOpponentLevel)
      setOpponentPetName(picked.petName)
      setOpponentPetEmoji(picked.emoji)
    }
    setMatchingProgress(0)
    setSettlementError(null)
    setGameState("matching")
  }

  const handleBossEnter = () => {
    if (!battleGate.ok) {
      setSettlementError(battleGate.reason)
      return
    }
    setPendingModeId(bossRegionId ? `boss:${bossRegionId}` : "boss")
    setBattleCostDialogOpen(true)
  }

  const handleSelectMode = (modeId: string) => {
    if (!battleGate.ok) {
      setSettlementError(battleGate.reason)
      return
    }
    setPendingModeId(modeId)
    setBattleCostDialogOpen(true)
  }

  const handleConfirmBattleEnter = async () => {
    if (!pendingModeId || !battleGate.ok) return
    try {
      setIsEnteringBattle(true)
      setSettlementError(null)
      const response = await fetch("/api/battle/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modeId: pendingModeId }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error?.message ?? "对战状态扣减失败，请重试")
      }
      const applied = payload?.data?.applied
      if (applied?.satietyAfter !== undefined && applied?.spiritAfter !== undefined) {
        setPetVitals(
          normalizePetState({
            ...petVitals,
            satiety: Number(applied.satietyAfter),
            spirit: Number(applied.spiritAfter),
            bond: applied.bondAfter !== undefined ? Number(applied.bondAfter) : petVitals.bond,
            isDead: Boolean(applied.isDeadAfter),
          }),
        )
      }
      vitalsDeductedForBattleRef.current = true
      setBattleCostDialogOpen(false)
      beginMatching()
      setPendingModeId(null)
    } catch (error) {
      setSettlementError(error instanceof Error ? error.message : "对战状态扣减失败，请重试")
    } finally {
      setIsEnteringBattle(false)
    }
  }

  const handleAnswer = (isCorrect: boolean, timeBonus: number) => {
    if (gameState !== "battle" || battlePhase !== "question" || !isPlayerTurn) return
    resolveAttackTurn("player", isCorrect, timeBonus)
  }

  const handleRewardsClose = () => {
    setShowRewards(false)
    vitalsDeductedForBattleRef.current = false
    resetBattleRuntime()
    if (isBossBattle && bossRegionId) {
      if (battleResult === "win") {
        router.push(`/adventure/${encodeURIComponent(bossRegionId)}?bossVictory=${encodeURIComponent(bossRegionId)}`)
      } else {
        router.push("/adventure")
      }
      return
    }
    setGameState("lobby")
    setBattlePhase("idle")
  }

  const handleNavigation = (item: string) => {
    if (item === "home") router.push("/")
    if (item === "library") router.push("/library")
    if (item === "adventure") router.push("/adventure")
    if (item === "pets") router.push("/pets")
  }

  useEffect(() => {
    if (gameState !== "battle" || battlePhase !== "question" || isPlayerTurn) return
    const timer = setTimeout(() => {
      const baseCorrectRate = 0.56
      const levelBias = Math.max(-0.12, Math.min(0.12, (opponentStats.level - playerStats.level) * 0.01))
      const correctRate = Math.max(0.2, Math.min(0.9, baseCorrectRate + levelBias))
      const aiIsCorrect = Math.random() < correctRate
      resolveAttackTurn("opponent", aiIsCorrect)
    }, 1100)
    return () => clearTimeout(timer)
  }, [gameState, battlePhase, isPlayerTurn, opponentStats.level, playerStats.level])

  const isWinner = battleResult === "win"
  const rewardResult = useMemo(() => {
    const base = resolveBattleRewards(battleResult ?? "draw", firstWinBonusExp > 0)
    if (isBossBattle && battleResult === "win" && bossConfig) {
      return {
        ...base,
        petExp: bossConfig.petExpGain,
        ownerPoints: bossConfig.ownerCoins,
        firstWinBonusExp: 0,
        bossStars: bossConfig.starsGain,
      }
    }
    return { ...base, bossStars: 0 }
  }, [battleResult, firstWinBonusExp, isBossBattle, bossConfig])

  return (
    <PlayerPageShell bottomPad="nav" withGutter className="relative overflow-hidden bg-gradient-to-b from-purple-50 via-pink-50 to-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float-particle"
            style={{
              width: `${3 + (i % 3)}px`,
              height: `${3 + (i % 3)}px`,
              backgroundColor: i % 3 === 0 
                ? "rgba(236, 72, 153, 0.3)" 
                : i % 3 === 1 
                ? "rgba(147, 51, 234, 0.25)" 
                : "rgba(251, 191, 36, 0.3)",
              left: `${5 + (i * 8)}%`,
              top: `${10 + (i % 5) * 18}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${6 + (i % 3) * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => {
              if (gameState === "lobby") {
                if (isBossBattle) router.push("/adventure")
                else router.back()
              } else {
                setGameState("lobby")
              }
            }}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-rose-500" />
            <h1 className="text-lg font-bold text-foreground">
              {isBossBattle ? "区域守护者挑战" : "宠物知识大赛"}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="relative w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white transition-colors">
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-[10px] text-white font-bold flex items-center justify-center">2</span>
            </button>
          </div>
        </div>

        {/* Lobby State */}
        {gameState === "lobby" && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            {!battleGate.ok && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                当前不可进入对战：{battleGate.reason}
              </div>
            )}
            {/* Stats card */}
            <div className="rounded-2xl bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <PetAvatar
                      src={playerData.pet.avatarSrc}
                      emoji={playerData.pet.emoji}
                      alt={playerData.pet.name}
                      size="lg"
                      rounded="2xl"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center ring-2 ring-white">
                      <span className="text-[9px] font-bold text-white">{playerData.pet.level}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{playerData.pet.name}</div>
                    <div className="text-xs text-muted-foreground">和你一起战斗!</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="text-lg font-bold text-foreground">{score}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">当前积分</span>
                </div>
              </div>
              
              <div className="mb-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-2 py-1.5 text-center">
                  <div className="text-sm font-bold text-amber-700">{petVitals.satiety}</div>
                  <div className="text-[9px] text-muted-foreground">饱食度</div>
                </div>
                <div className="rounded-xl border border-sky-100 bg-sky-50/80 px-2 py-1.5 text-center">
                  <div className="text-sm font-bold text-sky-700">{petVitals.spirit}</div>
                  <div className="text-[9px] text-muted-foreground">精神值</div>
                </div>
                <div className="rounded-xl border border-rose-100 bg-rose-50/80 px-2 py-1.5 text-center">
                  <div className="text-sm font-bold text-rose-700">{petVitals.bond}</div>
                  <div className="text-[9px] text-muted-foreground">亲密值</div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Crown className="w-3 h-3 text-amber-500" />
                    <span className="text-sm font-bold text-amber-600">{playerStats.attack}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">攻击力</span>
                </div>
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-600">{playerHealth}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">当前血量</span>
                </div>
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-3 h-3 text-purple-500" />
                    <span className="text-sm font-bold text-purple-600">{turnCount}/{battleConstants.roundLimit}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">回合</span>
                </div>
              </div>
            </div>

            <BattleItemPicker
              items={battleItemPickerOptions}
              selectedIds={selectedBattleItemIds}
              onChange={setSelectedBattleItemIds}
            />

            {isBossBattle && bossConfig ? (
              <div className="rounded-2xl border border-amber-300/40 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-2xl shadow-lg">
                    {bossConfig.opponentEmoji}
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-amber-600">BOSS战</p>
                    <p className="text-base font-bold text-foreground">{bossConfig.name}</p>
                    <p className="text-[11px] text-muted-foreground">{bossConfig.subtitle}</p>
                  </div>
                </div>
                <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
                  击败守护者可获得 {bossConfig.starsGain} 颗星星、{bossConfig.ownerCoins} 金币和额外经验。本场将扣除饱食度与精神值。
                </p>
                <Button className="w-full" onClick={handleBossEnter} disabled={!battleGate.ok}>
                  挑战守护者
                </Button>
              </div>
            ) : (
              <>
                <MatchModes onSelectMode={handleSelectMode} />
                <p className="px-1 text-[11px] text-muted-foreground">
                  进入任意模式前将提示并扣除：饱食度 -10（10%）、精神值 -10（10%）。
                </p>
              </>
            )}

            {!isBossBattle ? (
              <div className="rounded-2xl bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg p-4">
                <LeaderboardPreview
                  limit={3}
                  onViewAll={() => router.push("/leaderboard")}
                />
              </div>
            ) : null}
          </div>
        )}

        {/* Matching State */}
        {gameState === "matching" && (
          <div className="flex flex-col items-center justify-center py-12 animate-in fade-in-0 zoom-in-95 duration-500">
            <div className="relative mb-6">
              {/* Rotating ring */}
              <div className="w-32 h-32 rounded-full border-4 border-dashed border-purple-300 animate-spin-slow" />
              
              {/* Pet in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <PetAvatar
                  src={playerData.pet.avatarSrc}
                  emoji={playerData.pet.emoji}
                  alt={playerData.pet.name}
                  size="2xl"
                  rounded="full"
                  animate
                  className="animate-bounce-slow shadow-md"
                />
              </div>
              
              {/* Sparkles */}
              {[...Array(6)].map((_, i) => (
                <Sparkles
                  key={i}
                  className="absolute w-4 h-4 text-amber-400 animate-twinkle"
                  style={{
                    top: `${10 + (i * 15)}%`,
                    left: i % 2 === 0 ? "-10%" : "90%",
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
            
            <h2 className="text-lg font-bold text-foreground mb-2">正在匹配对手...</h2>
            <p className="text-sm text-muted-foreground mb-4">寻找同样热爱阅读的小伙伴</p>
            
            {/* Progress bar */}
            <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-100"
                style={{ width: `${matchingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Battle State */}
        {gameState === "battle" && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            {/* Score display */}
            <div className="flex justify-center">
              <div className="px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-md border border-white/50">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-foreground">{score} 分</span>
                </div>
              </div>
            </div>

            {/* Battle Arena */}
            <BattleArena
              playerPet={playerData.pet}
              opponentPet={opponentData.pet}
              playerAvatarSrc={playerData.avatarSrc}
              opponentAvatarSrc={opponentData.avatarSrc}
              playerName={playerData.name}
              opponentName={opponentData.name}
              isPlayerTurn={isPlayerTurn}
              battlePhase={battlePhase}
              lastSkillUsed={lastSkillUsed}
              skillTarget={skillTarget}
            />

            {/* Question Panel */}
            {battlePhase === "question" && (
              <QuestionPanel
                question={activeQuestion.question}
                options={activeQuestion.options}
                correctIndex={activeQuestion.correctIndex}
                timeLimit={battleConstants.timeLimitSeconds}
                onAnswer={handleAnswer}
                disabled={!isPlayerTurn}
              />
            )}

            {battleItemNotice && battlePhase === "skill" && (
              <div className="rounded-xl border border-violet-200 bg-violet-50/90 px-3 py-2 text-center text-xs font-medium text-violet-700">
                道具触发：{battleItemNotice}
              </div>
            )}

            {settlementError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-700">
                结算提示：{settlementError}
              </div>
            )}

            {/* Waiting message when not in question phase */}
            {battlePhase !== "question" && (
              <div className="rounded-2xl bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {battlePhase === "skill" ? "技能发动中..." : isPlayerTurn ? "准备下一题..." : "对手答题中..."}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Battle Rewards Modal */}
      {showRewards && (
        <BattleRewards
          isWinner={isWinner}
          rewards={[
            { type: "exp", amount: rewardResult.petExp, label: "宠物经验" },
            { type: "coins", amount: rewardResult.ownerPoints, label: "主人金币" },
            ...(rewardResult.bossStars > 0
              ? [{ type: "item" as const, amount: rewardResult.bossStars, label: "区域星星" }]
              : []),
            ...(rewardResult.firstWinBonusExp > 0
              ? [{ type: "item" as const, amount: rewardResult.firstWinBonusExp, label: "首胜经验加成" }]
              : []),
          ]}
          onClose={handleRewardsClose}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation
        activeItem="pets"
        onNavigate={handleNavigation}
      />

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes float-particle {
          0% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 0.6; }
          100% { transform: translateY(-40px) scale(0.8); opacity: 0; }
        }
        .animate-float-particle {
          animation: float-particle ease-out infinite;
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 1.5s ease-in-out infinite;
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .animate-twinkle {
          animation: twinkle 1.5s ease-in-out infinite;
        }
      `}</style>

      <BattleCostDialog
        open={battleCostDialogOpen}
        modeTitle={pendingModeId ? MATCH_MODE_TITLES[pendingModeId] : undefined}
        vitals={petVitals}
        isSubmitting={isEnteringBattle}
        onOpenChange={(open) => {
          if (!isEnteringBattle) {
            setBattleCostDialogOpen(open)
            if (!open) setPendingModeId(null)
          }
        }}
        onConfirm={() => void handleConfirmBattleEnter()}
      />

      <PetDeathDialog
        open={petVitals.isDead}
        petName={petProfile.name || "小伙伴"}
        species={petProfile.species}
      />
    </PlayerPageShell>
  )
}

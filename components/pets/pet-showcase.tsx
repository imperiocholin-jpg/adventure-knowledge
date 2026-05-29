"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { getHomePetMood, mapHomeMoodToSceneMood } from "@/lib/pets/state"
import { PetMoodChip } from "@/components/pets/pet-mood-chip"
import { Sparkles, Volume2, VolumeX, Utensils, Gamepad2, Moon, Dumbbell } from "lucide-react"
import { PetAvatar } from "./pet-avatar"
import { ProfileNameSkeleton } from "@/components/profile/profile-name-skeleton"
import { Pet2DScene } from "./pet-2d-scene"
import { PetFloatingHint } from "./pet-floating-hint"
import type { PetImageAction } from "@/lib/pets/avatar-registry"

interface PetShowcaseProps {
  petEmoji: string
  petName?: string
  isPetNameLoading?: boolean
  level: number
  rarity?: "common" | "rare" | "epic" | "legendary"
  mood: "happy" | "cute" | "excited" | "sleepy" | "hungry" | "sad" | "listless"
  petType?: string
  petBreed?: string
  lifeStage?: "幼崽" | "成年" | "壮年"
  petAvatarSrc?: string | null
  actionImages?: Partial<Record<PetImageAction, string>>
  actionVideos?: Partial<Record<PetImageAction, string>>
  satietyValue?: number
  spiritValue?: number
  bondValue?: number
  isDead?: boolean
  levelProgress?: number
  companionDays?: number
  canFeed?: boolean
  canPlay?: boolean
  canSleep?: boolean
  canTrain?: boolean
  sceneAction?: PetImageAction
  sceneActionTick?: number
  sceneHoldLastFrame?: boolean
  readingLevelHint?: string | null
  floatingHintText?: string | null
  onPetTap?: () => void
  onFeed?: () => void
  onPlay?: () => void
  onSleep?: () => void
  onTrain?: () => void
}

export function PetShowcase({
  petEmoji = "🐕",
  petName,
  isPetNameLoading = false,
  level = 12,
  rarity = "common",
  mood = "happy",
  petType = "tusong",
  petBreed = "土松犬",
  lifeStage = "幼崽",
  petAvatarSrc = null,
  actionImages,
  actionVideos,
  satietyValue = 80,
  spiritValue = 100,
  bondValue = 100,
  isDead = false,
  levelProgress = 0,
  companionDays = 28,
  canFeed = true,
  canPlay = true,
  canSleep = true,
  canTrain = true,
  sceneAction = "idle",
  sceneActionTick = 0,
  sceneHoldLastFrame = false,
  readingLevelHint = null,
  floatingHintText = null,
  onPetTap,
  onFeed,
  onPlay,
  onSleep,
  onTrain,
}: PetShowcaseProps) {
  const [isTapped, setIsTapped] = useState(false)
  const [showLove, setShowLove] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [petMessage, setPetMessage] = useState("")
  const [activeAction, setActiveAction] = useState<string | null>(null)

  const moodMessages = {
    happy: ["好开心~", "想和你玩!", "嘿嘿~", "摸摸我~"],
    cute: ["今天也想贴贴~", "你来啦！", "一起冒险吧~", "抱抱我~"],
    excited: ["太棒了!", "冒险去!", "耶耶!", "好兴奋!"],
    sleepy: ["困了..zzZ", "想睡觉", "打个盹~", "晚安.."],
    hungry: ["肚子饿", "有吃的吗", "想吃零食", "饿饿.."],
    sad: ["有点难过...", "陪陪我好吗", "想要被安慰", "呜呜..."],
    listless: ["今天有点没精神", "需要休息一下", "状态不太好", "想慢慢恢复"],
  }

  const displayMood = useMemo(
    () =>
      getHomePetMood({
        satiety: satietyValue,
        spirit: spiritValue,
        bond: bondValue,
        isDead,
      }),
    [satietyValue, spiritValue, bondValue, isDead],
  )

  const sceneMood = isDead ? "sleepy" : mapHomeMoodToSceneMood(displayMood)

  const statRows = [
    { key: "satiety", label: "饱食度", value: satietyValue, bar: "from-amber-400 to-orange-400", bg: "bg-amber-100", text: "text-amber-700" },
    { key: "bond", label: "亲密值", value: bondValue, bar: "from-pink-400 to-rose-400", bg: "bg-pink-100", text: "text-pink-700" },
    { key: "spirit", label: "精神值", value: spiritValue, bar: "from-blue-400 to-indigo-500", bg: "bg-blue-100", text: "text-blue-700" },
    { key: "level", label: `Lv. ${level}`, value: levelProgress, bar: "from-violet-400 to-purple-500", bg: "bg-violet-100", text: "text-violet-700" },
  ] as const

  const handleTap = () => {
    setIsTapped(true)
    setShowLove(true)
    onPetTap?.()
    
    // Show random message
    const messages = moodMessages[mood]
    setPetMessage(messages[Math.floor(Math.random() * messages.length)])
    
    setTimeout(() => setIsTapped(false), 200)
    setTimeout(() => setShowLove(false), 1500)
    setTimeout(() => setPetMessage(""), 2500)
  }

  const handleAction = (action: string, callback?: () => void) => {
    const isAllowed =
      (action === "feed" && canFeed) ||
      (action === "play" && canPlay) ||
      (action === "sleep" && canSleep) ||
      (action === "train" && canTrain)
    if (isAllowed) {
      setActiveAction(action)
      setTimeout(() => setActiveAction(null), 300)
    }
    callback?.()
  }

  return (
    <div className="relative">
      {/* Main showcase container - much larger for immersion */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-amber-100/80 bg-gradient-to-b from-amber-50/50 to-orange-50/30">
        {/* Top overlay with pet info */}
        <div className="absolute top-0 left-0 right-0 z-30 p-3 bg-gradient-to-b from-white/80 to-transparent">
          <div className="flex items-center justify-between">
            {/* Pet name and level */}
            <div className="flex items-center gap-2">
              <PetAvatar
                src={petAvatarSrc}
                emoji={petEmoji}
                alt={petName ? `${petName}头像` : "宠物头像"}
                size="sm"
                rounded="full"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  {isPetNameLoading ? (
                    <ProfileNameSkeleton className="h-5 w-24" />
                  ) : (
                    <h2 className="text-lg font-bold text-foreground">{petName}</h2>
                  )}
                  <PetMoodChip mood={displayMood} deceased={isDead} size="sm" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Lv.{level} · {petBreed} · {lifeStage}
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="rounded-full bg-white/60 p-1.5 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
              aria-label={soundEnabled ? "关闭声音" : "开启声音"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* 2D 动态宠物舞台（图片+动画） */}
        <div className="relative h-[23rem]">
          <div
            className="relative h-full cursor-pointer px-1 pt-16"
            onClick={handleTap}
          >
            <Pet2DScene
              mood={sceneMood}
              rarity={rarity}
              isTapped={isTapped}
              showLove={showLove}
              soundEnabled={soundEnabled}
              petType={petType}
              petAvatarSrc={petAvatarSrc}
              actionImages={actionImages}
              actionVideos={actionVideos}
              interaction={sceneAction}
              interactionTick={sceneActionTick}
              holdLastFrame={sceneHoldLastFrame}
              levelHint={readingLevelHint}
            />
          </div>

          {/* 互动按钮：浮于宠物画面左侧 */}
          <div className="pointer-events-none absolute bottom-0 left-5 top-16 z-20 flex flex-col items-center justify-center gap-2.5">
            <button
              aria-label="喂食"
              onClick={(e) => { e.stopPropagation(); handleAction("feed", onFeed) }}
              className={cn(
                "pointer-events-auto flex items-center justify-center rounded-2xl transition-all duration-200",
                canFeed ? (activeAction === "feed" ? "scale-95" : "hover:scale-105 active:scale-95") : "opacity-55",
              )}
            >
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg ring-2 ring-white/60",
                  canFeed ? "bg-gradient-to-br from-orange-400 to-amber-400" : "bg-slate-300",
                )}
              >
                <Utensils className="h-5 w-5" />
              </div>
            </button>
            <button
              aria-label="玩耍"
              onClick={(e) => { e.stopPropagation(); handleAction("play", onPlay) }}
              className={cn(
                "pointer-events-auto flex items-center justify-center rounded-2xl transition-all duration-200",
                canPlay ? (activeAction === "play" ? "scale-95" : "hover:scale-105 active:scale-95") : "opacity-55",
              )}
            >
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg ring-2 ring-white/60",
                  canPlay ? "bg-gradient-to-br from-pink-400 to-rose-400" : "bg-slate-300",
                )}
              >
                <Gamepad2 className="h-5 w-5" />
              </div>
            </button>
            <button
              aria-label="休息"
              onClick={(e) => { e.stopPropagation(); handleAction("sleep", onSleep) }}
              className={cn(
                "pointer-events-auto flex items-center justify-center rounded-2xl transition-all duration-200",
                canSleep ? (activeAction === "sleep" ? "scale-95" : "hover:scale-105 active:scale-95") : "opacity-55",
              )}
            >
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg ring-2 ring-white/60",
                  canSleep ? "bg-gradient-to-br from-blue-400 to-indigo-400" : "bg-slate-300",
                )}
              >
                <Moon className="h-5 w-5" />
              </div>
            </button>
            <button
              aria-label="训练"
              onClick={(e) => { e.stopPropagation(); handleAction("train", onTrain) }}
              className={cn(
                "pointer-events-auto flex items-center justify-center rounded-2xl transition-all duration-200",
                canTrain ? (activeAction === "train" ? "scale-95" : "hover:scale-105 active:scale-95") : "opacity-55",
              )}
            >
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg ring-2 ring-white/60",
                  canTrain ? "bg-gradient-to-br from-emerald-400 to-green-400" : "bg-slate-300",
                )}
              >
                <Dumbbell className="h-5 w-5" />
              </div>
            </button>
          </div>
        </div>

        {/* Pet message bubble */}
        {petMessage && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <div className="relative bg-white rounded-2xl px-4 py-2 shadow-lg border border-amber-100">
              <span className="text-sm font-medium text-foreground">{petMessage}</span>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-amber-100 rotate-45" />
            </div>
          </div>
        )}

        {floatingHintText && <PetFloatingHint text={floatingHintText} />}

        {/* Bottom stage panel - compact stat bars */}
        <div className="z-20 border-t border-white/40 bg-gradient-to-b from-white/92 to-amber-50/80 px-2.5 pb-2 pt-1 backdrop-blur-sm">
          <div className="space-y-1.5">
            {statRows.map((row) => (
              <div
                key={row.key}
                className="grid grid-cols-[3.25rem_minmax(0,1fr)_2.25rem] items-center gap-x-1.5 rounded-lg bg-white/70 px-1.5 py-1.5 shadow-sm"
              >
                <span className={cn("text-center text-[11px] font-semibold leading-none", row.text)}>
                  {row.label}
                </span>
                <div className={cn("relative h-2 min-w-0 overflow-hidden rounded-full", row.bg)}>
                  <div
                    className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", row.bar)}
                    style={{ width: `${row.value}%` }}
                  />
                  {row.value > 0 && (
                    <Sparkles
                      className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-white/90 animate-pulse"
                      style={{ left: `calc(${Math.max(4, Math.min(97, row.value))}% - 5px)` }}
                    />
                  )}
                </div>
                <span className={cn("text-right text-[11px] font-bold tabular-nums", row.text)}>
                  {row.value}%
                </span>
              </div>
            ))}
          </div>

          <div className="mt-1.5 flex items-center justify-end">
            <div className="flex items-center gap-1 rounded-full bg-white/75 px-2.5 py-1 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[11px] font-medium text-foreground">相伴 {companionDays} 天</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

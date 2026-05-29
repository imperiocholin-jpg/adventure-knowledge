"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { PetImageAction } from "@/lib/pets/avatar-registry"

interface Pet2DSceneProps {
  mood: "happy" | "cute" | "excited" | "sleepy" | "hungry" | "sad" | "listless"
  rarity: "common" | "rare" | "epic" | "legendary"
  isTapped: boolean
  showLove: boolean
  soundEnabled?: boolean
  petType?: string
  petAvatarSrc?: string | null
  actionImages?: Partial<Record<PetImageAction, string>>
  actionVideos?: Partial<Record<PetImageAction, string>>
  interaction?: PetImageAction
  interactionTick?: number
  holdLastFrame?: boolean
  levelHint?: string | null
}

export function Pet2DScene({ 
  mood = "happy", 
  rarity = "epic",
  showLove = false,
  soundEnabled = true,
  petType = "tusong",
  petAvatarSrc = null,
  actionImages,
  actionVideos,
  interaction = "idle",
  interactionTick = 0,
  holdLastFrame = false,
  levelHint = null,
}: Pet2DSceneProps) {
  const [activeInteraction, setActiveInteraction] = useState<PetImageAction>("idle")
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (interactionTick <= 0 || !interaction) return
    setActiveInteraction(interaction)
  }, [interactionTick, interaction])

  const petEmojis: Record<string, string> = {
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
    dog: "🐕",
    cat: "🐱",
    rabbit: "🐰",
    bird: "🐦",
    turtle: "🐢",
    lizard: "🦎",
    pig: "🐷",
  }

  const rarityConfig = {
    common: { glow: "bg-slate-200/30", ring: "ring-slate-300" },
    rare: { glow: "bg-blue-200/40", ring: "ring-blue-300" },
    epic: { glow: "bg-violet-200/50", ring: "ring-violet-300" },
    legendary: { glow: "bg-amber-200/60", ring: "ring-amber-300" },
  }

  const activeImageSrc = actionImages?.[activeInteraction] ?? petAvatarSrc
  const activeVideoSrc = actionVideos?.[activeInteraction] ?? actionVideos?.idle ?? null
  const config = rarityConfig[rarity]

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !soundEnabled
    void video.play().catch(() => {
      // 移动端可能阻止有声自动播放，忽略错误并等待用户下一次手势触发
    })
  }, [soundEnabled, activeVideoSrc])

  useEffect(() => {
    if (!holdLastFrame) return
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return
    video.currentTime = Math.max(video.duration - 0.04, 0)
    video.pause()
  }, [holdLastFrame, activeVideoSrc])

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50 via-orange-50/80 to-rose-50/60" />
      <div className="absolute inset-x-0 top-8 h-24 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.75)_0%,transparent_80%)]" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 h-20 w-52">
          <div className="absolute inset-0 bg-gradient-to-t from-amber-100/80 to-transparent rounded-[100%]" />
        </div>
      </div>

      <div className="absolute inset-0 flex items-stretch justify-center px-1 pb-0.5 pt-0.5">
        <div className="relative h-full min-h-0 w-full">
          <div className={cn("absolute inset-2 rounded-full blur-2xl opacity-50", config.glow)} />

          <div className="relative flex h-full w-full min-h-0 items-center justify-center overflow-hidden rounded-[1.35rem]">
            {activeVideoSrc ? (
              <video
                key={activeVideoSrc}
                ref={videoRef}
                src={activeVideoSrc}
                className="h-full w-full object-cover"
                autoPlay
                muted={!soundEnabled}
                loop={!holdLastFrame}
                playsInline
                preload="metadata"
                onLoadedMetadata={(event) => {
                  event.currentTarget.muted = !soundEnabled
                  if (!holdLastFrame) return
                  const video = event.currentTarget
                  if (!Number.isFinite(video.duration) || video.duration <= 0) return
                  video.currentTime = Math.max(video.duration - 0.04, 0)
                  video.pause()
                }}
              />
            ) : activeImageSrc ? (
              <div className="relative h-full w-full">
                <Image src={activeImageSrc} alt="宠物动作图" fill sizes="320px" className="object-cover" />
              </div>
            ) : (
              <div className="text-8xl">{petEmojis[petType]}</div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_52%,rgba(250,245,235,0.28)_86%,rgba(250,245,235,0.55)_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#faf5eb]/60 via-[#faf5eb]/15 to-transparent" />

            {rarity === "legendary" && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl">👑</div>
            )}
          </div>

        </div>
      </div>

      {levelHint && activeInteraction === "levelUp" && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-xl bg-white/85 px-3 py-1 text-[11px] font-medium text-amber-700 shadow">
          {levelHint}
        </div>
      )}
    </div>
  )
}

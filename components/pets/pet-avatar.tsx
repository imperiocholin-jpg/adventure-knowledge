"use client"

import { resolvePetThumbSrc } from "@/lib/pets/pet-thumb"
import { cn } from "@/lib/utils"

const sizeClassMap = {
  xs: "h-5 w-5 text-sm",
  sm: "h-8 w-8 text-xl",
  md: "h-12 w-12 text-3xl",
  lg: "h-16 w-16 text-4xl",
  xl: "h-24 w-24 text-5xl",
  "2xl": "h-28 w-28 text-6xl",
} as const

export type PetAvatarSize = keyof typeof sizeClassMap

const FULL_RES_SIZES = new Set<PetAvatarSize>(["xl", "2xl"])

interface PetAvatarProps {
  src?: string | null
  emoji?: string
  alt?: string
  size?: PetAvatarSize
  className?: string
  imageClassName?: string
  rounded?: "full" | "xl" | "2xl"
  animate?: boolean
}

export function PetAvatar({
  src,
  emoji = "🐕",
  alt = "宠物头像",
  size = "md",
  className,
  imageClassName,
  rounded = "xl",
  animate = false,
}: PetAvatarProps) {
  const roundedClass = rounded === "full" ? "rounded-full" : rounded === "2xl" ? "rounded-2xl" : "rounded-xl"
  const displaySrc = src
    ? FULL_RES_SIZES.has(size)
      ? src
      : resolvePetThumbSrc(src) ?? src
    : null

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden border border-white/70 bg-gradient-to-br from-amber-50/90 to-orange-50/70 shadow-sm",
        sizeClassMap[size],
        roundedClass,
        animate && "animate-breathe",
        className,
      )}
    >
      {displaySrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displaySrc}
          alt={alt}
          loading="eager"
          decoding="async"
          className={cn("h-full w-full object-cover object-center", imageClassName)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center leading-none select-none">{emoji}</span>
      )}
    </div>
  )
}

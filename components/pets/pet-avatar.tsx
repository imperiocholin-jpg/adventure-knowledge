"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

const sizeClassMap = {
  xs: "h-5 w-5 text-sm",
  sm: "h-8 w-8 text-xl",
  md: "h-12 w-12 text-3xl",
  lg: "h-16 w-16 text-4xl",
  xl: "h-24 w-24 text-5xl",
  "2xl": "h-28 w-28 text-6xl",
} as const

const imageSizesMap = {
  xs: "20px",
  sm: "32px",
  md: "48px",
  lg: "64px",
  xl: "96px",
  "2xl": "112px",
} as const

export type PetAvatarSize = keyof typeof sizeClassMap

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
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={imageSizesMap[size]}
          className={cn("object-cover object-center", imageClassName)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center leading-none select-none">{emoji}</span>
      )}
    </div>
  )
}

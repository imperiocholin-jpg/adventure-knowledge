"use client"

import { cn } from "@/lib/utils"

interface UserAvatarProps {
  src: string
  alt?: string
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

const sizeClass = {
  xs: "h-6 w-6",
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-24 w-24",
} as const

export function UserAvatar({ src, alt = "用户头像", size = "md", className }: UserAvatarProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("rounded-full object-cover object-center bg-muted", sizeClass[size], className)}
    />
  )
}

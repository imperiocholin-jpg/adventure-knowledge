"use client"

import { useMemo, useState } from "react"
import Image from "next/image"

import { buildBookCoverPublicCandidates } from "@/lib/library/book-cover"
import { cn } from "@/lib/utils"

interface BookCoverThumbProps {
  bookId: string
  title: string
  emoji: string
  imageSrc?: string | null
  className?: string
  imageClassName?: string
  sizes?: string
  priority?: boolean
}

export function BookCoverThumb({
  bookId,
  title,
  emoji,
  imageSrc = null,
  className,
  imageClassName,
  sizes = "96px",
  priority = false,
}: BookCoverThumbProps) {
  const candidates = useMemo(() => {
    const byTitleAndId = buildBookCoverPublicCandidates(bookId, title)
    if (!imageSrc) return byTitleAndId
    return [imageSrc, ...byTitleAndId.filter((url) => url !== imageSrc)]
  }, [bookId, title, imageSrc])

  const [candidateIndex, setCandidateIndex] = useState(0)
  const activeSrc = candidateIndex < candidates.length ? candidates[candidateIndex] : null

  if (!activeSrc) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-border/40 bg-muted/30 text-3xl",
          className,
        )}
        aria-label={`${title}封面`}
      >
        <span>{emoji}</span>
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-border/40 bg-muted/20", className)}>
      <Image
        src={activeSrc}
        alt={`${title}封面`}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", imageClassName)}
        onError={() => setCandidateIndex((prev) => prev + 1)}
      />
    </div>
  )
}

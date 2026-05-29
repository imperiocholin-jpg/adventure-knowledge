"use client"

import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

type HintVariant = "boost" | "success" | "warn" | "info"

function resolveHintVariant(text: string): HintVariant {
  if (/失败|不足|无法|请先|请从商店/.test(text)) return "warn"
  if (/成功|放入背包/.test(text)) return "success"
  if (/\+\d+/.test(text)) return "boost"
  return "info"
}

const variantStyles: Record<HintVariant, { shell: string; icon: string; text: string; accent: string }> = {
  boost: {
    shell: "border-pink-200/90 bg-gradient-to-r from-white/95 via-pink-50/95 to-amber-50/95 shadow-[0_8px_24px_rgba(251,113,133,0.22)]",
    icon: "text-pink-500",
    text: "text-amber-950",
    accent: "text-rose-500",
  },
  success: {
    shell: "border-emerald-200/90 bg-gradient-to-r from-white/95 via-emerald-50/95 to-teal-50/95 shadow-[0_8px_24px_rgba(52,211,153,0.2)]",
    icon: "text-emerald-500",
    text: "text-emerald-950",
    accent: "text-emerald-600",
  },
  warn: {
    shell: "border-amber-200/90 bg-gradient-to-r from-white/95 via-amber-50/95 to-orange-50/95 shadow-[0_8px_24px_rgba(251,191,36,0.2)]",
    icon: "text-amber-500",
    text: "text-amber-950",
    accent: "text-amber-700",
  },
  info: {
    shell: "border-violet-200/90 bg-gradient-to-r from-white/95 via-violet-50/95 to-fuchsia-50/95 shadow-[0_8px_24px_rgba(167,139,250,0.2)]",
    icon: "text-violet-500",
    text: "text-violet-950",
    accent: "text-violet-600",
  },
}

function formatHintContent(text: string, accentClass: string) {
  return text.split(/(\+\d+)/g).map((part, index) => {
    if (/^\+\d+$/.test(part)) {
      return (
        <span key={`${part}-${index}`} className={cn("font-extrabold tabular-nums", accentClass)}>
          {part}
        </span>
      )
    }
    return <span key={`${part}-${index}`}>{part}</span>
  })
}

interface PetFloatingHintProps {
  text: string
  className?: string
}

export function PetFloatingHint({ text, className }: PetFloatingHintProps) {
  const variant = resolveHintVariant(text)
  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        "pointer-events-none absolute left-1/2 top-[5.5rem] z-30 -translate-x-1/2 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-300",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-max max-w-[calc(100vw-2rem)] flex-nowrap items-center gap-2 rounded-2xl border-2 px-3.5 py-2 backdrop-blur-md",
          styles.shell,
        )}
      >
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/80 shadow-inner",
            styles.icon,
          )}
        >
          <Sparkles className="h-4 w-4 animate-pulse" />
        </span>
        <p className={cn("shrink-0 whitespace-nowrap text-[13px] font-bold leading-none", styles.text)}>
          {formatHintContent(text, styles.accent)}
        </p>
      </div>
    </div>
  )
}

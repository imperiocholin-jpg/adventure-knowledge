"use client"

import { cn } from "@/lib/utils"
import { Calendar, ChevronRight, Heart, PawPrint } from "lucide-react"

import { PetAvatar } from "@/components/pets/pet-avatar"

interface PetHomeShowcaseProps {
  petEmoji: string
  petAvatarSrc?: string | null
  petName: string
  affectionLevel: number
  companionDays: number
  favoriteMemory?: string
  onClick?: () => void
}

export function PetHomeShowcase({
  petEmoji = "🐕",
  petAvatarSrc = null,
  petName = "毛毛",
  affectionLevel = 85,
  companionDays = 28,
  favoriteMemory = "一起完成了《小王子》",
  onClick,
}: PetHomeShowcaseProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full overflow-hidden rounded-2xl border border-border/50 bg-card p-4 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-emerald-500/[0.06]" />

      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <PawPrint className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-bold text-foreground">我的伙伴</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full bg-primary/15 blur-md" />
            <PetAvatar
              src={petAvatarSrc}
              emoji={petEmoji}
              alt={`${petName}头像`}
              size="lg"
              rounded="full"
              className="relative border-2 border-primary/20 shadow-sm"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-base font-bold text-foreground">{petName}</h4>

            <div className="mt-2 flex items-center gap-2">
              <Heart className="h-3 w-3 fill-rose-400 text-rose-400" />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
                  style={{ width: `${affectionLevel}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-primary">{affectionLevel}%</span>
            </div>

            <div className="mt-1.5 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">相伴 {companionDays} 天</span>
            </div>
          </div>
        </div>

        {favoriteMemory ? (
          <div className="mt-3 rounded-xl bg-muted/40 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">美好记忆：</span>
              {favoriteMemory}
            </p>
          </div>
        ) : null}
      </div>
    </button>
  )
}

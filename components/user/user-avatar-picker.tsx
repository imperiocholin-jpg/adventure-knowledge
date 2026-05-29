"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  getAvatarGenderFromId,
  USER_AVATARS_BY_GENDER,
  type UserAvatarGender,
} from "@/lib/user/avatar-catalog"
import { persistUserAvatarChoice } from "@/lib/user/user-profile"

interface UserAvatarPickerProps {
  currentAvatarId: string
  onSelected?: (avatarId: string) => void
  className?: string
  /** 注册流程中设为 false，由父页面统一提交 */
  persistOnSelect?: boolean
}

export function UserAvatarPicker({
  currentAvatarId,
  onSelected,
  className,
  persistOnSelect = true,
}: UserAvatarPickerProps) {
  const [gender, setGender] = useState<UserAvatarGender>(() => getAvatarGenderFromId(currentAvatarId))
  const [savingId, setSavingId] = useState<string | null>(null)

  const handleSelect = async (avatarId: string) => {
    if (savingId) return
    if (persistOnSelect && avatarId === currentAvatarId) return

    if (!persistOnSelect) {
      onSelected?.(avatarId)
      return
    }

    setSavingId(avatarId)
    try {
      await persistUserAvatarChoice(avatarId)
      onSelected?.(avatarId)
    } finally {
      setSavingId(null)
    }
  }

  const options = USER_AVATARS_BY_GENDER[gender]

  return (
    <section className={cn("rounded-2xl border border-border/60 bg-card p-4 shadow-sm", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-card-foreground">选择冒险家头像</h3>
        <div className="flex rounded-full bg-muted p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setGender("boy")}
            className={cn(
              "rounded-full px-3 py-1 font-medium transition-colors",
              gender === "boy" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            男生
          </button>
          <button
            type="button"
            onClick={() => setGender("girl")}
            className={cn(
              "rounded-full px-3 py-1 font-medium transition-colors",
              gender === "girl" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            女生
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {options.map((option) => {
          const isActive = option.id === currentAvatarId
          const isSaving = savingId === option.id
          return (
            <button
              key={option.id}
              type="button"
              disabled={Boolean(savingId)}
              onClick={() => void handleSelect(option.id)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border-2 transition-all",
                isActive
                  ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                  : "border-transparent hover:border-primary/40",
                isSaving && "opacity-70",
              )}
              aria-label={option.label}
              aria-pressed={isActive}
            >
              <img src={option.src} alt={option.label} className="h-full w-full object-cover object-center" />
            </button>
          )
        })}
      </div>
    </section>
  )
}

"use client"

import { PetAvatar } from "@/components/pets/pet-avatar"
import { cn } from "@/lib/utils"
import { BookOpen, CheckCircle2, Clock3 } from "lucide-react"

interface PetCollectionProps {
  petName?: string
  petEmoji?: string
  petAvatarSrc?: string | null
  petBreed?: string
  lifeStage?: "幼崽" | "成年" | "壮年"
  level?: number
  affectionLevel?: number
  companionDays?: number
  attack?: number
  maxHealth?: number
  battlePower?: number
}

export function PetCollection({
  petName = "毛毛",
  petEmoji = "🐕",
  petAvatarSrc = null,
  petBreed = "柯基",
  lifeStage = "幼崽",
  level = 1,
  affectionLevel = 80,
  companionDays = 1,
  attack = 21,
  maxHealth = 138,
  battlePower = 74,
}: PetCollectionProps) {
  const growthMilestones = [
    { stage: "幼崽", levelRange: "Lv.1 - Lv.10", unlocked: level >= 1, note: "互动偏活泼，依赖高频陪伴与喂养" },
    { stage: "成年", levelRange: "Lv.11 - Lv.25", unlocked: level >= 11, note: "行为更稳定，训练与冒险表现提升" },
    { stage: "壮年", levelRange: "Lv.26 - Lv.50", unlocked: level >= 26, note: "状态成熟，动作反馈更从容有力量" },
  ] as const

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">伙伴成长档案</h3>
              <p className="text-xs text-muted-foreground">一人一宠，记录专属成长轨迹</p>
            </div>
          </div>
          <div className="rounded-xl bg-white/80 px-3 py-1.5 text-right shadow-sm">
            <p className="text-[10px] text-muted-foreground">当前阶段</p>
            <p className="text-sm font-semibold text-emerald-700">{lifeStage}</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-white/70 p-3">
          <div>
            <p className="text-[10px] text-muted-foreground">伙伴</p>
            <div className="flex items-center gap-1.5">
              <PetAvatar
                src={petAvatarSrc}
                emoji={petEmoji}
                alt={`${petName}头像`}
                size="xs"
                rounded="full"
                className="border-white/70"
              />
              <p className="text-sm font-semibold text-foreground">{petName}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">品种</p>
            <p className="text-sm font-semibold text-foreground">{petBreed}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">等级</p>
            <p className="text-sm font-semibold text-foreground">Lv.{level}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">相伴天数</p>
            <p className="text-sm font-semibold text-foreground">{companionDays} 天</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">攻击力</p>
            <p className="text-sm font-semibold text-foreground">ATK {attack}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">最大血量</p>
            <p className="text-sm font-semibold text-foreground">HP {maxHealth}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] text-muted-foreground">战力评估</p>
            <p className="text-sm font-semibold text-foreground">{battlePower}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] text-muted-foreground">亲密度</p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-emerald-100">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${affectionLevel}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card p-4">
        <p className="text-sm font-semibold text-foreground">成长里程碑</p>
        <div className="mt-3 space-y-2.5">
          {growthMilestones.map((item) => (
            <div
              key={item.stage}
              className={cn(
                "rounded-xl border px-3 py-2",
                item.unlocked ? "border-emerald-200 bg-emerald-50/70" : "border-border/60 bg-muted/30",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {item.unlocked ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Clock3 className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs font-semibold text-foreground">{item.stage}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{item.levelRange}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{item.note}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

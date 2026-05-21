"use client"

import { cn } from "@/lib/utils"
import { Shield, Sword, Sparkles, Star, Lock, Zap } from "lucide-react"

interface Equipment {
  id: string
  name: string
  type: "accessory" | "outfit" | "special"
  rarity: "common" | "rare" | "epic" | "legendary"
  emoji: string
  bonus: string
  equipped: boolean
}

interface Skill {
  id: string
  name: string
  description: string
  icon: string
  level: number
  maxLevel: number
  unlocked: boolean
}

interface PetEquipmentProps {
  equipment?: Equipment[]
  skills?: Skill[]
  onEquip?: (equipmentId: string) => void
  onUpgradeSkill?: (skillId: string) => void
}

const defaultEquipment: Equipment[] = [
  { id: "1", name: "幸运围巾", type: "accessory", rarity: "rare", emoji: "🧣", bonus: "+10% 金币", equipped: true },
  { id: "2", name: "智慧眼镜", type: "accessory", rarity: "epic", emoji: "👓", bonus: "+15% 经验", equipped: false },
  { id: "3", name: "勇者披风", type: "outfit", rarity: "legendary", emoji: "🦸", bonus: "+20% 全属性", equipped: false },
]

const defaultSkills: Skill[] = [
  { id: "1", name: "金币嗅觉", description: "阅读时额外获得金币", icon: "🪙", level: 3, maxLevel: 5, unlocked: true },
  { id: "2", name: "经验加成", description: "完成任务获得更多经验", icon: "✨", level: 2, maxLevel: 5, unlocked: true },
  { id: "3", name: "幸运加护", description: "增加稀有物品掉落率", icon: "🍀", level: 0, maxLevel: 5, unlocked: false },
]

export function PetEquipment({
  equipment = defaultEquipment,
  skills = defaultSkills,
  onEquip,
  onUpgradeSkill,
}: PetEquipmentProps) {
  const rarityConfig = {
    common: { 
      gradient: "from-slate-300 to-slate-400", 
      border: "border-slate-200",
      bg: "bg-slate-50",
    },
    rare: { 
      gradient: "from-blue-400 to-cyan-400", 
      border: "border-blue-200",
      bg: "bg-blue-50",
    },
    epic: { 
      gradient: "from-purple-400 to-pink-400", 
      border: "border-purple-200",
      bg: "bg-purple-50",
    },
    legendary: { 
      gradient: "from-amber-400 to-orange-400", 
      border: "border-amber-200",
      bg: "bg-amber-50",
    },
  }

  return (
    <div className="space-y-4">
      {/* Equipment section */}
      <div className="rounded-2xl bg-card/80 backdrop-blur-sm p-4 shadow-lg border border-white/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/10">
            <Shield className="h-4 w-4 text-cyan-500" />
          </div>
          <h3 className="font-bold text-foreground">装备栏</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {equipment.filter(e => e.equipped).length}/{equipment.length}
          </span>
        </div>

        <div className="space-y-2">
          {equipment.map((item) => {
            const config = rarityConfig[item.rarity]
            
            return (
              <button
                key={item.id}
                onClick={() => onEquip?.(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200",
                  config.bg,
                  config.border,
                  item.equipped 
                    ? "ring-2 ring-primary ring-offset-2" 
                    : "hover:scale-[1.02] hover:shadow-md"
                )}
              >
                {/* Item icon */}
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl",
                  "bg-gradient-to-br shadow-inner",
                  config.gradient
                )}>
                  <span className="text-2xl">{item.emoji}</span>
                </div>
                
                {/* Item info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{item.name}</span>
                    {item.rarity === "legendary" && (
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    )}
                  </div>
                  <span className="text-xs text-primary font-medium">{item.bonus}</span>
                </div>
                
                {/* Equipped indicator */}
                {item.equipped && (
                  <div className="px-2 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    装备中
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Skills section */}
      <div className="rounded-2xl bg-card/80 backdrop-blur-sm p-4 shadow-lg border border-white/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/10">
            <Sparkles className="h-4 w-4 text-violet-500" />
          </div>
          <h3 className="font-bold text-foreground">被动技能</h3>
        </div>

        <div className="space-y-2">
          {skills.map((skill) => (
            <button
              key={skill.id}
              onClick={() => skill.unlocked && onUpgradeSkill?.(skill.id)}
              disabled={!skill.unlocked}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200",
                skill.unlocked 
                  ? "bg-violet-50 border-violet-200 hover:scale-[1.02] hover:shadow-md"
                  : "bg-muted/50 border-muted opacity-60"
              )}
            >
              {/* Skill icon */}
              <div className={cn(
                "relative flex items-center justify-center w-12 h-12 rounded-xl",
                skill.unlocked 
                  ? "bg-gradient-to-br from-violet-400 to-purple-500"
                  : "bg-muted"
              )}>
                <span className="text-2xl">{skill.icon}</span>
                {!skill.unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
              
              {/* Skill info */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">{skill.name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{skill.description}</span>
              </div>
              
              {/* Skill level */}
              {skill.unlocked ? (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-bold text-violet-600">
                    Lv.{skill.level}/{skill.maxLevel}
                  </span>
                  <div className="flex gap-0.5">
                    {[...Array(skill.maxLevel)].map((_, i) => (
                      <div 
                        key={i}
                        className={cn(
                          "w-2 h-2 rounded-full",
                          i < skill.level 
                            ? "bg-gradient-to-r from-violet-500 to-purple-500"
                            : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Lv.15 解锁</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

"use client"

import { cn } from "@/lib/utils"
import { Sparkles, Star, Heart, Shield, Zap, Wind } from "lucide-react"
import { LucideIcon } from "lucide-react"

interface Skill {
  id: string
  name: string
  description: string
  icon: LucideIcon
  color: string
  gradient: string
  power: number
  type: "attack" | "defense" | "heal" | "special"
}

interface PetSkillsProps {
  skills: Skill[]
  activeSkillId?: string
  onSkillSelect?: (skill: Skill) => void
  disabled?: boolean
}

const defaultSkills: Skill[] = [
  {
    id: "rainbow-blast",
    name: "彩虹冲击",
    description: "发射绚丽彩虹光束",
    icon: Sparkles,
    color: "text-pink-500",
    gradient: "from-pink-400 via-purple-400 to-blue-400",
    power: 25,
    type: "attack",
  },
  {
    id: "star-jump",
    name: "星星跳跃",
    description: "召唤星星进行攻击",
    icon: Star,
    color: "text-amber-500",
    gradient: "from-amber-400 to-yellow-400",
    power: 20,
    type: "attack",
  },
  {
    id: "healing-hug",
    name: "治愈拥抱",
    description: "温柔的拥抱恢复体力",
    icon: Heart,
    color: "text-rose-500",
    gradient: "from-rose-400 to-pink-400",
    power: 15,
    type: "heal",
  },
  {
    id: "book-shield",
    name: "书本护盾",
    description: "用知识之书抵挡伤害",
    icon: Shield,
    color: "text-blue-500",
    gradient: "from-blue-400 to-cyan-400",
    power: 20,
    type: "defense",
  },
]

export function PetSkills({
  skills = defaultSkills,
  activeSkillId,
  onSkillSelect,
  disabled = false,
}: PetSkillsProps) {
  return (
    <div className="rounded-2xl bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg p-3">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-bold text-foreground">宠物技能</span>
        <span className="text-[10px] text-muted-foreground">(答对问题自动触发)</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {skills.map((skill) => {
          const Icon = skill.icon
          const isActive = skill.id === activeSkillId
          
          return (
            <button
              key={skill.id}
              onClick={() => onSkillSelect?.(skill)}
              disabled={disabled}
              className={cn(
                "relative flex flex-col items-center p-2 rounded-xl transition-all duration-300",
                "border-2",
                isActive
                  ? "border-amber-400 bg-amber-50 scale-105 shadow-lg"
                  : "border-transparent bg-muted/30 hover:bg-muted/50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Skill icon */}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-1",
                "bg-gradient-to-br shadow-md",
                skill.gradient
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              
              {/* Skill name */}
              <span className="text-[10px] font-semibold text-foreground text-center leading-tight">
                {skill.name}
              </span>
              
              {/* Power indicator */}
              <div className="flex items-center gap-0.5 mt-0.5">
                <Zap className="w-2.5 h-2.5 text-amber-500" />
                <span className="text-[9px] font-bold text-amber-600">{skill.power}</span>
              </div>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

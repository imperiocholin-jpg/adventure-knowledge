"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  ChevronLeft, 
  Map,
  Star,
  Crown,
  Flame,
  Compass,
  Trophy,
  Lock,
  CheckCircle2,
  TrendingUp,
  Clock,
  Target,
  Sparkles,
  ChevronRight
} from "lucide-react"
import { BottomNavigation } from "@/components/game/bottom-navigation"

const allRegions = [
  { 
    id: "magic-forest",
    name: "魔法森林", 
    icon: "🌲",
    unlocked: true,
    progress: 75, 
    stages: 12,
    completedStages: 9,
    stars: 24,
    maxStars: 36,
    difficulty: "初级",
    description: "神秘的精灵之地，适合初次冒险",
    color: "from-emerald-400 to-emerald-600",
    bgColor: "bg-emerald-500/10",
  },
  { 
    id: "ice-mountain",
    name: "冰雪之巅", 
    icon: "❄️",
    unlocked: true,
    progress: 40, 
    stages: 10,
    completedStages: 4,
    stars: 10,
    maxStars: 30,
    difficulty: "中级",
    description: "永恒冰封的山脉，挑战更艰难",
    color: "from-cyan-400 to-blue-500",
    bgColor: "bg-cyan-500/10",
  },
  { 
    id: "ancient-desert",
    name: "远古沙漠", 
    icon: "☀️",
    unlocked: true,
    progress: 20, 
    stages: 8,
    completedStages: 2,
    stars: 4,
    maxStars: 24,
    difficulty: "中级",
    description: "失落文明的遗迹，充满谜题",
    color: "from-amber-400 to-orange-500",
    bgColor: "bg-amber-500/10",
  },
  { 
    id: "sky-kingdom",
    name: "天空王国", 
    icon: "☁️",
    unlocked: false,
    progress: 0, 
    stages: 15,
    completedStages: 0,
    stars: 0,
    maxStars: 45,
    difficulty: "高级",
    description: "云端之上的国度",
    unlockCondition: "完成魔法森林",
    color: "from-violet-400 to-purple-500",
    bgColor: "bg-violet-500/10",
  },
  { 
    id: "ocean-ruins",
    name: "深海遗迹", 
    icon: "🌊",
    unlocked: false,
    progress: 0, 
    stages: 12,
    completedStages: 0,
    stars: 0,
    maxStars: 36,
    difficulty: "高级",
    description: "沉没的海底文明",
    unlockCondition: "冒险等级达到15级",
    color: "from-blue-400 to-indigo-500",
    bgColor: "bg-blue-500/10",
  },
  { 
    id: "volcano-realm",
    name: "炎龙火山", 
    icon: "🔥",
    unlocked: false,
    progress: 0, 
    stages: 10,
    completedStages: 0,
    stars: 0,
    maxStars: 30,
    difficulty: "极难",
    description: "龙族的领地",
    unlockCondition: "解锁全部区域",
    color: "from-red-500 to-orange-600",
    bgColor: "bg-red-500/10",
  },
]

const achievements = [
  { id: 1, name: "初出茅庐", description: "完成第一个关卡", completed: true, icon: "🎯" },
  { id: 2, name: "勤奋冒险家", description: "连续冒险7天", completed: true, icon: "🔥" },
  { id: 3, name: "星星收集者", description: "收集100颗星星", completed: true, icon: "⭐" },
  { id: 4, name: "森林守护者", description: "完成魔法森林全部关卡", completed: false, progress: 75, icon: "🌲" },
  { id: 5, name: "冰雪勇士", description: "完成冰雪之巅全部关卡", completed: false, progress: 40, icon: "❄️" },
  { id: 6, name: "传说缔造者", description: "达到冒险等级25", completed: false, progress: 48, icon: "👑" },
]

const weeklyStats = [
  { day: "周一", value: 45 },
  { day: "周二", value: 60 },
  { day: "周三", value: 30 },
  { day: "周四", value: 75 },
  { day: "周五", value: 50 },
  { day: "周六", value: 90 },
  { day: "周日", value: 40 },
]

export default function ProgressPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"regions" | "achievements" | "stats">("regions")

  const totalStars = allRegions.reduce((sum, r) => sum + r.stars, 0)
  const maxStars = allRegions.reduce((sum, r) => sum + r.maxStars, 0)
  const unlockedRegions = allRegions.filter(r => r.unlocked).length
  const completedAchievements = achievements.filter(a => a.completed).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-cyan-50/50 to-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/40">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/90 shadow-md border border-white/60"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-primary" />
            <h1 className="text-base font-bold text-foreground">冒险进度</h1>
          </div>
          
          <div className="w-9" />
        </div>
      </header>

      {/* Overall stats banner */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-r from-primary via-emerald-500 to-teal-500 rounded-2xl p-4 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.2),transparent_60%)]" />
          
          <div className="relative">
            {/* Level and XP */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <Crown className="h-7 w-7 text-amber-300" />
                </div>
                <div>
                  <p className="text-white/80 text-xs">冒险等级</p>
                  <p className="text-2xl font-bold">Lv.12</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-amber-300">
                  <Flame className="h-4 w-4" />
                  <span className="font-bold">5天</span>
                </div>
                <p className="text-[10px] text-white/70">连续冒险</p>
              </div>
            </div>
            
            {/* XP Progress */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-white/80">经验值</span>
                <span className="font-medium">680/1000 XP</span>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full w-[68%] bg-gradient-to-r from-amber-300 to-yellow-300 rounded-full" />
              </div>
            </div>
            
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 text-center">
                <Compass className="h-4 w-4 mx-auto mb-1 text-white/80" />
                <p className="text-lg font-bold">{unlockedRegions}/6</p>
                <p className="text-[9px] text-white/70">解锁区域</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 text-center">
                <Star className="h-4 w-4 mx-auto mb-1 text-amber-300" />
                <p className="text-lg font-bold">{totalStars}</p>
                <p className="text-[9px] text-white/70">收集星星</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 text-center">
                <Trophy className="h-4 w-4 mx-auto mb-1 text-yellow-300" />
                <p className="text-lg font-bold">{completedAchievements}</p>
                <p className="text-[9px] text-white/70">成就达成</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
          {[
            { key: "regions", label: "区域进度", icon: Map },
            { key: "achievements", label: "成就", icon: Trophy },
            { key: "stats", label: "统计", icon: TrendingUp },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                  activeTab === tab.key 
                    ? "bg-white shadow-md text-foreground" 
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Regions Tab */}
      {activeTab === "regions" && (
        <div className="px-4 space-y-3">
          {allRegions.map((region) => (
            <div
              key={region.id}
              className={cn(
                "relative overflow-hidden rounded-2xl p-4 border transition-all",
                region.unlocked 
                  ? "bg-white/90 border-white/60 shadow-md" 
                  : "bg-gray-100/50 border-gray-200/50"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                  region.unlocked ? region.bgColor : "bg-gray-200/50 grayscale"
                )}>
                  {region.icon}
                </div>
                
                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "font-bold",
                      region.unlocked ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {region.name}
                    </span>
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                      region.difficulty === "初级" ? "bg-emerald-100 text-emerald-600" :
                      region.difficulty === "中级" ? "bg-amber-100 text-amber-600" :
                      region.difficulty === "高级" ? "bg-orange-100 text-orange-600" :
                      "bg-red-100 text-red-600"
                    )}>
                      {region.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-muted-foreground mb-2">
                    {region.unlocked ? region.description : region.unlockCondition}
                  </p>
                  
                  {region.unlocked ? (
                    <>
                      {/* Progress bar */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-muted-foreground">关卡进度</span>
                          <span className="font-medium">{region.completedStages}/{region.stages}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full bg-gradient-to-r", region.color)}
                            style={{ width: `${region.progress}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Stars */}
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-[10px] font-medium text-amber-600">
                          {region.stars}/{region.maxStars}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Lock className="h-3.5 w-3.5" />
                      <span className="text-[11px]">未解锁</span>
                    </div>
                  )}
                </div>
                
                {/* Action */}
                {region.unlocked && (
                  <button className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === "achievements" && (
        <div className="px-4 space-y-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={cn(
                "p-4 rounded-2xl border transition-all",
                achievement.completed 
                  ? "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-400/30" 
                  : "bg-white/80 border-gray-200/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center text-xl",
                  achievement.completed ? "bg-amber-500/20" : "bg-gray-100"
                )}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{achievement.name}</span>
                    {achievement.completed && (
                      <CheckCircle2 className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{achievement.description}</p>
                  
                  {!achievement.completed && achievement.progress !== undefined && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full"
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-medium text-muted-foreground">
                        {achievement.progress}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === "stats" && (
        <div className="px-4 space-y-4">
          {/* Weekly activity */}
          <div className="bg-white/90 rounded-2xl p-4 border border-white/60 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">本周冒险时间</span>
            </div>
            
            <div className="flex items-end justify-between h-24 gap-2">
              {weeklyStats.map((stat, i) => {
                const isToday = i === new Date().getDay() - 1
                return (
                  <div key={stat.day} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className={cn(
                        "w-full rounded-t-lg transition-all",
                        isToday 
                          ? "bg-gradient-to-t from-primary to-emerald-400" 
                          : "bg-primary/30"
                      )}
                      style={{ height: `${stat.value}%` }}
                    />
                    <span className={cn(
                      "text-[9px]",
                      isToday ? "font-bold text-primary" : "text-muted-foreground"
                    )}>
                      {stat.day}
                    </span>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">本周总计</span>
              <span className="text-sm font-bold text-foreground">
                {weeklyStats.reduce((sum, s) => sum + s.value, 0)} 分钟
              </span>
            </div>
          </div>
          
          {/* Milestones */}
          <div className="bg-white/90 rounded-2xl p-4 border border-white/60 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-bold text-foreground">里程碑</span>
            </div>
            
            <div className="space-y-3">
              {[
                { label: "第一次冒险", date: "2024-01-01", icon: "🎯" },
                { label: "收集50颗星星", date: "2024-01-10", icon: "⭐" },
                { label: "解锁第二区域", date: "2024-01-15", icon: "🗺️" },
                { label: "达到10级", date: "2024-01-20", icon: "👑" },
              ].map((milestone, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <span>{milestone.icon}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-medium text-foreground">{milestone.label}</span>
                    <p className="text-[10px] text-muted-foreground">{milestone.date}</p>
                  </div>
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNavigation activeItem="adventure" onNavigate={(item) => {
        if (item === "home") router.push("/")
        if (item === "library") router.push("/library")
        if (item === "pets") router.push("/pets")
        if (item === "profile") router.push("/profile")
      }} />
    </div>
  )
}

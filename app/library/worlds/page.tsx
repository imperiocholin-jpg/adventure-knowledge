"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  ChevronLeft, Bell, MapPin, Star, Lock, Play, Sparkles, 
  Users, BookOpen, Trophy, Filter
} from "lucide-react"
import { BottomNavigation } from "@/components/game/bottom-navigation"
import { PlayerPageShell } from "@/components/layout/player-page-shell"

interface ReadingWorld {
  id: string
  title: string
  subtitle: string
  cover: string
  theme: string
  gradient: string
  progress: number
  isNew?: boolean
  isLocked?: boolean
  chapters: number
  completedChapters: number
  readers: number
  books: number
  difficulty: "easy" | "medium" | "hard"
}

const allWorlds: ReadingWorld[] = [
  {
    id: "1",
    title: "小王子的星球",
    subtitle: "探索宇宙的哲学之旅",
    cover: "🌟",
    theme: "星际冒险",
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
    progress: 65,
    chapters: 12,
    completedChapters: 8,
    readers: 2847,
    books: 5,
    difficulty: "medium",
  },
  {
    id: "2",
    title: "爱丽丝仙境",
    subtitle: "奇幻冒险的起点",
    cover: "🐰",
    theme: "魔法森林",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    progress: 30,
    isNew: true,
    chapters: 15,
    completedChapters: 4,
    readers: 3521,
    books: 8,
    difficulty: "easy",
  },
  {
    id: "3",
    title: "海底王国",
    subtitle: "深海冒险等你来",
    cover: "🐚",
    theme: "神秘深海",
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    isLocked: true,
    progress: 0,
    chapters: 10,
    completedChapters: 0,
    readers: 1923,
    books: 6,
    difficulty: "medium",
  },
  {
    id: "4",
    title: "冰雪女王",
    subtitle: "冰封王国的秘密",
    cover: "❄️",
    theme: "冰雪奇缘",
    gradient: "from-sky-400 via-blue-500 to-indigo-500",
    progress: 45,
    chapters: 8,
    completedChapters: 3,
    readers: 2156,
    books: 4,
    difficulty: "easy",
  },
  {
    id: "5",
    title: "恐龙时代",
    subtitle: "穿越史前世界",
    cover: "🦕",
    theme: "远古探索",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    progress: 20,
    chapters: 14,
    completedChapters: 3,
    readers: 4102,
    books: 7,
    difficulty: "medium",
  },
  {
    id: "6",
    title: "太空堡垒",
    subtitle: "银河系的冒险",
    cover: "🚀",
    theme: "科幻未来",
    gradient: "from-slate-600 via-purple-600 to-blue-600",
    isLocked: true,
    progress: 0,
    chapters: 20,
    completedChapters: 0,
    readers: 1567,
    books: 10,
    difficulty: "hard",
  },
  {
    id: "7",
    title: "魔法学院",
    subtitle: "学习神奇魔法",
    cover: "🪄",
    theme: "魔法世界",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    progress: 80,
    chapters: 16,
    completedChapters: 13,
    readers: 5234,
    books: 9,
    difficulty: "medium",
  },
  {
    id: "8",
    title: "精灵森林",
    subtitle: "与自然精灵为伴",
    cover: "🧚",
    theme: "奇幻森林",
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    progress: 10,
    isNew: true,
    chapters: 12,
    completedChapters: 1,
    readers: 892,
    books: 5,
    difficulty: "easy",
  },
]

const difficultyConfig = {
  easy: { label: "初级", color: "text-emerald-600 bg-emerald-100" },
  medium: { label: "中级", color: "text-amber-600 bg-amber-100" },
  hard: { label: "高级", color: "text-rose-600 bg-rose-100" },
}

export default function WorldsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<"all" | "inProgress" | "new" | "locked">("all")

  const filteredWorlds = allWorlds.filter(world => {
    if (filter === "all") return true
    if (filter === "inProgress") return world.progress > 0 && !world.isLocked
    if (filter === "new") return world.isNew
    if (filter === "locked") return world.isLocked
    return true
  })

  const handleNavigation = (item: string) => {
    if (item === "home") router.push("/")
    if (item === "library") router.push("/library")
    if (item === "adventure") router.push("/adventure")
    if (item === "pets") router.push("/pets")
    if (item === "profile") router.push("/profile")
  }

  return (
    <PlayerPageShell className="bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => router.push("/library")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">阅读世界</h1>
          </div>
          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 hover:bg-muted transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">2</span>
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {[
            { id: "all", label: "全部世界" },
            { id: "inProgress", label: "探索中" },
            { id: "new", label: "新开放" },
            { id: "locked", label: "待解锁" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as typeof filter)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                filter === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-2xl p-3 border border-primary/20">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{allWorlds.filter(w => !w.isLocked).length}</p>
              <p className="text-[10px] text-muted-foreground">已解锁</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-lg font-bold text-amber-500">{allWorlds.filter(w => w.progress > 0 && w.progress < 100).length}</p>
              <p className="text-[10px] text-muted-foreground">探索中</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-500">{allWorlds.filter(w => w.progress === 100).length}</p>
              <p className="text-[10px] text-muted-foreground">已完成</p>
            </div>
          </div>
          <Trophy className="h-8 w-8 text-amber-400" />
        </div>
      </div>

      {/* Worlds grid */}
      <div className="px-4 space-y-4">
        {filteredWorlds.map((world) => (
          <button
            key={world.id}
            onClick={() => !world.isLocked && router.push(`/library/worlds/${world.id}`)}
            className={cn(
              "relative w-full rounded-2xl overflow-hidden transition-all duration-300",
              world.isLocked ? "opacity-70" : "hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            {/* Background */}
            <div className={cn("absolute inset-0 bg-gradient-to-r", world.gradient)} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* Locked overlay */}
            {world.isLocked && (
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-10" />
            )}

            {/* Content */}
            <div className="relative p-4 z-10">
              <div className="flex items-start gap-4">
                {/* Cover */}
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  {world.isLocked ? (
                    <Lock className="h-6 w-6 text-white/80" />
                  ) : (
                    <span className="text-4xl">{world.cover}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-white">{world.title}</h3>
                    {world.isNew && (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-[9px] font-bold text-amber-900">NEW</span>
                    )}
                  </div>
                  <p className="text-xs text-white/80 mb-2">{world.subtitle}</p>
                  
                  <div className="flex items-center gap-3 text-[10px] text-white/70">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {world.books} 本书
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {world.readers.toLocaleString()}
                    </span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-medium",
                      difficultyConfig[world.difficulty].color
                    )}>
                      {difficultyConfig[world.difficulty].label}
                    </span>
                  </div>
                </div>

                {/* Action */}
                {!world.isLocked && (
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm">
                      <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                    </div>
                    <span className="text-[10px] font-bold text-white">{world.progress}%</span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {!world.isLocked && world.progress > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                      style={{ width: `${world.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[9px] text-white/70">
                    <span>{world.completedChapters}/{world.chapters} 章节</span>
                    <span className="flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-amber-300 text-amber-300" />
                      {world.completedChapters * 3} 星星
                    </span>
                  </div>
                </div>
              )}

              {world.isLocked && (
                <div className="mt-3 flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2">
                  <Lock className="h-4 w-4 text-white/70" />
                  <span className="text-[10px] text-white/80">完成前置世界后解锁</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeItem="library" onNavigate={handleNavigation} />
    </PlayerPageShell>
  )
}

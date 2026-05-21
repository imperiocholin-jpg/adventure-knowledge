"use client"

import { useState } from "react"
import { Star, Trophy, Lock, Sparkles, BookOpen, ChevronRight, Zap, Flame, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

type BookRarity = "common" | "rare" | "epic" | "legendary"

interface Book {
  id: string
  title: string
  author: string
  cover: string
  rarity: BookRarity
  progress: number
  completed: boolean
  locked: boolean
  stars: number
  maxStars: number
  unlocksReward?: string
  worldSymbol?: string
}

interface Category {
  id: string
  label: string
  icon: React.ReactNode
}

const categories: Category[] = [
  { id: "all", label: "全部", icon: <Sparkles className="h-3 w-3" /> },
  { id: "popular", label: "热门", icon: <Flame className="h-3 w-3" /> },
  { id: "new", label: "最新", icon: <Star className="h-3 w-3" /> },
  { id: "recent", label: "最近", icon: <Clock className="h-3 w-3" /> },
]

const rarityConfig: Record<BookRarity, {
  label: string
  border: string
  bg: string
  glow: string
  badge: string
  badgeText: string
}> = {
  common: {
    label: "普通",
    border: "border-slate-300",
    bg: "from-slate-100 via-white to-slate-50",
    glow: "",
    badge: "bg-gradient-to-r from-slate-400 to-slate-500",
    badgeText: "text-white",
  },
  rare: {
    label: "稀有",
    border: "border-blue-400",
    bg: "from-blue-100 via-cyan-50 to-blue-50",
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
    badge: "bg-gradient-to-r from-blue-500 to-cyan-500",
    badgeText: "text-white",
  },
  epic: {
    label: "史诗",
    border: "border-purple-400",
    bg: "from-purple-100 via-pink-50 to-purple-50",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.35)]",
    badge: "bg-gradient-to-r from-purple-500 to-pink-500",
    badgeText: "text-white",
  },
  legendary: {
    label: "传说",
    border: "border-amber-400",
    bg: "from-amber-100 via-yellow-50 to-orange-50",
    glow: "shadow-[0_0_25px_rgba(251,191,36,0.4)]",
    badge: "bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500",
    badgeText: "text-amber-900 font-bold",
  },
}

const sampleBooks: Book[] = [
  { id: "1", title: "小王子", author: "圣埃克苏佩里", cover: "🌟", rarity: "legendary", progress: 100, completed: true, locked: false, stars: 3, maxStars: 3, unlocksReward: "星际宠物", worldSymbol: "星际" },
  { id: "2", title: "夏洛的网", author: "E.B.怀特", cover: "🕷️", rarity: "epic", progress: 75, completed: false, locked: false, stars: 2, maxStars: 3, worldSymbol: "农场" },
  { id: "3", title: "绿野仙踪", author: "鲍姆", cover: "🌈", rarity: "rare", progress: 45, completed: false, locked: false, stars: 1, maxStars: 3, worldSymbol: "奇幻" },
  { id: "4", title: "爱丽丝梦游", author: "卡罗尔", cover: "🐰", rarity: "epic", progress: 0, completed: false, locked: false, stars: 0, maxStars: 3, worldSymbol: "仙境" },
  { id: "5", title: "海底两万里", author: "凡尔纳", cover: "🐙", rarity: "rare", progress: 20, completed: false, locked: false, stars: 0, maxStars: 3, worldSymbol: "深海" },
  { id: "6", title: "彼得潘", author: "巴里", cover: "🧚", rarity: "legendary", progress: 0, completed: false, locked: true, stars: 0, maxStars: 3, unlocksReward: "飞行翅膀", worldSymbol: "永无岛" },
]

interface BookCollectionProps {
  onBookSelect?: (bookId: string) => void
  onViewAll?: () => void
  onCategoryChange?: (category: string) => void
}

export function BookCollection({ onBookSelect, onViewAll, onCategoryChange }: BookCollectionProps) {
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState("all")
  const collectedCount = sampleBooks.filter(b => !b.locked).length
  const totalCount = sampleBooks.length

  const handleBookClick = (book: Book) => {
    if (book.locked) return
    setSelectedBook(book.id)
    onBookSelect?.(book.id)
  }

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId)
    onCategoryChange?.(categoryId)
  }

  return (
    <div className="px-4">
      {/* Section header with category filters */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-500 shadow-lg">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">魔法书籍</h2>
            <p className="text-[10px] text-muted-foreground">已收集 {collectedCount}/{totalCount}</p>
          </div>
        </div>
        <button 
          onClick={onViewAll}
          className="flex items-center gap-0.5 text-xs text-primary font-medium hover:underline"
        >
          全部 <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Category filter tabs - moved here, associated with book collection */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((category) => {
          const isActive = activeCategory === category.id
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              {category.icon}
              {category.label}
            </button>
          )
        })}
      </div>

      {/* Book grid - 3 columns */}
      <div className="grid grid-cols-3 gap-3">
        {sampleBooks.map((book) => {
          const config = rarityConfig[book.rarity]
          const isSelected = selectedBook === book.id
          
          return (
            <button
              key={book.id}
              onClick={() => handleBookClick(book)}
              className={cn(
                "relative flex flex-col items-center p-2.5 rounded-xl border-2 transition-all duration-300 overflow-hidden",
                `bg-gradient-to-b ${config.bg}`,
                config.border,
                config.glow,
                book.locked && "opacity-50 grayscale",
                isSelected && "ring-2 ring-primary ring-offset-2 scale-105",
                !book.locked && "hover:scale-105 active:scale-95"
              )}
            >
              {/* Rarity badge */}
              <div className={cn(
                "absolute -top-0.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-b-lg text-[8px] font-bold z-10",
                config.badge,
                config.badgeText
              )}>
                {config.label}
              </div>

              {/* Book cover */}
              <div className={cn(
                "relative w-full aspect-[3/4] rounded-lg flex items-center justify-center text-3xl mt-2 mb-1.5",
                "bg-white/70 backdrop-blur-sm border border-white/50"
              )}>
                {book.locked ? (
                  <div className="flex flex-col items-center gap-1">
                    <Lock className="h-6 w-6 text-muted-foreground" />
                    <span className="text-[8px] text-muted-foreground">未解锁</span>
                  </div>
                ) : (
                  <>
                    <span className="drop-shadow-lg">{book.cover}</span>
                    
                    {/* Completion badge */}
                    {book.completed && (
                      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <Trophy className="h-3 w-3 text-white" />
                      </div>
                    )}
                    
                    {/* Reward indicator */}
                    {book.unlocksReward && !book.completed && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                    )}
                    
                    {/* World symbol badge */}
                    {book.worldSymbol && (
                      <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-black/40 backdrop-blur-sm">
                        <span className="text-[7px] text-white font-medium">{book.worldSymbol}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Book title */}
              <p className="text-[10px] font-bold text-foreground truncate w-full text-center mb-1">
                {book.title}
              </p>

              {/* Stars */}
              <div className="flex gap-0.5">
                {[...Array(book.maxStars)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3 w-3 transition-all duration-300",
                      i < book.stars
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>

              {/* Progress bar for incomplete books */}
              {!book.locked && !book.completed && book.progress > 0 && (
                <div className="w-full mt-1.5">
                  <div className="h-1.5 rounded-full bg-gray-200/80 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
                      style={{ width: `${book.progress}%` }}
                    />
                  </div>
                  <p className="text-[8px] text-muted-foreground text-center mt-0.5">{book.progress}%</p>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Hidden books teaser */}
      <div className="mt-4 flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-200/50">
        <div className="flex -space-x-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-6 h-6 rounded-lg bg-gray-300 border-2 border-white flex items-center justify-center">
              <span className="text-[10px]">?</span>
            </div>
          ))}
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold text-purple-700">还有 3 本隐藏书籍等待发现</p>
        </div>
        <Zap className="h-4 w-4 text-purple-500" />
      </div>
    </div>
  )
}

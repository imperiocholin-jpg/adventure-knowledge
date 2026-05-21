"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  ChevronLeft, Bell, BookOpen, Star, Lock, Trophy, Sparkles,
  Flame, Clock, Search, SlidersHorizontal, X
} from "lucide-react"
import { BottomNavigation } from "@/components/game/bottom-navigation"

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
  worldSymbol: string
  readTime: string
  chapters: number
}

const allBooks: Book[] = [
  { id: "1", title: "小王子", author: "圣埃克苏佩里", cover: "🌟", rarity: "legendary", progress: 100, completed: true, locked: false, stars: 3, maxStars: 3, worldSymbol: "星际", readTime: "2小时", chapters: 12 },
  { id: "2", title: "夏洛的网", author: "E.B.怀特", cover: "🕷️", rarity: "epic", progress: 75, completed: false, locked: false, stars: 2, maxStars: 3, worldSymbol: "农场", readTime: "3小时", chapters: 15 },
  { id: "3", title: "绿野仙踪", author: "鲍姆", cover: "🌈", rarity: "rare", progress: 45, completed: false, locked: false, stars: 1, maxStars: 3, worldSymbol: "奇幻", readTime: "2.5小时", chapters: 10 },
  { id: "4", title: "爱丽丝梦游", author: "卡罗尔", cover: "🐰", rarity: "epic", progress: 0, completed: false, locked: false, stars: 0, maxStars: 3, worldSymbol: "仙境", readTime: "2小时", chapters: 8 },
  { id: "5", title: "海底两万里", author: "凡尔纳", cover: "🐙", rarity: "rare", progress: 20, completed: false, locked: false, stars: 0, maxStars: 3, worldSymbol: "深海", readTime: "4小时", chapters: 20 },
  { id: "6", title: "彼得潘", author: "巴里", cover: "🧚", rarity: "legendary", progress: 0, completed: false, locked: true, stars: 0, maxStars: 3, worldSymbol: "永无岛", readTime: "2小时", chapters: 10 },
  { id: "7", title: "木偶奇遇记", author: "科洛迪", cover: "🤥", rarity: "common", progress: 100, completed: true, locked: false, stars: 3, maxStars: 3, worldSymbol: "童话", readTime: "1.5小时", chapters: 8 },
  { id: "8", title: "格林童话", author: "格林兄弟", cover: "🏰", rarity: "rare", progress: 60, completed: false, locked: false, stars: 2, maxStars: 3, worldSymbol: "童话", readTime: "3小时", chapters: 16 },
  { id: "9", title: "安徒生童话", author: "安徒生", cover: "👸", rarity: "epic", progress: 30, completed: false, locked: false, stars: 1, maxStars: 3, worldSymbol: "童话", readTime: "3小时", chapters: 18 },
  { id: "10", title: "一千零一夜", author: "民间故事", cover: "🪔", rarity: "legendary", progress: 0, completed: false, locked: true, stars: 0, maxStars: 3, worldSymbol: "沙漠", readTime: "5小时", chapters: 25 },
  { id: "11", title: "西游记", author: "吴承恩", cover: "🐵", rarity: "legendary", progress: 15, completed: false, locked: false, stars: 0, maxStars: 3, worldSymbol: "神话", readTime: "6小时", chapters: 30 },
  { id: "12", title: "伊索寓言", author: "伊索", cover: "🦊", rarity: "common", progress: 80, completed: false, locked: false, stars: 2, maxStars: 3, worldSymbol: "寓言", readTime: "1小时", chapters: 6 },
]

const rarityConfig: Record<BookRarity, {
  label: string
  border: string
  bg: string
  glow: string
  badge: string
}> = {
  common: { label: "普通", border: "border-slate-300", bg: "from-slate-100 to-white", glow: "", badge: "bg-slate-500" },
  rare: { label: "稀有", border: "border-blue-400", bg: "from-blue-100 to-cyan-50", glow: "shadow-[0_0_12px_rgba(59,130,246,0.25)]", badge: "bg-gradient-to-r from-blue-500 to-cyan-500" },
  epic: { label: "史诗", border: "border-purple-400", bg: "from-purple-100 to-pink-50", glow: "shadow-[0_0_15px_rgba(168,85,247,0.3)]", badge: "bg-gradient-to-r from-purple-500 to-pink-500" },
  legendary: { label: "传说", border: "border-amber-400", bg: "from-amber-100 to-yellow-50", glow: "shadow-[0_0_20px_rgba(251,191,36,0.35)]", badge: "bg-gradient-to-r from-amber-400 to-orange-500" },
}

export default function BooksPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "popular" | "new" | "recent">("all")
  const [rarityFilter, setRarityFilter] = useState<BookRarity | "all">("all")
  const [showFilters, setShowFilters] = useState(false)

  const filteredBooks = allBooks.filter(book => {
    const matchesSearch = book.title.includes(searchQuery) || book.author.includes(searchQuery)
    const matchesRarity = rarityFilter === "all" || book.rarity === rarityFilter
    return matchesSearch && matchesRarity
  })

  const handleNavigation = (item: string) => {
    if (item === "home") router.push("/")
    if (item === "library") router.push("/library")
    if (item === "adventure") router.push("/adventure")
    if (item === "pets") router.push("/pets")
    if (item === "profile") router.push("/profile")
  }

  return (
    <div className="min-h-screen bg-background pb-24">
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
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">魔法书籍</h1>
          </div>
          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 hover:bg-muted transition-colors">
            <Bell className="h-5 w-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索书名、作者..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/60 border-none text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                showFilters ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {[
            { id: "all", label: "全部", icon: <Sparkles className="h-3 w-3" /> },
            { id: "popular", label: "热门", icon: <Flame className="h-3 w-3" /> },
            { id: "new", label: "最新", icon: <Star className="h-3 w-3" /> },
            { id: "recent", label: "最近", icon: <Clock className="h-3 w-3" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as typeof filter)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                filter === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Rarity filter - expandable */}
        {showFilters && (
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-xs text-muted-foreground py-1.5">稀有度:</span>
            {[
              { id: "all", label: "全部" },
              { id: "common", label: "普通" },
              { id: "rare", label: "稀有" },
              { id: "epic", label: "史诗" },
              { id: "legendary", label: "传说" },
            ].map((rarity) => (
              <button
                key={rarity.id}
                onClick={() => setRarityFilter(rarity.id as typeof rarityFilter)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  rarityFilter === rarity.id
                    ? "bg-foreground text-background"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                )}
              >
                {rarity.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-2xl p-3 border border-primary/20">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{allBooks.filter(b => !b.locked).length}</p>
              <p className="text-[10px] text-muted-foreground">已解锁</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-lg font-bold text-amber-500">{allBooks.filter(b => b.completed).length}</p>
              <p className="text-[10px] text-muted-foreground">已完成</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-500">{allBooks.reduce((sum, b) => sum + b.stars, 0)}</p>
              <p className="text-[10px] text-muted-foreground">收集星星</p>
            </div>
          </div>
        </div>
      </div>

      {/* Books grid */}
      <div className="px-4">
        <div className="grid grid-cols-3 gap-3">
          {filteredBooks.map((book) => {
            const config = rarityConfig[book.rarity]
            
            return (
              <button
                key={book.id}
                onClick={() => !book.locked && router.push(`/library/books/${book.id}`)}
                className={cn(
                  "relative flex flex-col items-center p-2.5 rounded-xl border-2 transition-all duration-300 overflow-hidden",
                  `bg-gradient-to-b ${config.bg}`,
                  config.border,
                  config.glow,
                  book.locked && "opacity-50 grayscale",
                  !book.locked && "hover:scale-105 active:scale-95"
                )}
              >
                {/* Rarity badge */}
                <div className={cn(
                  "absolute -top-0.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-b-lg text-[8px] font-bold text-white z-10",
                  config.badge
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
                      
                      {book.completed && (
                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                          <Trophy className="h-3 w-3 text-white" />
                        </div>
                      )}
                      
                      <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-black/40 backdrop-blur-sm">
                        <span className="text-[7px] text-white font-medium">{book.worldSymbol}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Book title */}
                <p className="text-[10px] font-bold text-foreground truncate w-full text-center mb-0.5">
                  {book.title}
                </p>
                <p className="text-[8px] text-muted-foreground truncate w-full text-center mb-1">
                  {book.author}
                </p>

                {/* Stars */}
                <div className="flex gap-0.5">
                  {[...Array(book.maxStars)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3 w-3",
                        i < book.stars ? "text-amber-400 fill-amber-400" : "text-gray-300"
                      )}
                    />
                  ))}
                </div>

                {/* Progress */}
                {!book.locked && !book.completed && book.progress > 0 && (
                  <div className="w-full mt-1.5">
                    <div className="h-1.5 rounded-full bg-gray-200/80 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
                        style={{ width: `${book.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeItem="library" onNavigate={handleNavigation} />
    </div>
  )
}

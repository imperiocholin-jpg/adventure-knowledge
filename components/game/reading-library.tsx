"use client"

import { BookOpen, ChevronRight, Play, Star, Trophy, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Book {
  id: string
  title: string
  cover: string
  progress?: number
  isCurrentlyReading?: boolean
  rarity?: "common" | "rare" | "epic"
  completed?: boolean
}

interface ReadingLibraryProps {
  currentBook?: Book
  recommendedBooks?: Book[]
  onContinueReading?: () => void
  onViewLibrary?: () => void
}

const defaultCurrentBook: Book = {
  id: "1",
  title: "小王子",
  cover: "📗",
  progress: 45,
  isCurrentlyReading: true,
  rarity: "rare",
}

const defaultRecommendedBooks: Book[] = [
  { id: "2", title: "夏洛的网", cover: "📕", rarity: "epic", completed: true },
  { id: "3", title: "绿野仙踪", cover: "📘", rarity: "rare" },
  { id: "4", title: "爱丽丝梦游仙境", cover: "📙", rarity: "common" },
  { id: "5", title: "海底两万里", cover: "📓", rarity: "epic" },
]

const rarityStyles = {
  common: { 
    border: "border-slate-200", 
    bg: "from-slate-100 to-slate-50",
    glow: "",
    badge: "bg-slate-400"
  },
  rare: { 
    border: "border-blue-200", 
    bg: "from-blue-100 to-cyan-50",
    glow: "shadow-[0_0_12px_rgba(59,130,246,0.2)]",
    badge: "bg-gradient-to-r from-blue-400 to-cyan-400"
  },
  epic: { 
    border: "border-purple-200", 
    bg: "from-purple-100 to-pink-50",
    glow: "shadow-[0_0_15px_rgba(168,85,247,0.25)]",
    badge: "bg-gradient-to-r from-purple-400 to-pink-400"
  },
}

export function ReadingLibrary({
  currentBook = defaultCurrentBook,
  recommendedBooks = defaultRecommendedBooks,
  onContinueReading,
  onViewLibrary,
}: ReadingLibraryProps) {
  const currentRarity = rarityStyles[currentBook.rarity || "common"]
  
  return (
    <div className="rounded-2xl bg-card p-4 shadow-lg border border-border/50 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-2xl pointer-events-none" />
      
      {/* Header */}
      <div className="mb-4 flex items-center justify-between relative">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/10 border border-primary/10">
            <BookOpen className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-card-foreground">阅读书架</h3>
            <p className="text-[10px] text-muted-foreground">已解锁 12 本书籍</p>
          </div>
        </div>
        <button 
          onClick={onViewLibrary}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        >
          全部
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Currently reading - enhanced collectible style */}
      {currentBook && (
        <div className={`mb-4 overflow-hidden rounded-xl bg-gradient-to-br ${currentRarity.bg} p-3 border-2 ${currentRarity.border} ${currentRarity.glow} relative`}>
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-primary/30 animate-float-slow"
                style={{
                  left: `${20 + i * 20}%`,
                  top: `${30 + (i % 2) * 40}%`,
                  animationDelay: `${i * 0.4}s`,
                }}
              />
            ))}
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              正在阅读
            </span>
            {/* Rarity indicator */}
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${currentRarity.badge}`}>
              {currentBook.rarity === "epic" ? "史诗" : currentBook.rarity === "rare" ? "稀有" : "普通"}
            </span>
          </div>
          
          <div className="flex items-center gap-3 relative">
            {/* Book cover with glow */}
            <div className={`relative flex h-18 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-white to-primary/5 text-4xl shadow-md border ${currentRarity.border}`}>
              {currentBook.cover}
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-lg" />
            </div>

            {/* Book info */}
            <div className="flex-1 min-w-0">
              <h4 className="mb-1.5 truncate text-sm font-bold text-card-foreground flex items-center gap-1">
                {currentBook.title}
                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              </h4>
              
              {/* Progress */}
              <div className="mb-2">
                <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>阅读进度</span>
                  <span className="font-semibold text-primary">{currentBook.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/80 border border-primary/10">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                    style={{ width: `${currentBook.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Continue button */}
            <Button 
              size="sm" 
              onClick={onContinueReading}
              className="rounded-xl bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 px-4 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <Play className="h-4 w-4 fill-current" />
            </Button>
          </div>
        </div>
      )}

      {/* Recommended books - collectible style */}
      <div>
        <div className="mb-2 text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Trophy className="h-3 w-3 text-amber-500" />
          推荐收藏
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {recommendedBooks.map((book) => {
            const bookRarity = rarityStyles[book.rarity || "common"]
            return (
              <button 
                key={book.id}
                className="group flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <div className={`relative flex h-16 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${bookRarity.bg} text-2xl border-2 ${bookRarity.border} ${bookRarity.glow} transition-all duration-200 group-hover:scale-110`}>
                  {book.cover}
                  {/* Completed badge */}
                  {book.completed && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
                      <Trophy className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="w-12 truncate text-center text-[10px] text-muted-foreground font-medium">{book.title}</span>
              </button>
            )
          })}
        </div>
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-8px); opacity: 0.6; }
        }
        .animate-float-slow {
          animation: float-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

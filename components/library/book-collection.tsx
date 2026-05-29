"use client"

import { useMemo, useState } from "react"
import { BookOpen, ChevronRight, Lock, Sparkles, Star, Trophy, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { buildLibraryDisplayBooks, getCatalogStats, type LibraryDisplayBook } from "@/lib/library/library-books"
import type { GradeBand } from "@/lib/library/moe-catalog-2020"

interface BookCollectionProps {
  gradeBand?: GradeBand | ""
  searchQuery?: string
  limit?: number
  onBookSelect?: (bookId: string, available: boolean) => void
  onViewAll?: () => void
}

export function BookCollection({
  gradeBand = "",
  searchQuery = "",
  limit = 12,
  onBookSelect,
  onViewAll,
}: BookCollectionProps) {
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const stats = getCatalogStats()

  const books = useMemo(
    () => buildLibraryDisplayBooks({ gradeBand, query: searchQuery }).slice(0, limit),
    [gradeBand, searchQuery, limit],
  )

  const handleBookClick = (book: LibraryDisplayBook) => {
    setSelectedBook(book.id)
    onBookSelect?.(book.id, book.contentAvailable)
  }

  return (
    <div className="px-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-500 shadow-lg">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">教育部推荐书目</h2>
            <p className="text-[10px] text-muted-foreground">
              目录 {stats.total} 种 · 已上架 {stats.available} 种
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
        >
          全部 <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {books.map((book) => {
          const isSelected = selectedBook === book.id
          return (
            <button
              key={book.moeId}
              type="button"
              onClick={() => handleBookClick(book)}
              className={cn(
                "relative flex flex-col items-center rounded-xl border-2 border-border/50 bg-card p-2.5 transition-all",
                !book.contentAvailable && "opacity-80",
                isSelected && "ring-2 ring-primary ring-offset-2",
                book.contentAvailable ? "hover:scale-[1.02] active:scale-[0.98]" : "cursor-default",
              )}
            >
              <div className="relative mb-1.5 flex aspect-[3/4] w-full items-center justify-center rounded-lg border border-border/40 bg-muted/30 text-3xl">
                {!book.contentAvailable ? (
                  <div className="flex flex-col items-center gap-1 px-1">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <span className="text-center text-[8px] leading-tight text-amber-700">即将上架</span>
                  </div>
                ) : (
                  <span>{book.cover}</span>
                )}
                {book.contentAvailable && (
                  <div className="absolute -right-1 -top-1 rounded-full bg-emerald-500 px-1 py-0.5 text-[7px] font-bold text-white">
                    可读
                  </div>
                )}
              </div>

              <p className="mb-1 line-clamp-2 w-full text-center text-[10px] font-bold leading-tight text-foreground">
                {book.title}
              </p>

              <span className="mb-1 rounded-full bg-muted px-1.5 py-0.5 text-[8px] text-muted-foreground">
                {book.gradeBandLabel}
              </span>

              <span className="line-clamp-1 w-full text-center text-[8px] text-muted-foreground">{book.regionName}</span>
            </button>
          )
        })}
      </div>

      {books.length === 0 && (
        <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">没有匹配的书籍</p>
      )}

      <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-purple-200/50 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 p-3">
        <div className="flex -space-x-2">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="flex h-6 w-6 items-center justify-center rounded-lg border-2 border-white bg-gray-200 text-[10px]"
            >
              ?
            </div>
          ))}
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold text-purple-700">
            还有 {Math.max(0, stats.total - limit)} 本在目录中等待解锁电子版
          </p>
        </div>
        <Zap className="h-4 w-4 text-purple-500" />
      </div>
    </div>
  )
}

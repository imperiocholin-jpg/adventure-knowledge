"use client"

import { useMemo, useState } from "react"
import { BookOpen, ChevronRight } from "lucide-react"
import { BookCoverThumb } from "@/components/library/book-cover-thumb"
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
            <h2 className="text-base font-bold text-foreground">我的书架</h2>
            <p className="text-[10px] text-muted-foreground">
              共 {stats.total} 本 · 可阅读 {stats.available} 本
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
              key={book.id}
              type="button"
              onClick={() => handleBookClick(book)}
              className={cn(
                "relative flex flex-col items-center rounded-xl border-2 border-border/50 bg-card p-2.5 transition-all",
                isSelected && "ring-2 ring-primary ring-offset-2",
                book.contentAvailable ? "hover:scale-[1.02] active:scale-[0.98]" : "cursor-default",
              )}
            >
              <div className="relative mb-1.5 w-full">
                <BookCoverThumb
                  bookId={book.id}
                  title={book.title}
                  emoji={book.cover}
                  imageSrc={book.coverImageSrc}
                  className="aspect-[3/4] w-full"
                  sizes="120px"
                />
                {book.contentAvailable ? (
                  <div className="absolute -right-1 -top-1 rounded-full bg-emerald-500 px-1 py-0.5 text-[7px] font-bold text-white">
                    可读
                  </div>
                ) : (
                  <div className="absolute -right-1 -top-1 rounded-full bg-slate-400/90 px-1 py-0.5 text-[7px] font-bold text-white">
                    待上线
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

      <div className="mt-4 rounded-xl border border-border/50 bg-muted/30 p-3 text-center">
        <p className="text-[10px] text-muted-foreground">
          书架展示 book 目录全部 {stats.total} 本书 · 按年级归入六个冒险区域
        </p>
      </div>
    </div>
  )
}

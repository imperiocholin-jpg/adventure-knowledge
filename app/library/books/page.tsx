"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BookCoverThumb } from "@/components/library/book-cover-thumb"
import { cn } from "@/lib/utils"
import { BookOpen, ChevronLeft, Search, SlidersHorizontal, X } from "lucide-react"
import { BottomNavigation } from "@/components/game/bottom-navigation"
import { PlayerPageShell, PlayerStickyHeader } from "@/components/layout/player-page-shell"
import { READING_LEVEL_FILTERS } from "@/components/library/search-filter"
import { bookReadPath } from "@/lib/library/book-id-route"
import { buildLibraryDisplayBooks, getCatalogStats } from "@/lib/library/library-books"
import type { GradeBand } from "@/lib/library/moe-catalog-2020"

export default function BooksPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [gradeBand, setGradeBand] = useState<GradeBand | "">("")
  const [showFilters, setShowFilters] = useState(false)
  const stats = getCatalogStats()

  const books = useMemo(
    () => buildLibraryDisplayBooks({ gradeBand, query: searchQuery }),
    [gradeBand, searchQuery],
  )

  const handleNavigation = (item: string) => {
    if (item === "home") router.push("/")
    if (item === "library") router.push("/library")
    if (item === "adventure") router.push("/adventure")
    if (item === "pets") router.push("/pets")
    if (item === "profile") router.push("/profile")
  }

  return (
    <PlayerPageShell className="bg-background">
      <PlayerStickyHeader className="border-b border-border/50 bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => router.push("/library")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 transition-colors hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">我的书架</h1>
          </div>
          <div className="w-10" />
        </div>

        <div className="px-4 pb-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索书名、作者、区域…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-10 w-full rounded-xl border-none bg-muted/60 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                showFilters ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground",
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showFilters ? (
          <div className="flex flex-wrap gap-2 px-4 pb-3">
            {READING_LEVEL_FILTERS.map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => setGradeBand(level.gradeBand)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium",
                  gradeBand === level.gradeBand || (level.gradeBand === "" && gradeBand === "")
                    ? `${level.color} ring-2 ring-primary/30`
                    : "border-transparent bg-muted/50 text-muted-foreground",
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
        ) : null}
      </PlayerStickyHeader>

      <div className="px-4 py-3">
        <p className="text-center text-xs text-muted-foreground">
          共 {stats.total} 本 · 可阅读 {stats.available} 本 · 年级仅筛选，不限制区域闯关
        </p>
      </div>

      <div className="px-4">
        <div className="grid grid-cols-3 gap-3">
          {books.map((book) => (
            <button
              key={book.id}
              type="button"
              onClick={() => book.contentAvailable && router.push(bookReadPath(book.id))}
              className={cn(
                "relative flex flex-col items-center rounded-xl border-2 border-border/50 bg-card p-2.5 transition-all",
                book.contentAvailable && "hover:scale-[1.02] active:scale-[0.98]",
                !book.contentAvailable && "cursor-default",
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
              <p className="mb-1 line-clamp-2 w-full text-center text-[10px] font-bold leading-tight">{book.title}</p>
              <p className="mb-1 line-clamp-1 w-full text-center text-[8px] text-muted-foreground">{book.author}</p>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[8px]">{book.gradeBandLabel}</span>
              <span className="mt-1 line-clamp-1 text-[8px] text-muted-foreground">{book.regionName}</span>
            </button>
          ))}
        </div>
      </div>

      <BottomNavigation activeItem="library" onNavigate={handleNavigation} />
    </PlayerPageShell>
  )
}

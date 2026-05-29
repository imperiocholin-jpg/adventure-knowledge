"use client"

import { useState } from "react"
import { Search, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GradeBand } from "@/lib/library/moe-catalog-2020"

/** 与教育部目录推荐学段一致；仅筛选排序，不限制区域解锁 */
export const READING_LEVEL_FILTERS: { id: string; gradeBand: GradeBand | ""; label: string; color: string }[] = [
  { id: "all", gradeBand: "", label: "全部学段", color: "bg-muted text-muted-foreground border-transparent" },
  { id: "level1", gradeBand: "1-2", label: "1～2 年级", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { id: "level2", gradeBand: "3-4", label: "3～4 年级", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "level3", gradeBand: "5-6", label: "5～6 年级", color: "bg-purple-100 text-purple-700 border-purple-200" },
]

interface SearchFilterProps {
  onSearch?: (query: string) => void
  onLevelChange?: (gradeBand: GradeBand | "") => void
}

export function SearchFilter({ onSearch, onLevelChange }: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeLevel, setActiveLevel] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  const handleLevelClick = (filterId: string) => {
    setActiveLevel(filterId)
    const filter = READING_LEVEL_FILTERS.find((item) => item.id === filterId)
    onLevelChange?.(filter?.gradeBand ?? "")
  }

  return (
    <div className="space-y-2 px-4">
      <div className="relative">
        <div className="relative flex items-center gap-2 rounded-2xl border border-border/50 bg-card px-4 py-2.5 shadow-sm">
          <Search className="h-4.5 w-4.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索书名、作者或区域…"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value)
              onSearch?.(event.target.value)
            }}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
              showFilters ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="animate-in slide-in-from-top-2 rounded-xl border border-border/50 bg-card p-3 shadow-sm duration-200">
          <p className="mb-1 text-xs font-medium text-muted-foreground">推荐学段（教育部目录）</p>
          <p className="mb-2 text-[10px] text-muted-foreground">仅用于筛选与排序，不影响冒险区域解锁。</p>
          <div className="flex flex-wrap gap-2">
            {READING_LEVEL_FILTERS.map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => handleLevelClick(level.id)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all",
                  activeLevel === level.id
                    ? `${level.color} ring-2 ring-primary/30 ring-offset-1`
                    : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted",
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Search, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

const readingLevels = [
  { id: "level1", label: "1-2年级", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { id: "level2", label: "3-4年级", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "level3", label: "5-6年级", color: "bg-purple-100 text-purple-700 border-purple-200" },
]

interface SearchFilterProps {
  onSearch?: (query: string) => void
  onLevelChange?: (level: string) => void
}

export function SearchFilter({ onSearch, onLevelChange }: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeLevel, setActiveLevel] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const handleLevelClick = (levelId: string) => {
    const newLevel = activeLevel === levelId ? null : levelId
    setActiveLevel(newLevel)
    onLevelChange?.(newLevel || "")
  }

  return (
    <div className="px-4 space-y-2">
      {/* Search bar only */}
      <div className="relative">
        <div className="relative flex items-center gap-2 bg-card rounded-2xl px-4 py-2.5 shadow-sm border border-border/50">
          <Search className="h-4.5 w-4.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索书籍、作者或关键词..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              onSearch?.(e.target.value)
            }}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
              showFilters 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expanded level filters */}
      {showFilters && (
        <div className="bg-card rounded-xl p-3 border border-border/50 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <p className="text-xs font-medium text-muted-foreground mb-2">阅读等级</p>
          <div className="flex flex-wrap gap-2">
            {readingLevels.map((level) => (
              <button
                key={level.id}
                onClick={() => handleLevelClick(level.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  activeLevel === level.id
                    ? `${level.color} ring-2 ring-offset-1 ring-primary/30`
                    : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
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

"use client"

import { cn } from "@/lib/utils"
import { Calendar, Sparkles } from "lucide-react"

interface JournalEntry {
  id: string
  title: string
  icon: string
  date: string
  highlight?: boolean
}

interface AdventureJournalProps {
  entries?: JournalEntry[]
}

const defaultEntries: JournalEntry[] = [
  { id: "1", title: "发现冰雪之巅", icon: "🏔️", date: "今天", highlight: true },
  { id: "2", title: "毛毛升到12级", icon: "🐕", date: "昨天" },
  { id: "3", title: "连续阅读7天", icon: "🔥", date: "3天前" },
]

export function AdventureJournal({
  entries = defaultEntries,
}: AdventureJournalProps) {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
      {/* Header - minimal */}
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-emerald-500" />
        <span className="text-sm font-bold text-foreground">冒险日记</span>
      </div>
      
      {/* Only 3 entries - softer, scrapbook style */}
      <div className="space-y-2">
        {entries.slice(0, 3).map((entry) => (
          <div 
            key={entry.id}
            className={cn(
              "flex items-center gap-3 p-2.5 rounded-xl transition-all",
              entry.highlight 
                ? "bg-gradient-to-r from-emerald-50 to-teal-50" 
                : "bg-muted/30"
            )}
          >
            {/* Icon */}
            <div className="relative w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-lg">
              {entry.icon}
              {entry.highlight && (
                <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-500 animate-pulse" />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{entry.title}</p>
            </div>
            
            {/* Date */}
            <span className="text-[10px] text-muted-foreground">{entry.date}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

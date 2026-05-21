"use client"

import { Home, BookOpen, Compass, PawPrint, User, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = "home" | "library" | "adventure" | "pets" | "profile"

interface BottomNavigationProps {
  activeItem?: NavItem
  onNavigate?: (item: NavItem) => void
}

const navItems: { id: NavItem; label: string; icon: typeof Home }[] = [
  { id: "home", label: "首页", icon: Home },
  { id: "library", label: "书架", icon: BookOpen },
  { id: "adventure", label: "冒险", icon: Compass },
  { id: "pets", label: "宠物", icon: PawPrint },
  { id: "profile", label: "我的", icon: User },
]

export function BottomNavigation({
  activeItem = "home",
  onNavigate,
}: BottomNavigationProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
      {/* Floating navigation container */}
      <nav className="relative flex items-center justify-around rounded-2xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-2 py-1.5">
        {/* Decorative gradient orbs */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute -top-10 left-1/4 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
          <div className="absolute -top-10 right-1/4 w-20 h-20 bg-game-xp/10 rounded-full blur-2xl" />
        </div>
        
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.id
          const isAdventure = item.id === "adventure"

          // Special rendering for Adventure button
          if (isAdventure) {
            return (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                className="relative flex flex-col items-center -mt-5"
              >
                {/* Floating circle button */}
                <div className={cn(
                  "relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300",
                  isActive 
                    ? "bg-gradient-to-br from-primary to-emerald-600 shadow-[0_4px_20px_rgba(34,197,94,0.5)]" 
                    : "bg-gradient-to-br from-primary/90 to-emerald-600/90 shadow-lg"
                )}>
                  <Icon 
                    className="h-7 w-7 text-white" 
                    strokeWidth={2}
                  />
                  {/* Sparkle */}
                  <Sparkles className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 text-amber-300 animate-pulse" />
                </div>
                {/* Label below the circle */}
                <span className="text-[10px] font-semibold text-primary mt-1">
                  {item.label}
                </span>
              </button>
            )
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 transition-all duration-300",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Active background glow */}
              {isActive && (
                <>
                  <div className="absolute inset-0 rounded-xl bg-primary/10" />
                  <div className="absolute -inset-1 rounded-xl bg-primary/15 blur-md -z-10" />
                </>
              )}
              
              {/* Icon */}
              <Icon 
                className={cn(
                  "h-5 w-5 transition-all duration-300",
                  isActive && "scale-110 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                )} 
                fill={isActive ? "currentColor" : "none"}
                strokeWidth={isActive ? 1.5 : 2}
              />
              
              {/* Label */}
              <span className={cn(
                "text-[10px] font-medium transition-all duration-300 relative",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
